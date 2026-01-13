/**
 * Timeline Event - Renders a single trace event with timestamp.
 *
 * @module components/prompt-editor/debug-drawer/timeline-event
 */

import { DecisionCard } from './decision-card';
import { ErrorCard } from './error-card';
import { LLMCallCard } from './llm-call-card';
import { RunEventCard } from './run-event-card';

import type { TraceEvent } from '@shared/types';
import type { ReactElement } from 'react';

type TimelineEventProps = {
  event: TraceEvent;
};

function formatTimestamp(tMs: number): string {
  if (tMs < 1000) return `+${tMs}ms`;
  return `+${(tMs / 1000).toFixed(2)}s`;
}

export function TimelineEvent({ event }: TimelineEventProps): ReactElement {
  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

      {/* Timeline dot */}
      <div
        className="absolute left-0 top-3 size-4 rounded-full border-2 border-background bg-muted flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="size-1.5 rounded-full bg-foreground/60" />
      </div>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground font-mono mb-1">{formatTimestamp(event.tMs)}</div>

      {/* Event card */}
      <div className="pb-4">
        {event.type === 'run.start' || event.type === 'run.end' ? (
          <RunEventCard event={event} />
        ) : event.type === 'llm.call' ? (
          <LLMCallCard event={event} />
        ) : event.type === 'decision' ? (
          <DecisionCard event={event} />
        ) : event.type === 'error' ? (
          <ErrorCard event={event} />
        ) : null}
      </div>
    </div>
  );
}
