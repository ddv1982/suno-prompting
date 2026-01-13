import { generateText } from 'ai';

import { generateWithOllama } from '@bun/ai/ollama-client';
import { createLogger } from '@bun/logger';
import { normalizeTraceError, traceError } from '@bun/trace';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError } from '@shared/errors';
import { redactSecretsDeep, redactSecretsInText, truncateTextWithMarker } from '@shared/trace';

import type { TraceCollector } from '@bun/trace';
import type { AIProvider } from '@shared/types/config';
import type { TraceProviderInfo } from '@shared/types/trace';
import type { LanguageModel } from 'ai';

const log = createLogger('LLMUtils');

export type CallLLMOptions = {
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
};

type AttemptTraceError = {
  readonly type: string;
  readonly message: string;
  readonly status?: number;
  readonly providerRequestId?: string;
};

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
  readonly messages: Array<{ role: 'system' | 'user'; content: string }>;
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

/**
 * Shared helper for making LLM calls with consistent error handling.
 * Supports both cloud providers (via AI SDK) and local Ollama (via direct HTTP client).
 * 
 * When ollamaEndpoint is provided, uses direct Ollama client to bypass Bun fetch
 * empty body bug (#6932).
 */
export async function callLLM(options: CallLLMOptions): Promise<string> {
  const {
    getModel,
    systemPrompt,
    userPrompt,
    errorContext,
    ollamaEndpoint,
    timeoutMs,
    maxRetries,
    trace,
    traceLabel,
    ollamaModel,
    providerOptions,
  } = options;

  // Fast-path: when debug tracing is OFF, keep behavior and overhead minimal.
  if (!trace) {
    try {
      let rawResponse: string;

      if (ollamaEndpoint) {
        // Use direct Ollama client to bypass Bun fetch empty body bug
        const timeout = timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
        log.info('callLLM:ollama', { errorContext, endpoint: ollamaEndpoint, timeout });
        rawResponse = await generateWithOllama(
          ollamaEndpoint,
          systemPrompt,
          userPrompt,
          timeout
        );
      } else {
        // Use AI SDK for cloud providers
        const timeout = timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
        const retries = maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
        log.info('callLLM:cloud', { errorContext, timeout, retries });
        const { text } = await generateText({
          model: getModel(),
          system: systemPrompt,
          prompt: userPrompt,
          maxRetries: retries,
          abortSignal: AbortSignal.timeout(timeout),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- AI SDK providerOptions is dynamically typed per-provider
          providerOptions: providerOptions as any,
        });
        rawResponse = text;
      }

      if (!rawResponse?.trim()) {
        throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
      }

      return rawResponse;
    } catch (error: unknown) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to ${errorContext}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  try {
    const label = traceLabel ?? errorContext;
    const requestSummary = computePromptSummary(systemPrompt, userPrompt);

    const maxRetriesResolved = maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
    const totalAllowedAttempts = Math.max(1, Math.floor(maxRetriesResolved) + 1);

    const attempts: NonNullable<import('@shared/types/trace').TraceLLMCallEvent['attempts']> = [];
    let lastError: unknown;

    // Provider/model info.
    let provider: TraceProviderInfo;
    if (ollamaEndpoint) {
      provider = {
        id: 'ollama',
        model: ollamaModel ?? 'unknown',
        locality: 'local',
      };
    } else {
      const inferred = inferCloudProviderInfo(getModel());
      provider = {
        id: inferred.providerId ?? 'openai',
        model: inferred.modelId ?? 'unknown',
        locality: 'cloud',
      };
    }

    let responseText = '';
    let telemetry: NonNullable<import('@shared/types/trace').TraceLLMCallEvent['telemetry']> | undefined;
    // Note: request ids are captured in error normalization when present.

    for (let attempt = 1; attempt <= totalAllowedAttempts; attempt += 1) {
      const startedMs = Date.now();
      try {
        if (ollamaEndpoint) {
          const timeout = timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
          log.info('callLLM:ollama', { errorContext, endpoint: ollamaEndpoint, timeout, attempt, totalAllowedAttempts });
          responseText = await generateWithOllama(
            ollamaEndpoint,
            systemPrompt,
            userPrompt,
            timeout
          );

          const endedMs = Date.now();
          attempts.push({
            attempt,
            startedAt: nowIso(startedMs),
            endedAt: nowIso(endedMs),
            latencyMs: endedMs - startedMs,
          });

          telemetry = { latencyMs: endedMs - startedMs };
          break;
        }

        const timeout = timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
        log.info('callLLM:cloud', { errorContext, timeout, attempt, totalAllowedAttempts });

        const result = await generateText({
          model: getModel(),
          system: systemPrompt,
          prompt: userPrompt,
          // We perform manual retries in trace mode.
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(timeout),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- AI SDK providerOptions is dynamically typed per-provider
          providerOptions: providerOptions as any,
        });

        responseText = result.text;
        provider = {
          ...provider,
          model: result.response.modelId || provider.model,
        };
        const endedMs = Date.now();
        attempts.push({
          attempt,
          startedAt: nowIso(startedMs),
          endedAt: nowIso(endedMs),
          latencyMs: endedMs - startedMs,
        });

        telemetry = {
          latencyMs: endedMs - startedMs,
          finishReason: result.finishReason,
          tokensIn: result.usage.inputTokens,
          tokensOut: result.usage.outputTokens,
        };

        break;
      } catch (error: unknown) {
        lastError = error;
        const endedMs = Date.now();
        const normalized = normalizeTraceError(error);

        attempts.push({
          attempt,
          startedAt: nowIso(startedMs),
          endedAt: nowIso(endedMs),
          latencyMs: endedMs - startedMs,
          error: buildAttemptError(normalized),
        });

        // Retry on subsequent attempt if we have budget.
        if (attempt < totalAllowedAttempts) {
          continue;
        }

        // No more retries.
        break;
      }
    }

    if (!responseText?.trim()) {
      if (lastError) {
        if (lastError instanceof Error) {
          throw lastError;
        }
        throw new AIGenerationError(
          `Failed to ${errorContext}: Unknown error`,
          undefined
        );
      }
      throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
    }

    const previewText = truncateTextWithMarker(redactSecretsInText(responseText), 900).text;
    const rawText = truncateTextWithMarker(redactSecretsInText(responseText), 7000).text;

    const tracedProviderOptions = providerOptions
      ? (redactSecretsDeep(providerOptions) as Record<string, unknown>)
      : undefined;

    trace.addLLMCallEvent({
      label: truncateTextWithMarker(label, 160).text,
      provider,
      request: {
        maxRetries: maxRetriesResolved,
        providerOptions: tracedProviderOptions,
        inputSummary: {
          messageCount: requestSummary.messageCount,
          totalChars: requestSummary.totalChars,
          preview: requestSummary.preview,
        },
        messages: requestSummary.messages,
      },
      response: {
        previewText,
        rawText,
      },
      telemetry,
      attempts: attempts.length > 0 ? attempts : undefined,
    });

    return responseText;
  } catch (error: unknown) {
    // Emit a stable, safe error event (and keep the thrown error user-safe).
    traceError(trace, error);

    if (error instanceof AIGenerationError) throw error;

    throw new AIGenerationError(
      `Failed to ${errorContext}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
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
    
    const result = await generateTitle(titleDescription, genre, mood, getModel, undefined, ollamaEndpoint, traceRuntime);
    return result.title;
  } catch (error: unknown) {
    log.warn('generateDirectModeTitle:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'Untitled';
  }
}
