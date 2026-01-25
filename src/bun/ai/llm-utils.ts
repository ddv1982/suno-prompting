import { generateText } from 'ai';

import { generateWithOllama } from '@bun/ai/ollama-client';
import { createLogger } from '@bun/logger';
import { normalizeTraceError, traceError } from '@bun/trace';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError, getErrorMessage } from '@shared/errors';
import { redactSecretsDeep, redactSecretsInText, truncateTextWithMarker } from '@shared/trace';

import type { OllamaGenerationOptions } from '@bun/ai/ollama-client';
import type { TraceCollector } from '@bun/trace';
import type { AIProvider } from '@shared/types/config';
import type { TraceProviderInfo } from '@shared/types/trace';
import type { LanguageModel } from 'ai';

const log = createLogger('LLMUtils');

export interface CallLLMOptions {
  getModel: () => LanguageModel;
  systemPrompt: string;
  userPrompt: string;
  errorContext: string;
  /** Optional Ollama endpoint - when provided, uses direct Ollama client to bypass Bun fetch bug */
  ollamaEndpoint?: string;
  /** Optional timeout in ms (defaults to OLLAMA.GENERATION_TIMEOUT_MS for Ollama, AI.TIMEOUT_MS for cloud) */
  timeoutMs?: number;
  /** Optional max retries for cloud providers (defaults to AI.MAX_RETRIES) */
  maxRetries?: number;

  /** Optional trace collector (undefined when debug mode OFF). */
  trace?: TraceCollector;
  /** Optional stable label for trace UI (defaults to errorContext). */
  traceLabel?: string;
  /** Optional ollama model name for tracing (e.g. 'gemma3:4b'). */
  ollamaModel?: string;

  /** Optional provider options passed to AI SDK (and recorded in trace, redacted+truncated). */
  providerOptions?: Record<string, unknown>;
  /** Optional Ollama generation options (temperature, maxTokens, contextLength) passed to the Ollama API. */
  ollamaOptions?: OllamaGenerationOptions;
}

interface AttemptTraceError {
  readonly type: string;
  readonly message: string;
  readonly status?: number;
  readonly providerRequestId?: string;
}

function isAIProvider(value: string): value is AIProvider {
  return value === 'groq' || value === 'openai' || value === 'anthropic';
}

function normalizeProviderId(raw: string | undefined): AIProvider | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (isAIProvider(lower)) return lower;

  // Best-effort normalization for provider identifiers.
  if (lower.includes('groq')) return 'groq';
  if (lower.includes('openai')) return 'openai';
  if (lower.includes('anthropic')) return 'anthropic';
  return undefined;
}

function inferCloudProviderInfo(model: LanguageModel): { providerId?: AIProvider; modelId?: string } {
  if (model && typeof model === 'object') {
    const m = model as Record<string, unknown>;
    const providerRaw = typeof m.provider === 'string' ? m.provider : undefined;
    const modelId = typeof m.modelId === 'string' ? m.modelId : undefined;
    return {
      providerId: normalizeProviderId(providerRaw),
      modelId,
    };
  }

  if (typeof model === 'string') {
    // GlobalProviderModelId; cannot infer provider with certainty.
    return { modelId: model };
  }

  return {};
}

function nowIso(ms: number): string {
  return new Date(ms).toISOString();
}

function computePromptSummary(systemPrompt: string, userPrompt: string): {
  readonly messageCount: number;
  readonly totalChars: number;
  readonly preview: string;
  readonly messages: { role: 'system' | 'user'; content: string }[];
} {
  const messageCount = 2;
  const totalChars = systemPrompt.length + userPrompt.length;

  const previewRaw = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;
  const previewRedacted = redactSecretsInText(previewRaw);
  const preview = truncateTextWithMarker(previewRedacted, 900).text;

  const messages = [
    { role: 'system' as const, content: truncateTextWithMarker(redactSecretsInText(systemPrompt), 3000).text },
    { role: 'user' as const, content: truncateTextWithMarker(redactSecretsInText(userPrompt), 3000).text },
  ];

  return { messageCount, totalChars, preview, messages };
}

