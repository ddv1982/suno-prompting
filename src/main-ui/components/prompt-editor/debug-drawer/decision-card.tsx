/**
 * Decision Card - Renders a deterministic decision event.
 *
 * Shows:
 * - Domain label
 * - Key
 * - Branch taken
 * - Why explanation
 * - Selection metadata (method, chosenIndex, candidatesCount, candidatesPreview)
 *
 * @module components/prompt-editor/debug-drawer/decision-card
 */

import { GitBranch, Shuffle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { TraceDecisionEvent, TraceDecisionDomain } from '@shared/types';
import type { ReactElement } from 'react';

interface DecisionCardProps {
  event: TraceDecisionEvent;
}

function getDomainColor(domain: TraceDecisionDomain): string {
  switch (domain) {
    case 'genre':
      return 'border-l-purple-500';
    case 'mood':
      return 'border-l-blue-500';
    case 'instruments':
      return 'border-l-green-500';
    case 'styleTags':
      return 'border-l-orange-500';
    case 'recording':
      return 'border-l-yellow-500';
    case 'bpm':
      return 'border-l-red-500';
    default:
      return 'border-l-gray-500';
  }
}

function formatSelectionMethod(method: string): string {
  switch (method) {
    case 'pickRandom':
      return 'Pick Random';
    case 'shuffleSlice':
      return 'Shuffle & Slice';
    case 'weightedChance':
      return 'Weighted Chance';
    case 'index':
      return 'Index';
    default:
      return method;
  }
}

export function DecisionCard({ event }: DecisionCardProps): ReactElement {
  const { domain, key, branchTaken, why, selection } = event;

  return (
    <div className={cn('rounded-lg border border-l-4 bg-card/50 p-3 space-y-2', getDomainColor(domain))}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Badge variant="secondary" size="sm">
            {domain}
          </Badge>
        </div>
      </div>

      {/* Key */}
      <div className="text-xs font-mono text-muted-foreground truncate" title={key}>
        {key}
      </div>

      {/* Branch taken */}
      <div className="text-sm font-medium">{branchTaken}</div>

      {/* Why */}
      {why && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Why:</span> {why}
        </div>
      )}

      {/* Selection metadata */}
      {selection && (
        <div className="text-xs border-t pt-2 space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Shuffle className="size-3" aria-hidden="true" />
            <span>Selection: {formatSelectionMethod(selection.method)}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {selection.chosenIndex !== undefined && (
              <span>
                <span className="text-muted-foreground">idx:</span> {selection.chosenIndex}
              </span>
            )}
            {selection.candidatesCount !== undefined && (
              <span>
                <span className="text-muted-foreground">count:</span> {selection.candidatesCount}
              </span>
            )}
          </div>

          {/* Candidates preview */}
          {selection.candidatesPreview && selection.candidatesPreview.length > 0 && (
            <div className="mt-1">
              <span className="text-muted-foreground">Candidates:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selection.candidatesPreview.map((candidate, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'font-mono',
                      selection.chosenIndex === idx && 'bg-primary/10 border-primary'
                    )}
                  >
                    {candidate}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rolls */}
          {selection.rolls && selection.rolls.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Rolls: {selection.rolls.map((r) => r.toFixed(4)).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
