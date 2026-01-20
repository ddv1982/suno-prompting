/**
 * Truncation helpers for persisted debug traces.
 *
 * Truncations must be obvious: we always append `…[TRUNCATED]`.
 */

export const TRACE_TRUNCATION_MARKER = '…[TRUNCATED]' as const;

export interface TruncateResult {
  readonly text: string;
  readonly truncated: boolean;
  readonly originalLength: number;
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/**
 * Truncate a string to a max character length (including marker when truncated).
 */
export function truncateTextWithMarker(
  input: string,
  maxChars: number,
  marker: string = TRACE_TRUNCATION_MARKER
): TruncateResult {
  const safeMaxChars = clampNonNegativeInt(maxChars);
  const originalLength = input.length;

  if (safeMaxChars === 0) {
    return {
      text: originalLength === 0 ? '' : marker,
      truncated: originalLength > 0,
      originalLength,
    };
  }

  if (originalLength <= safeMaxChars) {
    return { text: input, truncated: false, originalLength };
  }

  // Reserve space for marker.
  const markerLength = marker.length;
  const sliceLength = Math.max(0, safeMaxChars - markerLength);
  const prefix = input.slice(0, sliceLength);

  return {
    text: `${prefix}${marker}`,
    truncated: true,
    originalLength,
  };
}

export interface CandidateTruncationOptions {
  readonly maxItems: number;
  readonly maxCharsPerItem: number;
}

export const DEFAULT_CANDIDATE_TRUNCATION: CandidateTruncationOptions = {
  maxItems: 10,
  maxCharsPerItem: 80,
} as const;

export function truncateCandidates(
  candidates: readonly string[],
  options: CandidateTruncationOptions = DEFAULT_CANDIDATE_TRUNCATION
): readonly string[] {
  const maxItems = clampNonNegativeInt(options.maxItems);
  const maxCharsPerItem = clampNonNegativeInt(options.maxCharsPerItem);

  const limited = candidates.slice(0, maxItems);

  return limited.map((candidate) => truncateTextWithMarker(candidate, maxCharsPerItem).text);
}
