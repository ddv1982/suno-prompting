import { isMultiGenre } from '@bun/instruments';
import { getConciseLabel } from '@shared/labels';

import type { AdvancedSelection } from '@shared/types';

/**
 * Builds a concise music phrase from advanced selections.
 * This phrase is used as a locked phrase that Suno sees verbatim.
 *
 * Example output: "Jazz, Lydian #11, 2:3→4:3 build, 7/8 (2+2+3)"
 */
export function buildMusicPhrase(selection: AdvancedSelection): string {
  const parts: string[] = [];

  // Genres: up to 4 genres or genre combinations - comes first
  if (selection.seedGenres.length > 0) {
    const genreLabels = selection.seedGenres.map((g) =>
      getConciseLabel(isMultiGenre(g) ? 'genreCombination' : 'genre', g)
    );
    parts.push(genreLabels.join(', '));
  }

  // Harmonic: either single style or combination (mutually exclusive)
  if (selection.harmonicStyle) {
    parts.push(getConciseLabel('harmonic', selection.harmonicStyle));
  } else if (selection.harmonicCombination) {
    parts.push(getConciseLabel('combination', selection.harmonicCombination));
  }

  // Polyrhythm combination
  if (selection.polyrhythmCombination) {
    parts.push(getConciseLabel('polyrhythm', selection.polyrhythmCombination));
  }

  // Time signature: either single or journey (mutually exclusive)
  if (selection.timeSignature) {
    parts.push(getConciseLabel('time', selection.timeSignature));
  } else if (selection.timeSignatureJourney) {
    parts.push(getConciseLabel('journey', selection.timeSignatureJourney));
  }

  return parts.join(', ');
}

/**
 * Checks if any advanced selection has been made.
 */
export function hasAdvancedSelection(selection: AdvancedSelection): boolean {
  return !!(
    selection.seedGenres.length > 0 ||
    selection.sunoStyles.length > 0 ||
    selection.harmonicStyle ||
    selection.harmonicCombination ||
    selection.polyrhythmCombination ||
    selection.timeSignature ||
    selection.timeSignatureJourney
  );
}

/**
 * Counts how many selections have been made.
 * @internal Primarily used for testing purposes.
 */
export function countSelections(selection: AdvancedSelection): number {
  let count = 0;
  if (selection.seedGenres.length > 0) count++;
  if (selection.sunoStyles.length > 0) count++;
  if (selection.harmonicStyle || selection.harmonicCombination) count++;
  if (selection.polyrhythmCombination) count++;
  if (selection.timeSignature || selection.timeSignatureJourney) count++;
  return count;
}
