import { describe, test, expect } from 'bun:test';
import { buildMusicPhrase, hasAdvancedSelection, countSelections } from '../src/shared/music-phrase';
import type { AdvancedSelection } from '../src/shared/types';
import { EMPTY_ADVANCED_SELECTION } from '../src/shared/types';

describe('buildMusicPhrase', () => {
    test('returns empty string for empty selection', () => {
        const result = buildMusicPhrase(EMPTY_ADVANCED_SELECTION);
        expect(result).toBe('');
    });

    test('builds phrase with single harmonic style', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicStyle: 'lydian',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('Lydian #11');
    });

    test('builds phrase with harmonic combination', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicCombination: 'major_minor',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('Major↔Minor bittersweet');
    });

    test('prefers harmonicStyle over harmonicCombination when both set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicStyle: 'dorian',
            harmonicCombination: 'major_minor',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('Dorian');
    });

    test('builds phrase with polyrhythm combination', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            polyrhythmCombination: 'complexity_build',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('2:3→4:3→5:4 build');
    });

    test('builds phrase with time signature', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignature: 'time_7_8',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('7/8 (2+2+3)');
    });

    test('builds phrase with time signature journey', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignatureJourney: 'prog_odyssey',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('4/4→7/8→5/4 prog');
    });

    test('prefers timeSignature over timeSignatureJourney when both set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignature: 'time_5_4',
            timeSignatureJourney: 'prog_odyssey',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('5/4 (3+2)');
    });

    test('builds full phrase with all selections', () => {
        const selection: AdvancedSelection = {
            harmonicStyle: 'lydian',
            harmonicCombination: null,
            polyrhythmCombination: 'complexity_build',
            timeSignature: 'time_7_8',
            timeSignatureJourney: null,
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('Lydian #11, 2:3→4:3→5:4 build, 7/8 (2+2+3)');
    });

    test('handles combination with journey instead of single time signature', () => {
        const selection: AdvancedSelection = {
            harmonicStyle: null,
            harmonicCombination: 'lydian_minor',
            polyrhythmCombination: 'odd_journey',
            timeSignature: null,
            timeSignatureJourney: 'balkan_fusion',
        };
        const result = buildMusicPhrase(selection);
        expect(result).toBe('Lydian→Minor dreamdark, 3:4→5:4→7:4 odd, 7/8→9/8→11/8 Balkan');
    });
});

describe('hasAdvancedSelection', () => {
    test('returns false for empty selection', () => {
        expect(hasAdvancedSelection(EMPTY_ADVANCED_SELECTION)).toBe(false);
    });

    test('returns true when harmonicStyle is set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicStyle: 'lydian',
        };
        expect(hasAdvancedSelection(selection)).toBe(true);
    });

    test('returns true when harmonicCombination is set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicCombination: 'major_minor',
        };
        expect(hasAdvancedSelection(selection)).toBe(true);
    });

    test('returns true when polyrhythmCombination is set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            polyrhythmCombination: 'complexity_build',
        };
        expect(hasAdvancedSelection(selection)).toBe(true);
    });

    test('returns true when timeSignature is set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignature: 'time_7_8',
        };
        expect(hasAdvancedSelection(selection)).toBe(true);
    });

    test('returns true when timeSignatureJourney is set', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignatureJourney: 'prog_odyssey',
        };
        expect(hasAdvancedSelection(selection)).toBe(true);
    });
});

describe('countSelections', () => {
    test('returns 0 for empty selection', () => {
        expect(countSelections(EMPTY_ADVANCED_SELECTION)).toBe(0);
    });

    test('counts harmonic as 1 (style or combination)', () => {
        const selectionStyle: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicStyle: 'lydian',
        };
        const selectionCombo: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicCombination: 'major_minor',
        };
        expect(countSelections(selectionStyle)).toBe(1);
        expect(countSelections(selectionCombo)).toBe(1);
    });

    test('counts polyrhythm separately', () => {
        const selection: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            harmonicStyle: 'lydian',
            polyrhythmCombination: 'complexity_build',
        };
        expect(countSelections(selection)).toBe(2);
    });

    test('counts time as 1 (signature or journey)', () => {
        const selectionSig: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignature: 'time_7_8',
        };
        const selectionJourney: AdvancedSelection = {
            ...EMPTY_ADVANCED_SELECTION,
            timeSignatureJourney: 'prog_odyssey',
        };
        expect(countSelections(selectionSig)).toBe(1);
        expect(countSelections(selectionJourney)).toBe(1);
    });

    test('counts all three categories', () => {
        const selection: AdvancedSelection = {
            harmonicStyle: 'lydian',
            harmonicCombination: null,
            polyrhythmCombination: 'complexity_build',
            timeSignature: 'time_7_8',
            timeSignatureJourney: null,
        };
        expect(countSelections(selection)).toBe(3);
    });
});
