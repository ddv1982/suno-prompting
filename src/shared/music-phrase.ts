import type { AdvancedSelection } from '@shared/types';
import { getConciseLabel } from '@shared/labels';

/**
 * Builds a concise music phrase from advanced selections.
 * This phrase is used as a locked phrase that Suno sees verbatim.
 * 
 * Example output: "Lydian #11, 2:3→4:3 build, 7/8 (2+2+3)"
 */
export function buildMusicPhrase(selection: AdvancedSelection): string {
    const parts: string[] = [];

    // Genre: either single or combination (mutually exclusive) - comes first
    if (selection.singleGenre) {
        parts.push(getConciseLabel('genre', selection.singleGenre));
    } else if (selection.genreCombination) {
        parts.push(getConciseLabel('genreCombination', selection.genreCombination));
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
        selection.singleGenre ||
        selection.genreCombination ||
        selection.harmonicStyle ||
        selection.harmonicCombination ||
        selection.polyrhythmCombination ||
        selection.timeSignature ||
        selection.timeSignatureJourney
    );
}

/**
 * Counts how many selections have been made.
 */
export function countSelections(selection: AdvancedSelection): number {
    let count = 0;
    if (selection.singleGenre || selection.genreCombination) count++;
    if (selection.harmonicStyle || selection.harmonicCombination) count++;
    if (selection.polyrhythmCombination) count++;
    if (selection.timeSignature || selection.timeSignatureJourney) count++;
    return count;
}