function buildAttemptError(normalized: { type: string; message: string; status?: number; providerRequestId?: string }): AttemptTraceError {
  return {
    type: normalized.type,
    message: normalized.message,
    status: normalized.status,
    providerRequestId: normalized.providerRequestId,
  };
}

/** Wrap an error into AIGenerationError with context */
function wrapAIError(error: unknown, errorContext: string): AIGenerationError {
  if (error instanceof AIGenerationError) return error;
  return new AIGenerationError(
    `Failed to ${errorContext}: ${getErrorMessage(error)}`,
    error instanceof Error ? error : undefined
  );
}

/** Execute LLM call without tracing (fast path) */
async function callLLMWithoutTrace(options: CallLLMOptions): Promise<string> {
  const { getModel, systemPrompt, userPrompt, errorContext, ollamaEndpoint, timeoutMs, maxRetries, providerOptions, ollamaOptions } = options;

  try {
    let rawResponse: string;
    if (ollamaEndpoint) {
      const timeout = timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
      log.info('callLLM:ollama', { errorContext, endpoint: ollamaEndpoint, timeout });
      rawResponse = await generateWithOllama(ollamaEndpoint, systemPrompt, userPrompt, timeout, undefined, ollamaOptions);
    } else {
      const timeout = timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
      const retries = maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
      log.info('callLLM:cloud', { errorContext, timeout, retries });
      const { text } = await generateText({
        model: getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: retries,
        abortSignal: AbortSignal.timeout(timeout),
        providerOptions: providerOptions as Parameters<typeof generateText>[0]['providerOptions'],
        onFinish: ({ response, usage, finishReason }) => {
          log.info('generateText:onFinish', {
            finishReason,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            modelId: response.modelId,
          });
        },
      });
      rawResponse = text;
    }

    if (!rawResponse?.trim()) {
      throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
    }
    return rawResponse;
  } catch (error: unknown) {
    throw wrapAIError(error, errorContext);
  }
}

type TraceLLMCallEvent = import('@shared/types/trace').TraceLLMCallEvent;
type TraceAttempt = NonNullable<TraceLLMCallEvent['attempts']>[number];
type TraceTelemetry = NonNullable<TraceLLMCallEvent['telemetry']>;

/** Options for executing a traced LLM attempt */
interface TracedAttemptOptions {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number | undefined;
  errorContext: string;
  attempt: number;
  totalAttempts: number;
}

/** Execute single Ollama attempt for traced call */
async function executeOllamaAttempt(
  ollamaEndpoint: string,
  opts: TracedAttemptOptions,
  ollamaOptions?: OllamaGenerationOptions
): Promise<{ text: string; telemetry: TraceTelemetry; latencyMs: number }> {
  const { systemPrompt, userPrompt, timeoutMs, errorContext, attempt, totalAttempts } = opts;
  const timeout = timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
  log.info('callLLM:ollama', { errorContext, endpoint: ollamaEndpoint, timeout, attempt, totalAllowedAttempts: totalAttempts });
  const startMs = Date.now();
  const text = await generateWithOllama(ollamaEndpoint, systemPrompt, userPrompt, timeout, undefined, ollamaOptions);
  const latencyMs = Date.now() - startMs;
  return { text, telemetry: { latencyMs }, latencyMs };
}

