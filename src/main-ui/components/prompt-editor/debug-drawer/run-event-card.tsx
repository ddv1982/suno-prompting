/**
 * Run Event Card - Renders run.start and run.end events.
 *
 * @module components/prompt-editor/debug-drawer/run-event-card
 */

import { Play, Square } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { TraceRunEvent } from '@shared/types';
import type { ReactElement } from 'react';

interface RunEventCardProps {
  event: TraceRunEvent;
}

export function RunEventCard({ event }: RunEventCardProps): ReactElement {
  const isStart = event.type === 'run.start';

  return (
    <div className="rounded-lg border bg-card/50 p-3 flex items-center gap-3">
      <div className="shrink-0">
        {isStart ? (
          <Play className="size-4 text-green-500" aria-hidden="true" />
        ) : (
          <Square className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant={isStart ? 'default' : 'secondary'} size="sm">
            {isStart ? 'Start' : 'End'}
          </Badge>
        </div>
        {event.summary && (
          <div className="text-xs text-muted-foreground mt-1 truncate" title={event.summary}>
            {event.summary}
          </div>
        )}
      </div>
    </div>
  );
}
