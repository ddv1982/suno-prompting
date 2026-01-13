/**
 * Error Card - Renders a trace error event.
 *
 * Shows:
 * - Error type badge
 * - Safe error message
 * - Optional HTTP status
 * - Optional provider request ID
 *
 * @module components/prompt-editor/debug-drawer/error-card
 */

import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { TraceErrorEvent } from '@shared/types';
import type { ReactElement } from 'react';

type ErrorCardProps = {
  event: TraceErrorEvent;
};

export function ErrorCard({ event }: ErrorCardProps): ReactElement {
  const { error } = event;

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
        <Badge variant="destructive" size="sm">
          {error.type}
        </Badge>
      </div>

      {/* Message */}
      <div className="text-sm text-destructive">{error.message}</div>

      {/* Details */}
      {(error.status || error.providerRequestId) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
          {error.status && <span>Status: {error.status}</span>}
          {error.providerRequestId && (
            <span className="font-mono truncate" title={error.providerRequestId}>
              Request ID: {error.providerRequestId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
