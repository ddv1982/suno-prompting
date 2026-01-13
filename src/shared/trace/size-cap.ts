import { truncateTextWithMarker } from './truncate';

import type { TraceEvent, TraceLLMCallEvent, TraceRun } from '@shared/types/trace';


export const TRACE_PERSISTED_BYTES_CAP = 64 * 1024;

export function byteLengthUtf8(input: string): number {
  // TextEncoder is available in browsers, Bun, and modern Node.
  return new TextEncoder().encode(input).length;
}

function computeCounts(events: readonly TraceEvent[]): {
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

function computePersistedBytesFixedPoint(trace: TraceRun): number {
  // persistedBytes is included in the JSON payload, so we compute a small fixed-point.
  let persistedBytes = 0;

  for (let i = 0; i < 6; i += 1) {
    const withBytes: TraceRun = {
      ...trace,
      stats: {
        ...trace.stats,
        persistedBytes,
      },
    };
    const nextBytes = byteLengthUtf8(JSON.stringify(withBytes));
    if (nextBytes === persistedBytes) return persistedBytes;
    persistedBytes = nextBytes;
  }

  return persistedBytes;
}

function finalizeTrace(trace: TraceRun, truncatedForCap: boolean, hadErrorsBaseline: boolean): TraceRun {
  const counts = computeCounts(trace.events);

  const base: TraceRun = {
    ...trace,
    stats: {
      ...trace.stats,
      ...counts,
      hadErrors: counts.hadErrors || hadErrorsBaseline,
      truncatedForCap,
      persistedBytes: 0,
    },
  };

  const persistedBytes = computePersistedBytesFixedPoint(base);

  return {
    ...base,
    stats: {
      ...base.stats,
      persistedBytes,
    },
  };
}

function dropAdvancedFieldsFromLLMCallEvent(event: TraceLLMCallEvent): TraceLLMCallEvent {
  const { messages: _messages, ...requestWithoutMessages } = event.request;
  const { rawText: _rawText, ...responseWithoutRawText } = event.response;

  return {
    ...event,
    request: requestWithoutMessages,
    response: responseWithoutRawText,
  };
}

function mapEvents(trace: TraceRun, map: (event: TraceEvent) => TraceEvent | null): TraceRun {
  const nextEvents: TraceEvent[] = [];
  for (const event of trace.events) {
    const mapped = map(event);
    if (mapped) nextEvents.push(mapped);
  }
  return { ...trace, events: nextEvents };
}

function compactTextFields(trace: TraceRun, limits: {
  readonly previewChars: number;
  readonly decisionWhyChars: number;
  readonly decisionBranchChars: number;
  readonly runSummaryChars: number;
  readonly labelChars: number;
}): TraceRun {
  return mapEvents(trace, (event) => {
    if (event.type === 'llm.call') {
      return {
        ...event,
        label: truncateTextWithMarker(event.label, limits.labelChars).text,
        request: {
          ...event.request,
          inputSummary: {
            ...event.request.inputSummary,
            preview: truncateTextWithMarker(event.request.inputSummary.preview, limits.previewChars).text,
          },
        },
        response: {
          ...event.response,
          previewText: truncateTextWithMarker(event.response.previewText, limits.previewChars).text,
        },
      };
    }

    if (event.type === 'decision') {
      return {
        ...event,
        branchTaken: truncateTextWithMarker(event.branchTaken, limits.decisionBranchChars).text,
        why: truncateTextWithMarker(event.why, limits.decisionWhyChars).text,
      };
    }

    if (event.type === 'run.start' || event.type === 'run.end') {
      return {
        ...event,
        summary: truncateTextWithMarker(event.summary, limits.runSummaryChars).text,
      };
    }

    if (event.type === 'error') {
      return {
        ...event,
        error: {
          ...event.error,
          message: truncateTextWithMarker(event.error.message, limits.decisionWhyChars).text,
        },
      };
    }

    return event;
  });
}

function dropDecisionSelectionDetails(trace: TraceRun): TraceRun {
  return mapEvents(trace, (event) => {
    if (event.type !== 'decision' || !event.selection) return event;
    const { candidatesPreview: _candidatesPreview, rolls: _rolls, ...selectionRest } = event.selection;
    return {
      ...event,
      selection: selectionRest,
    };
  });
}

function dropRunEndEvents(trace: TraceRun): TraceRun {
  return mapEvents(trace, (event) => (event.type === 'run.end' ? null : event));
}

function dropAttempts(trace: TraceRun): TraceRun {
  return mapEvents(trace, (event) => {
    if (event.type !== 'llm.call') return event;
    const { attempts: _attempts, ...rest } = event;
    return rest;
  });
}

function dropProviderOptions(trace: TraceRun): TraceRun {
  return mapEvents(trace, (event) => {
    if (event.type !== 'llm.call') return event;
    const { providerOptions: _providerOptions, ...requestRest } = event.request;
    return {
      ...event,
      request: requestRest,
    };
  });
}

function dropErrorEvents(trace: TraceRun): TraceRun {
  return mapEvents(trace, (event) => (event.type === 'error' ? null : event));
}

function pruneDecisionsIfNeeded(trace: TraceRun, maxDecisionsToKeep: number): TraceRun {
  // Deterministic last-resort: keep the earliest N decision events.
  let decisionSeen = 0;
  return mapEvents(trace, (event) => {
    if (event.type !== 'decision') return event;
    decisionSeen += 1;
    return decisionSeen <= maxDecisionsToKeep ? event : null;
  });
}

export function enforceTraceSizeCap(trace: TraceRun, capBytes: number = TRACE_PERSISTED_BYTES_CAP): TraceRun {
  const cap = Math.max(1, Math.floor(capBytes));

  const hadErrorsBaseline = trace.events.some((e) => e.type === 'error');
  let truncatedForCap = false;
  let next = finalizeTrace(trace, false, hadErrorsBaseline);

  if (next.stats.persistedBytes <= cap) return next;

  // 1) Drop advanced-only fields first.
  truncatedForCap = true;
  next = finalizeTrace(
    mapEvents(next, (event) => (event.type === 'llm.call' ? dropAdvancedFieldsFromLLMCallEvent(event) : event)),
    truncatedForCap,
    hadErrorsBaseline
  );
  if (next.stats.persistedBytes <= cap) return next;

  // 2) Drop lowest-value events first (run.end).
  next = finalizeTrace(dropRunEndEvents(next), truncatedForCap, hadErrorsBaseline);
  if (next.stats.persistedBytes <= cap) return next;

  // 3) Drop bulky-but-non-essential fields.
  next = finalizeTrace(dropAttempts(next), truncatedForCap, hadErrorsBaseline);
  if (next.stats.persistedBytes <= cap) return next;

  next = finalizeTrace(dropProviderOptions(next), truncatedForCap, hadErrorsBaseline);
  if (next.stats.persistedBytes <= cap) return next;

  // 4) Drop decision selection details (keep method/index/count).
  next = finalizeTrace(dropDecisionSelectionDetails(next), truncatedForCap, hadErrorsBaseline);
  if (next.stats.persistedBytes <= cap) return next;

  // 5) Compact text previews and descriptions.
  next = finalizeTrace(
    compactTextFields(next, {
      previewChars: 300,
      decisionWhyChars: 300,
      decisionBranchChars: 200,
      runSummaryChars: 200,
      labelChars: 120,
    }),
    truncatedForCap,
    hadErrorsBaseline
  );
  if (next.stats.persistedBytes <= cap) return next;

  // 6) As a further fallback, drop error events (but preserve hadErrors signal).
  next = finalizeTrace(dropErrorEvents(next), truncatedForCap, hadErrorsBaseline);
  if (next.stats.persistedBytes <= cap) return next;

  // 7) Aggressive compaction.
  next = finalizeTrace(
    compactTextFields(next, {
      previewChars: 120,
      decisionWhyChars: 120,
      decisionBranchChars: 120,
      runSummaryChars: 120,
      labelChars: 80,
    }),
    truncatedForCap,
    hadErrorsBaseline
  );
  if (next.stats.persistedBytes <= cap) return next;

  // 8) Absolute last resort: prune decision events from the end, preserving LLM calls.
  next = finalizeTrace(pruneDecisionsIfNeeded(next, 25), truncatedForCap, hadErrorsBaseline);
  return next.stats.persistedBytes <= cap
    ? next
    : finalizeTrace(pruneDecisionsIfNeeded(next, 10), truncatedForCap, hadErrorsBaseline);
}
