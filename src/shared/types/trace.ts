import type { AIProvider } from '@shared/types/config';
import type { PromptMode } from '@shared/types/domain';

export type TraceVersion = 1;

export type TraceRunAction =
  | 'generate.full'
  | 'generate.quickVibes'
  | 'generate.creativeBoost'
  | 'refine'
  | 'remix'
  | 'remix.title'
  | 'remix.genre'
  | 'remix.instruments'
  | 'remix.mood'
  | 'remix.styleTags'
  | 'remix.recording'
  | 'convert.max'
  | 'convert.nonMax';

export type TraceRun = {
  readonly version: TraceVersion;
  readonly runId: string;
  readonly capturedAt: string;
  readonly action: TraceRunAction;
  readonly promptMode: PromptMode;
  readonly rng: {
    readonly seed: number;
    readonly algorithm: 'mulberry32' | 'lcg' | 'other';
  };
  readonly stats: {
    readonly eventCount: number;
    readonly llmCallCount: number;
    readonly decisionCount: number;
    readonly hadErrors: boolean;
    readonly persistedBytes: number;
    readonly truncatedForCap: boolean;
  };
  readonly events: TraceEvent[];
};

export type TraceEvent = TraceRunEvent | TraceDecisionEvent | TraceLLMCallEvent | TraceErrorEvent;

export type TraceBaseEvent = {
  readonly id: string;
  readonly ts: string;
  readonly tMs: number;
};

export type TraceRunEvent = TraceBaseEvent & {
  readonly type: 'run.start' | 'run.end';
  readonly summary: string;
};

export type TraceDecisionDomain =
  | 'genre'
  | 'mood'
  | 'instruments'
  | 'styleTags'
  | 'recording'
  | 'bpm'
  | 'other';

export type TraceDecisionEvent = TraceBaseEvent & {
  readonly type: 'decision';
  readonly domain: TraceDecisionDomain;
  readonly key: string;
  readonly branchTaken: string;
  readonly why: string;
  readonly selection?: {
    readonly method: 'pickRandom' | 'shuffleSlice' | 'weightedChance' | 'index';
    readonly chosenIndex?: number;
    readonly candidatesCount?: number;
    readonly candidatesPreview?: readonly string[];
    readonly rolls?: readonly number[];
  };
};

export type TraceProviderInfo = {
  readonly id: AIProvider | 'ollama';
  readonly model: string;
  readonly locality: 'cloud' | 'local';
};

export type TraceLLMCallEvent = TraceBaseEvent & {
  readonly type: 'llm.call';
  readonly label: string;
  readonly provider: TraceProviderInfo;
  readonly request: {
    readonly temperature?: number;
    readonly maxTokens?: number;
    readonly maxRetries?: number;
    readonly providerOptions?: Record<string, unknown>;
    readonly inputSummary: {
      readonly messageCount: number;
      readonly totalChars: number;
      readonly preview: string;
    };
    readonly messages?: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>;
  };
  readonly response: {
    readonly previewText: string;
    readonly rawText?: string;
  };
  readonly telemetry?: {
    readonly latencyMs?: number;
    readonly finishReason?: string;
    readonly tokensIn?: number;
    readonly tokensOut?: number;
  };
  readonly attempts?: Array<{
    readonly attempt: number;
    readonly startedAt: string;
    readonly endedAt: string;
    readonly latencyMs: number;
    readonly error?: { type: string; message: string; status?: number; providerRequestId?: string };
  }>;
};

export type TraceErrorType =
  | 'validation'
  | 'ollama.unavailable'
  | 'ollama.model_missing'
  | 'ollama.timeout'
  | 'ai.generation'
  | 'storage'
  | 'invariant'
  | 'unknown';

export type TraceErrorEvent = TraceBaseEvent & {
  readonly type: 'error';
  readonly error: {
    readonly type: TraceErrorType;
    readonly message: string;
    readonly status?: number;
    readonly providerRequestId?: string;
  };
};