/** Execute single cloud attempt for traced call */
async function executeCloudAttempt(
  getModel: () => LanguageModel,
  providerOptions: Record<string, unknown> | undefined,
  opts: TracedAttemptOptions
): Promise<{ text: string; telemetry: TraceTelemetry; latencyMs: number; modelId?: string }> {
  const { systemPrompt, userPrompt, timeoutMs, errorContext, attempt, totalAttempts } = opts;
  const timeout = timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
  log.info('callLLM:cloud', { errorContext, timeout, attempt, totalAllowedAttempts: totalAttempts });
  const startMs = Date.now();

  // Capture onFinish data for trace telemetry (onFinish is always called by AI SDK)
  const finishData = { tokensIn: 0, tokensOut: 0, finishReason: 'unknown', modelId: '' };

  const result = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: 0, // Manual retries in trace mode
    abortSignal: AbortSignal.timeout(timeout),
    providerOptions: providerOptions as Parameters<typeof generateText>[0]['providerOptions'],
    onFinish: ({ response, usage, finishReason }) => {
      finishData.tokensIn = usage.inputTokens ?? 0;
      finishData.tokensOut = usage.outputTokens ?? 0;
      finishData.finishReason = finishReason;
      finishData.modelId = response.modelId;
      log.info('generateText:onFinish', {
        finishReason,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        modelId: response.modelId,
      });
    },
  });
  const latencyMs = Date.now() - startMs;

  return {
    text: result.text,
    modelId: finishData.modelId || result.response.modelId,
    latencyMs,
    telemetry: {
      latencyMs,
      finishReason: finishData.finishReason,
      tokensIn: finishData.tokensIn,
      tokensOut: finishData.tokensOut,
    },
  };
}

/** Build initial provider info for tracing */
function buildInitialProviderInfo(ollamaEndpoint: string | undefined, ollamaModel: string | undefined, getModel: () => LanguageModel): TraceProviderInfo {
  if (ollamaEndpoint) {
    return { id: 'ollama', model: ollamaModel ?? 'unknown', locality: 'local' };
  }
  const inferred = inferCloudProviderInfo(getModel());
  return { id: inferred.providerId ?? 'openai', model: inferred.modelId ?? 'unknown', locality: 'cloud' };
}

/** Execute LLM call with tracing */
async function callLLMWithTrace(options: CallLLMOptions, trace: TraceCollector): Promise<string> {
  const { getModel, systemPrompt, userPrompt, errorContext, ollamaEndpoint, timeoutMs, maxRetries, traceLabel, ollamaModel, providerOptions, ollamaOptions } = options;

  try {
    const label = traceLabel ?? errorContext;
    const requestSummary = computePromptSummary(systemPrompt, userPrompt);
    const maxRetriesResolved = maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
    const totalAllowedAttempts = Math.max(1, Math.floor(maxRetriesResolved) + 1);

    const attempts: TraceAttempt[] = [];
    let lastError: unknown;
    let provider = buildInitialProviderInfo(ollamaEndpoint, ollamaModel, getModel);
    let responseText = '';
    let telemetry: TraceTelemetry | undefined;

    for (let attempt = 1; attempt <= totalAllowedAttempts; attempt += 1) {
      const startedMs = Date.now();
      const attemptOpts: TracedAttemptOptions = {
        systemPrompt, userPrompt, timeoutMs, errorContext, attempt, totalAttempts: totalAllowedAttempts,
      };
      try {
        if (ollamaEndpoint) {
          const result = await executeOllamaAttempt(ollamaEndpoint, attemptOpts, ollamaOptions);
          responseText = result.text;
          telemetry = result.telemetry;
          attempts.push({ attempt, startedAt: nowIso(startedMs), endedAt: nowIso(startedMs + result.latencyMs), latencyMs: result.latencyMs });
        } else {
          const result = await executeCloudAttempt(getModel, providerOptions, attemptOpts);
          responseText = result.text;
          telemetry = result.telemetry;
          if (result.modelId) provider = { ...provider, model: result.modelId };
          attempts.push({ attempt, startedAt: nowIso(startedMs), endedAt: nowIso(startedMs + result.latencyMs), latencyMs: result.latencyMs });
        }
        break;
      } catch (error: unknown) {
        lastError = error;
        const endedMs = Date.now();
        attempts.push({ attempt, startedAt: nowIso(startedMs), endedAt: nowIso(endedMs), latencyMs: endedMs - startedMs, error: buildAttemptError(normalizeTraceError(error)) });
        if (attempt >= totalAllowedAttempts) break;
      }
    }

    if (!responseText?.trim()) {
      if (lastError instanceof Error) throw lastError;
      if (lastError) throw new AIGenerationError(`Failed to ${errorContext}: Unknown error`);
      throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
    }

    const tracedProviderOptions = providerOptions ? (redactSecretsDeep(providerOptions) as Record<string, unknown>) : undefined;
    trace.addLLMCallEvent({
      label: truncateTextWithMarker(label, 160).text,
      provider,
      request: { maxRetries: maxRetriesResolved, providerOptions: tracedProviderOptions, inputSummary: { messageCount: requestSummary.messageCount, totalChars: requestSummary.totalChars, preview: requestSummary.preview }, messages: requestSummary.messages },
      response: { previewText: truncateTextWithMarker(redactSecretsInText(responseText), 900).text, rawText: truncateTextWithMarker(redactSecretsInText(responseText), 7000).text },
      telemetry,
      attempts: attempts.length > 0 ? attempts : undefined,
    });

    return responseText;
  } catch (error: unknown) {
    traceError(trace, error);
    throw wrapAIError(error, options.errorContext);
  }
}

