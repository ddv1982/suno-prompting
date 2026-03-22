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

const log = createLogger('AIRequestRunner');

export interface AIRequestOptions {
  getModel: () => LanguageModel;
  systemPrompt: string;
  userPrompt: string;
  errorContext: string;
  ollamaEndpoint?: string;
  timeoutMs?: number;
  maxRetries?: number;
  trace?: TraceCollector;
  traceLabel?: string;
  ollamaModel?: string;
  providerOptions?: Record<string, unknown>;
  ollamaOptions?: OllamaGenerationOptions;
}

interface AttemptTraceError {
  readonly type: string;
  readonly message: string;
  readonly status?: number;
  readonly providerRequestId?: string;
}

type TraceLLMCallEvent = import('@shared/types/trace').TraceLLMCallEvent;
type TraceAttempt = NonNullable<TraceLLMCallEvent['attempts']>[number];
type TraceTelemetry = NonNullable<TraceLLMCallEvent['telemetry']>;

interface TracedAttemptOptions {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number | undefined;
  errorContext: string;
  attempt: number;
  totalAttempts: number;
}

function isAIProvider(value: string): value is AIProvider {
  return value === 'groq' || value === 'openai' || value === 'anthropic';
}

function normalizeProviderId(raw: string | undefined): AIProvider | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (isAIProvider(lower)) return lower;
  if (lower.includes('groq')) return 'groq';
  if (lower.includes('openai')) return 'openai';
  if (lower.includes('anthropic')) return 'anthropic';
  return undefined;
}

function inferCloudProviderInfo(model: LanguageModel): {
  providerId?: AIProvider;
  modelId?: string;
} {
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
    return { modelId: model };
  }

  return {};
}

function nowIso(ms: number): string {
  return new Date(ms).toISOString();
}

function computePromptSummary(
  systemPrompt: string,
  userPrompt: string
): {
  readonly messageCount: number;
  readonly totalChars: number;
  readonly preview: string;
  readonly messages: { role: 'system' | 'user'; content: string }[];
} {
  const previewRaw = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;
  return {
    messageCount: 2,
    totalChars: systemPrompt.length + userPrompt.length,
    preview: truncateTextWithMarker(redactSecretsInText(previewRaw), 900).text,
    messages: [
      {
        role: 'system',
        content: truncateTextWithMarker(redactSecretsInText(systemPrompt), 3000).text,
      },
      {
        role: 'user',
        content: truncateTextWithMarker(redactSecretsInText(userPrompt), 3000).text,
      },
    ],
  };
}

function buildAttemptError(normalized: {
  type: string;
  message: string;
  status?: number;
  providerRequestId?: string;
}): AttemptTraceError {
  return {
    type: normalized.type,
    message: normalized.message,
    status: normalized.status,
    providerRequestId: normalized.providerRequestId,
  };
}

function wrapAIError(error: unknown, errorContext: string): AIGenerationError {
  if (error instanceof AIGenerationError) return error;
  return new AIGenerationError(
    `Failed to ${errorContext}: ${getErrorMessage(error)}`,
    error instanceof Error ? error : undefined
  );
}

async function executeOllamaAttempt(
  ollamaEndpoint: string,
  opts: TracedAttemptOptions,
  ollamaOptions?: OllamaGenerationOptions
): Promise<{ text: string; telemetry: TraceTelemetry; latencyMs: number }> {
  const timeout = opts.timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
  log.info('request:ollama', {
    errorContext: opts.errorContext,
    endpoint: ollamaEndpoint,
    timeout,
    attempt: opts.attempt,
    totalAllowedAttempts: opts.totalAttempts,
  });
  const startMs = Date.now();
  const text = await generateWithOllama(
    ollamaEndpoint,
    opts.systemPrompt,
    opts.userPrompt,
    timeout,
    undefined,
    ollamaOptions
  );
  const latencyMs = Date.now() - startMs;
  return { text, telemetry: { latencyMs }, latencyMs };
}

