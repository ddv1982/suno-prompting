import { redactSecretsInText, truncateCandidates, truncateTextWithMarker } from '@shared/trace';

import type { TraceCollector } from './collector';
import type { TraceDecisionDomain, TraceDecisionEvent } from '@shared/types/trace';

export interface TraceDecisionInput {
  readonly domain: TraceDecisionDomain;
  readonly key: string;
  readonly branchTaken: string;
  readonly why: string;
  readonly selection?: {
    readonly method: NonNullable<TraceDecisionEvent['selection']>['method'];
    readonly chosenIndex?: number;
    readonly candidates?: readonly string[];
    readonly rolls?: readonly number[];
  };
}

const LIMITS = {
  branchTakenChars: 240,
  whyChars: 500,
  keyChars: 160,
} as const;

export function traceDecision(trace: TraceCollector | undefined, input: TraceDecisionInput): void {
  if (!trace) return;

  const key = truncateTextWithMarker(input.key, LIMITS.keyChars).text;
  const branchTaken = truncateTextWithMarker(redactSecretsInText(input.branchTaken), LIMITS.branchTakenChars).text;
  const why = truncateTextWithMarker(redactSecretsInText(input.why), LIMITS.whyChars).text;

  const selection = input.selection
    ? {
        method: input.selection.method,
        chosenIndex: input.selection.chosenIndex,
        candidatesCount: input.selection.candidates?.length,
        candidatesPreview: input.selection.candidates
          ? truncateCandidates(input.selection.candidates)
          : undefined,
        rolls: input.selection.rolls,
      }
    : undefined;

  trace.addDecisionEvent({
    domain: input.domain,
    key,
    branchTaken,
    why,
    selection,
  });
}