/**
 * Shared helper for making LLM calls with consistent error handling.
 * Supports both cloud providers (via AI SDK) and local Ollama (via direct HTTP client).
 */
export async function callLLM(options: CallLLMOptions): Promise<string> {
  return options.trace ? callLLMWithTrace(options, options.trace) : callLLMWithoutTrace(options);
}

/**
 * Infer mood from Suno V5 styles based on keyword matching.
 * Used when generating titles in Direct Mode to provide better context.
 */
function inferMoodFromStyles(styles: string[]): string {
  const stylesLower = styles.map(s => s.toLowerCase()).join(' ');

  // Check for mood keywords in styles
  if (/(dark|heavy|intense|aggressive|brutal|chaotic|doom)/i.test(stylesLower)) {
    return 'dark';
  }
  if (/(upbeat|energetic|fast|driving|vibrant|electric)/i.test(stylesLower)) {
    return 'energetic';
  }
  if (/(calm|peaceful|ambient|ethereal|atmospheric|gentle|soft)/i.test(stylesLower)) {
    return 'calm';
  }
  if (/(romantic|love|sweet|tender|intimate)/i.test(stylesLower)) {
    return 'romantic';
  }
  if (/(melanchol|sad|emotional|nostalgic|wistful)/i.test(stylesLower)) {
    return 'melancholic';
  }
  if (/(dreamy|psychedelic|surreal|hypnotic|spacey)/i.test(stylesLower)) {
    return 'dreamy';
  }

  // Default to 'creative' if no specific mood detected
  return 'creative';
}

/**
 * Generate a title for Direct Mode (Suno V5 Styles).
 * Used by both Quick Vibes and Creative Boost engines.
 * 
 * @param description - User's description
 * @param styles - Suno V5 styles array
 * @param getModel - Function to get the language model
 * @param ollamaEndpoint - Optional Ollama endpoint for offline mode
 */
export async function generateDirectModeTitle(
  description: string,
  styles: string[],
  getModel: () => LanguageModel,
  ollamaEndpoint?: string,
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string }
): Promise<string> {
  try {
    const { generateTitle } = await import('./content-generator');

    const cleanDescription = description.trim();
    const styleText = styles.join(', ');
    
    // Infer mood from styles instead of hardcoding 'creative'
    const mood = inferMoodFromStyles(styles);
    
    // Build enhanced description that includes all styles context
    const titleDescription = cleanDescription
      ? `${cleanDescription}\n\nSuno V5 styles: ${styleText}`
      : `Song with Suno V5 styles: ${styleText}`;

    // Use first style as genre hint, but pass full context in description
    const genre = styles[0] || 'music';
    
    log.info('generateDirectModeTitle', { 
      stylesCount: styles.length, 
      inferredMood: mood, 
      hasDescription: !!cleanDescription,
      offline: !!ollamaEndpoint,
    });
    
    const result = await generateTitle({
      description: titleDescription,
      genre,
      mood,
      getModel,
      ollamaEndpoint,
      trace: traceRuntime?.trace,
      traceLabel: traceRuntime?.traceLabel,
    });
    return result.title;
  } catch (error: unknown) {
    log.warn('generateDirectModeTitle:failed', {
      error: getErrorMessage(error),
    });
    return 'Untitled';
  }
}
