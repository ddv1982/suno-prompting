import type { PromptMode } from '@shared/types/domain';
import type {
  TraceDecisionEvent,
  TraceErrorEvent,
  TraceLLMCallEvent,
  TraceRun,
  TraceRunAction,
} from '@shared/types/trace';

export interface TraceCollectorInit {
  readonly runId: string;
  readonly action: TraceRunAction;
  readonly promptMode: PromptMode;
  readonly rng: {
    readonly seed: number;
    readonly algorithm: 'mulberry32' | 'lcg' | 'other';
  };
}

export interface TraceCollector {
  /** True only when a collector is present (debug mode ON). */
  readonly enabled: true;

  readonly runId: string;
  readonly capturedAt: string;

  addRunEvent: (type: 'run.start' | 'run.end', summary: string) => void;
  addDecisionEvent: (
    event: Omit<TraceDecisionEvent, keyof TraceDecisionEvent & ('id' | 'ts' | 'tMs' | 'type')>
  ) => void;
  addLLMCallEvent: (
    event: Omit<TraceLLMCallEvent, keyof TraceLLMCallEvent & ('id' | 'ts' | 'tMs' | 'type')>
  ) => void;
  addErrorEvent: (error: TraceErrorEvent['error']) => void;

  finalize: () => TraceRun;
}

function nowIso(ms: number): string {
  return new Date(ms).toISOString();
}

function computeCounts(events: TraceRun['events']): {
  readonly eventCount: number;
  readonly llmCallCount: number;
  readonly decisionCount: number;
  readonly hadErrors: boolean;
} {
  let llmCallCount = 0;
  let decisionCount = 0;
  let hadErrors = false;

  for (const event of events) {
    if (event.type === 'llm.call') llmCallCount += 1;
    if (event.type === 'decision') decisionCount += 1;
    if (event.type === 'error') hadErrors = true;
  }

  return {
    eventCount: events.length,
    llmCallCount,
    decisionCount,
    hadErrors,
  };
}

class TraceBuilder implements TraceCollector {
  public readonly enabled = true as const;
  public readonly runId: string;
  public readonly capturedAt: string;

  private readonly action: TraceRunAction;
  private readonly promptMode: PromptMode;
  private readonly rng: TraceCollectorInit['rng'];

  private readonly startMs: number;
  private counter = 0;
  private readonly events: TraceRun['events'] = [];

  constructor(init: TraceCollectorInit) {
    this.runId = init.runId;
    this.action = init.action;
    this.promptMode = init.promptMode;
    this.rng = init.rng;

    this.startMs = Date.now();
    this.capturedAt = nowIso(this.startMs);
  }

  private nextBaseEvent(): { readonly id: string; readonly ts: string; readonly tMs: number } {
    this.counter += 1;
    const ms = Date.now();
    return {
      id: `${this.runId}.${this.counter}`,
      ts: nowIso(ms),
      tMs: ms - this.startMs,
    };
  }

  addRunEvent(type: 'run.start' | 'run.end', summary: string): void {
    this.events.push({
      ...this.nextBaseEvent(),
      type,
      summary,
    });
  }

  addDecisionEvent(event: Omit<TraceDecisionEvent, 'id' | 'ts' | 'tMs' | 'type'>): void {
    this.events.push({
      ...this.nextBaseEvent(),
      type: 'decision',
      ...event,
    });
  }

  addLLMCallEvent(event: Omit<TraceLLMCallEvent, 'id' | 'ts' | 'tMs' | 'type'>): void {
    this.events.push({
      ...this.nextBaseEvent(),
      type: 'llm.call',
      ...event,
    });
  }

  addErrorEvent(error: TraceErrorEvent['error']): void {
    this.events.push({
      ...this.nextBaseEvent(),
      type: 'error',
      error,
    });
  }

  finalize(): TraceRun {
    const counts = computeCounts(this.events);

    return {
      version: 1,
      runId: this.runId,
      capturedAt: this.capturedAt,
      action: this.action,
      promptMode: this.promptMode,
      rng: this.rng,
      stats: {
        ...counts,
        persistedBytes: 0,
        truncatedForCap: false,
      },
      events: [...this.events],
    };
  }
}

/**
 * Create a collector when debug mode is ON.
 *
 * IMPORTANT: Callers should pass `undefined` when debug mode is OFF.
 */
export function createTraceCollector(init: TraceCollectorInit): TraceCollector {
  return new TraceBuilder(init);
}

/**
 * Convenience helper that returns `undefined` when debug mode is OFF.
 *
 * This helps keep tracing overhead effectively zero when disabled.
 */
export function maybeCreateTraceCollector(
  enabled: boolean,
  init: TraceCollectorInit
): TraceCollector | undefined {
  return enabled ? createTraceCollector(init) : undefined;
}