async function executeCloudAttempt(
  getModel: () => LanguageModel,
  providerOptions: Record<string, unknown> | undefined,
  opts: TracedAttemptOptions
): Promise<{ text: string; telemetry: TraceTelemetry; latencyMs: number; modelId?: string }> {
  const timeout = opts.timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
  log.info('request:cloud', {
    errorContext: opts.errorContext,
    timeout,
    attempt: opts.attempt,
    totalAllowedAttempts: opts.totalAttempts,
  });
  const startMs = Date.now();
  const finishData = {
    usage: { inputTokens: 0, outputTokens: 0 },
    finishReason: 'unknown',
    modelId: '',
  };

  const result = await generateText({
    model: getModel(),
    system: opts.systemPrompt,
    prompt: opts.userPrompt,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(timeout),
    providerOptions: providerOptions as Parameters<typeof generateText>[0]['providerOptions'],
    onFinish: ({ response, usage, finishReason }) => {
      finishData.usage = {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      };
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
      tokensIn: finishData.usage.inputTokens,
      tokensOut: finishData.usage.outputTokens,
    },
  };
}

function buildInitialProviderInfo(
  ollamaEndpoint: string | undefined,
  ollamaModel: string | undefined,
  getModel: () => LanguageModel
): TraceProviderInfo {
  if (ollamaEndpoint) {
    return { id: 'ollama', model: ollamaModel ?? 'unknown', locality: 'local' };
  }
  const inferred = inferCloudProviderInfo(getModel());
  return {
    id: inferred.providerId ?? 'openai',
    model: inferred.modelId ?? 'unknown',
    locality: 'cloud',
  };
}

async function runWithoutTrace(options: AIRequestOptions): Promise<string> {
  try {
    let rawResponse: string;
    if (options.ollamaEndpoint) {
      const timeout = options.timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
      log.info('request:ollama', {
        errorContext: options.errorContext,
        endpoint: options.ollamaEndpoint,
        timeout,
      });
      rawResponse = await generateWithOllama(
        options.ollamaEndpoint,
        options.systemPrompt,
        options.userPrompt,
        timeout,
        undefined,
        options.ollamaOptions
      );
    } else {
      const timeout = options.timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
      const retries = options.maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
      log.info('request:cloud', { errorContext: options.errorContext, timeout, retries });
      const { text } = await generateText({
        model: options.getModel(),
        system: options.systemPrompt,
        prompt: options.userPrompt,
        maxRetries: retries,
        abortSignal: AbortSignal.timeout(timeout),
        providerOptions: options.providerOptions as Parameters<
          typeof generateText
        >[0]['providerOptions'],
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
      throw new AIGenerationError(`Empty response from AI model (${options.errorContext})`);
    }
    return rawResponse;
  } catch (error: unknown) {
    throw wrapAIError(error, options.errorContext);
  }
}

function buildTraceRequestPayload(
  options: AIRequestOptions,
  requestSummary: ReturnType<typeof computePromptSummary>,
  maxRetriesResolved: number
): TraceLLMCallEvent['request'] {
  return {
    maxRetries: maxRetriesResolved,
    providerOptions: options.providerOptions
      ? (redactSecretsDeep(options.providerOptions) as Record<string, unknown>)
      : undefined,
    inputSummary: {
      messageCount: requestSummary.messageCount,
      totalChars: requestSummary.totalChars,
      preview: requestSummary.preview,
    },
    messages: requestSummary.messages,
  };
}

function buildTraceResponsePayload(
  responseText: string,
  telemetry: TraceTelemetry | undefined,
  attempts: TraceAttempt[]
): Pick<TraceLLMCallEvent, 'response' | 'telemetry' | 'attempts'> {
  return {
    response: {
      previewText: truncateTextWithMarker(redactSecretsInText(responseText), 900).text,
      rawText: truncateTextWithMarker(redactSecretsInText(responseText), 7000).text,
    },
    telemetry,
    attempts: attempts.length > 0 ? attempts : undefined,
  };
}

async function executeTracedAttempts(
  options: AIRequestOptions,
  totalAllowedAttempts: number,
  provider: TraceProviderInfo
): Promise<{
  responseText: string;
  telemetry: TraceTelemetry | undefined;
  provider: TraceProviderInfo;
  attempts: TraceAttempt[];
  lastError: unknown;
}> {
  const attempts: TraceAttempt[] = [];
  let lastError: unknown;
  let responseText = '';
  let telemetry: TraceTelemetry | undefined;
  let resolvedProvider = provider;

  for (let attempt = 1; attempt <= totalAllowedAttempts; attempt += 1) {
    const startedMs = Date.now();
    const attemptOpts: TracedAttemptOptions = {
      systemPrompt: options.systemPrompt,
      userPrompt: options.userPrompt,
      timeoutMs: options.timeoutMs,
      errorContext: options.errorContext,
      attempt,
      totalAttempts: totalAllowedAttempts,
    };
    try {
      if (options.ollamaEndpoint) {
        const result = await executeOllamaAttempt(
          options.ollamaEndpoint,
          attemptOpts,
          options.ollamaOptions
        );
        responseText = result.text;
        telemetry = result.telemetry;
        attempts.push({
          attempt,
          startedAt: nowIso(startedMs),
          endedAt: nowIso(startedMs + result.latencyMs),
          latencyMs: result.latencyMs,
        });
      } else {
        const result = await executeCloudAttempt(
          options.getModel,
          options.providerOptions,
          attemptOpts
        );
        responseText = result.text;
        telemetry = result.telemetry;
        if (result.modelId) resolvedProvider = { ...resolvedProvider, model: result.modelId };
        attempts.push({
          attempt,
          startedAt: nowIso(startedMs),
          endedAt: nowIso(startedMs + result.latencyMs),
          latencyMs: result.latencyMs,
        });
      }
      break;
    } catch (error: unknown) {
      lastError = error;
      const endedMs = Date.now();
      attempts.push({
        attempt,
        startedAt: nowIso(startedMs),
        endedAt: nowIso(endedMs),
        latencyMs: endedMs - startedMs,
        error: buildAttemptError(normalizeTraceError(error)),
      });
      if (attempt >= totalAllowedAttempts) break;
    }
  }

  return { responseText, telemetry, provider: resolvedProvider, attempts, lastError };
}

async function runWithTrace(options: AIRequestOptions, trace: TraceCollector): Promise<string> {
  try {
    const label = options.traceLabel ?? options.errorContext;
    const requestSummary = computePromptSummary(options.systemPrompt, options.userPrompt);
    const maxRetriesResolved = options.maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
    const totalAllowedAttempts = Math.max(1, Math.floor(maxRetriesResolved) + 1);

    const initialProvider = buildInitialProviderInfo(
      options.ollamaEndpoint,
      options.ollamaModel,
      options.getModel
    );
    const { responseText, telemetry, provider, attempts, lastError } = await executeTracedAttempts(
      options,
      totalAllowedAttempts,
      initialProvider
    );

    if (!responseText?.trim()) {
      if (lastError instanceof Error) throw lastError;
      if (lastError)
        throw new AIGenerationError(`Failed to ${options.errorContext}: Unknown error`);
      throw new AIGenerationError(`Empty response from AI model (${options.errorContext})`);
    }

    trace.addLLMCallEvent({
      label: truncateTextWithMarker(label, 160).text,
      provider,
      request: buildTraceRequestPayload(options, requestSummary, maxRetriesResolved),
      ...buildTraceResponsePayload(responseText, telemetry, attempts),
    });

    return responseText;
  } catch (error: unknown) {
    traceError(trace, error);
    throw wrapAIError(error, options.errorContext);
  }
}

export async function runAIRequest(options: AIRequestOptions): Promise<string> {
  return options.trace ? runWithTrace(options, options.trace) : runWithoutTrace(options);
}
