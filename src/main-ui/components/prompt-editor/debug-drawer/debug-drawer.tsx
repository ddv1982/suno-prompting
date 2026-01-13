/**
 * Debug Drawer Body - Timeline-based trace viewer.
 *
 * Renders a chronological timeline of trace events with:
 * - Header with copy actions (Copy as JSON, Copy as text summary)
 * - Stats summary
 * - Truncation warning if trace was compacted
 * - Timeline of events sorted by tMs
 *
 * @module components/prompt-editor/debug-drawer/debug-drawer
 */

import { AlertCircle, ClipboardCopy, FileText } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { TimelineEvent } from './timeline-event';
import { generateTraceSummaryText } from './trace-summary';

import type { DebugDrawerBodyProps } from './types';
import type { TraceRun } from '@shared/types';
import type { ReactElement } from 'react';

/** Duration in ms to show "Copied!" feedback before reverting */
const COPY_FEEDBACK_DURATION_MS = 1500;

function formatAction(action: TraceRun['action']): string {
  switch (action) {
    case 'generate.full':
      return 'Generate (Full)';
    case 'generate.quickVibes':
      return 'Quick Vibes';
    case 'generate.creativeBoost':
      return 'Creative Boost';
    case 'refine':
      return 'Refine';
    case 'remix':
      return 'Remix';
    case 'convert.max':
      return 'Convert to Max';
    case 'convert.nonMax':
      return 'Convert from Max';
    default:
      return action;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DebugDrawerBody({ debugTrace }: DebugDrawerBodyProps): ReactElement {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const sortedEvents = useMemo(
    () => [...debugTrace.events].sort((a, b) => a.tMs - b.tMs),
    [debugTrace.events]
  );

  const handleCopyJson = useCallback(() => {
    const json = JSON.stringify(debugTrace, null, 2);
    void navigator.clipboard.writeText(json);
    setCopiedJson(true);
    setTimeout(() => { setCopiedJson(false); }, COPY_FEEDBACK_DURATION_MS);
  }, [debugTrace]);

  const handleCopyText = useCallback(() => {
    const text = generateTraceSummaryText(debugTrace);
    void navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => { setCopiedText(false); }, COPY_FEEDBACK_DURATION_MS);
  }, [debugTrace]);

  return (
    <div className="flex-1 flex flex-col min-h-0 mt-4">
      {/* Header with copy actions */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{formatAction(debugTrace.action)}</Badge>
          <span className="text-xs text-muted-foreground">{debugTrace.promptMode}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xs" onClick={handleCopyJson} className="gap-1">
                <ClipboardCopy className="size-3" />
                {copiedJson ? 'Copied!' : 'JSON'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as JSON</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xs" onClick={handleCopyText} className="gap-1">
                <FileText className="size-3" />
                {copiedText ? 'Copied!' : 'Summary'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as text summary</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 py-3 text-xs text-muted-foreground border-b shrink-0">
        <span>Events: {debugTrace.stats.eventCount}</span>
        <span>LLM calls: {debugTrace.stats.llmCallCount}</span>
        <span>Decisions: {debugTrace.stats.decisionCount}</span>
        <span>Size: {formatBytes(debugTrace.stats.persistedBytes)}</span>
        <span>Seed: {debugTrace.rng.seed}</span>
      </div>

      {/* Truncation warning */}
      {debugTrace.stats.truncatedForCap && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-xs text-yellow-700 dark:text-yellow-400 mt-3 shrink-0"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>Trace was compacted to fit the 64KB size cap. Some advanced details may be unavailable.</span>
        </div>
      )}

      {/* Error indicator */}
      {debugTrace.stats.hadErrors && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive mt-3 shrink-0"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>This run encountered errors. See timeline for details.</span>
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1 mt-4 overflow-hidden">
        <div className="pr-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No events recorded</div>
          ) : (
            <div className="relative">
              {sortedEvents.map((event) => (
                <TimelineEvent key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
