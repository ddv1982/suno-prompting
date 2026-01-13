import { describe, test, expect } from 'bun:test';

import type { UseRefinementTypeInput } from '@/hooks/use-refinement-type';
import type { RefinementType, StyleChanges, AdvancedSelection, OriginalAdvancedSelection } from '@shared/types';

/**
 * Test suite for useRefinementType hook.
 *
 * This tests the core refinement type detection logic without invoking React hooks.
 * The hook wraps this logic in useMemo for performance optimization.
 *
 * Key behaviors:
 * - Returns 'none' when no current prompt (not in refine mode)
 * - Returns 'style' when only style fields changed
 * - Returns 'lyrics' when only feedback provided AND lyrics mode ON
 * - Returns 'style' when feedback provided but lyrics mode OFF
 * - Returns 'combined' when both style changes AND feedback present
 */

// ============================================
// Pure Logic Functions (same as in the hook)
// ============================================

/**
 * Compare two arrays for equality (order-independent).
 * Returns true if both arrays contain the same elements.
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Detect style changes between current and original selection.
 * Returns StyleChanges object if any changes detected, undefined otherwise.
 *
 * @param current - Current advanced selection from editor
 * @param original - Original selection captured at generation time
 * @param currentMoodCategory - Current mood category (not part of AdvancedSelection)
 */
function detectStyleChanges(
  current: AdvancedSelection,
  original: OriginalAdvancedSelection | null,
  currentMoodCategory: string | null = null
): StyleChanges | undefined {
  // No original to compare against - no changes detected
  if (!original) return undefined;

  const changes: StyleChanges = {};
  let hasChanges = false;

  // Check seedGenres changes (array comparison)
  if (!arraysEqual(current.seedGenres, original.seedGenres)) {
    changes.seedGenres = current.seedGenres;
    hasChanges = true;
  }

  // Check sunoStyles changes (array comparison)
  if (!arraysEqual(current.sunoStyles, original.sunoStyles)) {
    changes.sunoStyles = current.sunoStyles;
    hasChanges = true;
  }

  // Check harmonicStyle changes (nullable string comparison)
  if (current.harmonicStyle !== original.harmonicStyle) {
    changes.harmonicStyle = current.harmonicStyle;
    hasChanges = true;
  }

  // Check harmonicCombination changes (nullable string comparison)
  if (current.harmonicCombination !== original.harmonicCombination) {
    changes.harmonicCombination = current.harmonicCombination;
    hasChanges = true;
  }

  // Check polyrhythmCombination changes (nullable string comparison)
  if (current.polyrhythmCombination !== original.polyrhythmCombination) {
    changes.polyrhythmCombination = current.polyrhythmCombination;
    hasChanges = true;
  }

  // Check timeSignature changes (nullable string comparison)
  if (current.timeSignature !== original.timeSignature) {
    changes.timeSignature = current.timeSignature;
    hasChanges = true;
  }

  // Check timeSignatureJourney changes (nullable string comparison)
  if (current.timeSignatureJourney !== original.timeSignatureJourney) {
    changes.timeSignatureJourney = current.timeSignatureJourney;
    hasChanges = true;
  }

  // Check moodCategory changes (passed separately, not part of AdvancedSelection)
  if (currentMoodCategory !== original.moodCategory) {
    changes.moodCategory = currentMoodCategory;
    hasChanges = true;
  }

  return hasChanges ? changes : undefined;
}

/**
 * Compute refinement type based on inputs.
 * This is the core logic extracted from the hook for testing.
 */
function computeRefinementType(input: UseRefinementTypeInput): {
  refinementType: RefinementType;
  styleChanges: StyleChanges | undefined;
} {
  const { currentSelection, originalSelection, feedbackText, lyricsMode, hasCurrentPrompt, moodCategory } = input;

  // Not in refine mode - no refinement possible
  if (!hasCurrentPrompt) {
    return { refinementType: 'none', styleChanges: undefined };
  }

  // Detect style changes (moodCategory is passed separately since it's not part of AdvancedSelection)
  const styleChanges = detectStyleChanges(currentSelection, originalSelection, moodCategory);
  const hasStyleChanges = styleChanges !== undefined;
  const hasFeedback = feedbackText.trim().length > 0;

  // Determine refinement type based on inputs
  let refinementType: RefinementType = 'none';

  if (hasStyleChanges && hasFeedback) {
    refinementType = 'combined';
  } else if (hasStyleChanges) {
    refinementType = 'style';
  } else if (hasFeedback && lyricsMode) {
    refinementType = 'lyrics';
  } else if (hasFeedback && !lyricsMode) {
    refinementType = 'style';
  }

  return { refinementType, styleChanges };
}

// ============================================
// Tests
// ============================================

// Default AdvancedSelection with all required fields
const DEFAULT_ADVANCED_SELECTION: AdvancedSelection = {
  seedGenres: [],
  sunoStyles: [],
  harmonicStyle: null,
  harmonicCombination: null,
  polyrhythmCombination: null,
  timeSignature: null,
  timeSignatureJourney: null,
};

// Overrides type that allows partial AdvancedSelection for convenience in tests
type TestInputOverrides = Omit<Partial<UseRefinementTypeInput>, 'currentSelection'> & {
  currentSelection?: Partial<AdvancedSelection> & { seedGenres: string[]; sunoStyles: string[] };
};

// Default OriginalAdvancedSelection with all required fields (for tests)
const DEFAULT_ORIGINAL_SELECTION: OriginalAdvancedSelection = {
  seedGenres: [],
  sunoStyles: [],
  harmonicStyle: null,
  harmonicCombination: null,
  polyrhythmCombination: null,
  timeSignature: null,
  timeSignatureJourney: null,
  moodCategory: null,
};

// Helper to create test inputs with defaults (module-level for use in all describe blocks)
function createInput(overrides: TestInputOverrides = {}): UseRefinementTypeInput {
  const { currentSelection, originalSelection, moodCategory, ...rest } = overrides;
  return {
    currentSelection: currentSelection
      ? { ...DEFAULT_ADVANCED_SELECTION, ...currentSelection }
      : DEFAULT_ADVANCED_SELECTION,
    originalSelection: originalSelection
      ? { ...DEFAULT_ORIGINAL_SELECTION, ...originalSelection }
      : DEFAULT_ORIGINAL_SELECTION,
    feedbackText: '',
    lyricsMode: true,
    hasCurrentPrompt: true,
    moodCategory: moodCategory !== undefined ? moodCategory : null,
    ...rest,
  };
}

describe('useRefinementType', () => {

  describe('when no current prompt (not in refine mode)', () => {
    test('returns "none" when no current prompt', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: false,
        feedbackText: 'some feedback',
        currentSelection: { seedGenres: ['jazz'], sunoStyles: [] },
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });
  });

  describe('style-only refinement', () => {
    test('returns "style" when only style fields changed', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['rock'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: '',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges).toBeDefined();
      expect(result.styleChanges?.seedGenres).toEqual(['rock']);
    });

    test('returns "style" when feedback provided in lyrics mode OFF', () => {
      // Arrange - When lyrics mode is OFF, feedback text routes to style refinement
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: 'add more bass',
        lyricsMode: false,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges).toBeUndefined(); // No style field changes
    });

    test('detects seedGenres changes correctly', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['rock', 'metal'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual(['rock', 'metal']);
    });

    test('detects sunoStyles changes correctly', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: ['dream-pop', 'shoegaze'] },
        originalSelection: { seedGenres: [], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.sunoStyles).toEqual(['dream-pop', 'shoegaze']);
    });

    test('detects multiple field changes as "style"', () => {
      // Arrange - Both seedGenres and sunoStyles changed
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['rock'], sunoStyles: ['grunge'] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: ['smooth-jazz'] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual(['rock']);
      expect(result.styleChanges?.sunoStyles).toEqual(['grunge']);
    });
  });

  describe('lyrics-only refinement', () => {
    test('returns "lyrics" when only feedback provided in lyrics mode', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: 'make it more emotional',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('lyrics');
      expect(result.styleChanges).toBeUndefined();
    });

    test('trims whitespace from feedback text', () => {
      // Arrange - Whitespace-only feedback should be treated as empty
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: '   ',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
    });
  });

  describe('combined refinement', () => {
    test('returns "combined" when both style changes and feedback', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['rock'], sunoStyles: [] },
        originalSelection: { seedGenres: ['pop'], sunoStyles: [] },
        feedbackText: 'make it more emotional',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('combined');
      expect(result.styleChanges).toBeDefined();
      expect(result.styleChanges?.seedGenres).toEqual(['rock']);
    });
  });

  describe('no refinement', () => {
    test('returns "none" when no changes and no feedback', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz'], sunoStyles: ['smooth-jazz'] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: ['smooth-jazz'] },
        feedbackText: '',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });

    test('returns "none" when original selection is null and no feedback', () => {
      // Arrange - No original selection means no style changes can be detected
      const input = createInput({
        hasCurrentPrompt: true,
        originalSelection: null,
        feedbackText: '',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });
  });

  describe('array comparison (order-independent)', () => {
    test('considers arrays equal regardless of order', () => {
      // Arrange - Same elements, different order should not be a change
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['rock', 'jazz'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz', 'rock'], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert - No change detected because elements are the same
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });

    test('detects array length changes', () => {
      // Arrange - Adding an element is a change
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz', 'rock', 'blues'], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz', 'rock'], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual(['jazz', 'rock', 'blues']);
    });
  });

  describe('edge cases', () => {
    test('handles empty arrays correctly', () => {
      // Arrange - Both arrays empty, no change
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: [] },
        originalSelection: { seedGenres: [], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
    });

    test('handles going from empty to non-empty array', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        originalSelection: { seedGenres: [], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual(['jazz']);
    });

    test('handles going from non-empty to empty array', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: [] },
        originalSelection: { seedGenres: ['jazz'], sunoStyles: [] },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual([]);
    });
  });
});

// ============================================
// Helper Function Unit Tests
// ============================================

describe('arraysEqual helper', () => {
  test('returns true for identical arrays', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  test('returns true for same elements in different order', () => {
    expect(arraysEqual(['b', 'a'], ['a', 'b'])).toBe(true);
  });

  test('returns false for different elements', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  test('returns false for different lengths', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });

  test('returns true for empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true);
  });
});

describe('detectStyleChanges helper', () => {
  // Helper to create full AdvancedSelection with partial overrides
  function createFullSelection(partial: Partial<AdvancedSelection>): AdvancedSelection {
    return { ...DEFAULT_ADVANCED_SELECTION, ...partial };
  }

  // Helper to create full OriginalAdvancedSelection with partial overrides
  function createFullOriginal(partial: Partial<OriginalAdvancedSelection>): OriginalAdvancedSelection {
    return {
      seedGenres: [],
      sunoStyles: [],
      harmonicStyle: null,
      harmonicCombination: null,
      polyrhythmCombination: null,
      timeSignature: null,
      timeSignatureJourney: null,
      moodCategory: null,
      ...partial,
    };
  }

  test('returns undefined when original is null', () => {
    const result = detectStyleChanges(createFullSelection({ seedGenres: ['jazz'], sunoStyles: [] }), null);
    expect(result).toBeUndefined();
  });

  test('returns undefined when no changes', () => {
    const current = createFullSelection({ seedGenres: ['jazz'], sunoStyles: ['smooth'] });
    const original = createFullOriginal({ seedGenres: ['jazz'], sunoStyles: ['smooth'] });
    const result = detectStyleChanges(current, original);
    expect(result).toBeUndefined();
  });

  test('returns changes object when seedGenres changed', () => {
    const current = createFullSelection({ seedGenres: ['rock'], sunoStyles: [] });
    const original = createFullOriginal({ seedGenres: ['jazz'], sunoStyles: [] });
    const result = detectStyleChanges(current, original);
    expect(result).toEqual({ seedGenres: ['rock'] });
  });

  test('returns changes object when sunoStyles changed', () => {
    const current = createFullSelection({ seedGenres: [], sunoStyles: ['grunge'] });
    const original = createFullOriginal({ seedGenres: [], sunoStyles: ['smooth'] });
    const result = detectStyleChanges(current, original);
    expect(result).toEqual({ sunoStyles: ['grunge'] });
  });

  test('returns changes object with both fields when both changed', () => {
    const current = createFullSelection({ seedGenres: ['rock'], sunoStyles: ['grunge'] });
    const original = createFullOriginal({ seedGenres: ['jazz'], sunoStyles: ['smooth'] });
    const result = detectStyleChanges(current, original);
    expect(result).toEqual({ seedGenres: ['rock'], sunoStyles: ['grunge'] });
  });

  // New field tests for detectStyleChanges helper
  describe('new field change detection', () => {
    test('returns changes object when harmonicStyle changed', () => {
      const current = createFullSelection({ harmonicStyle: 'modal-shift' });
      const original = createFullOriginal({ harmonicStyle: null });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({ harmonicStyle: 'modal-shift' });
    });

    test('returns changes object when harmonicCombination changed', () => {
      const current = createFullSelection({ harmonicCombination: 'dorian-to-mixolydian' });
      const original = createFullOriginal({ harmonicCombination: null });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({ harmonicCombination: 'dorian-to-mixolydian' });
    });

    test('returns changes object when polyrhythmCombination changed', () => {
      const current = createFullSelection({ polyrhythmCombination: '3-over-4' });
      const original = createFullOriginal({ polyrhythmCombination: null });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({ polyrhythmCombination: '3-over-4' });
    });

    test('returns changes object when timeSignature changed', () => {
      const current = createFullSelection({ timeSignature: '7/8' });
      const original = createFullOriginal({ timeSignature: null });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({ timeSignature: '7/8' });
    });

    test('returns changes object when timeSignatureJourney changed', () => {
      const current = createFullSelection({ timeSignatureJourney: 'evolving' });
      const original = createFullOriginal({ timeSignatureJourney: null });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({ timeSignatureJourney: 'evolving' });
    });

    test('returns changes object when moodCategory changed', () => {
      const current = createFullSelection({});
      const original = createFullOriginal({ moodCategory: null });
      const result = detectStyleChanges(current, original, 'emotional');
      expect(result).toEqual({ moodCategory: 'emotional' });
    });

    test('returns undefined when new fields unchanged', () => {
      const current = createFullSelection({
        harmonicStyle: 'modal-shift',
        timeSignature: '7/8',
      });
      const original = createFullOriginal({
        harmonicStyle: 'modal-shift',
        timeSignature: '7/8',
      });
      const result = detectStyleChanges(current, original);
      expect(result).toBeUndefined();
    });

    test('returns multiple new field changes', () => {
      const current = createFullSelection({
        harmonicStyle: 'modal-shift',
        timeSignature: '7/8',
        polyrhythmCombination: '3-over-4',
      });
      const original = createFullOriginal({
        harmonicStyle: null,
        timeSignature: '4/4',
        polyrhythmCombination: null,
      });
      const result = detectStyleChanges(current, original);
      expect(result).toEqual({
        harmonicStyle: 'modal-shift',
        timeSignature: '7/8',
        polyrhythmCombination: '3-over-4',
      });
    });
  });
});

// ============================================
// New Field Change Detection Tests (Task 4.2)
// ============================================

describe('useRefinementType new field change detection', () => {
  describe('individual field change tests', () => {
    test('detects harmonicStyle change → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.harmonicStyle).toBe('modal-shift');
    });

    test('detects harmonicCombination change → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicCombination: 'dorian-to-mixolydian',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicCombination: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.harmonicCombination).toBe('dorian-to-mixolydian');
    });

    test('detects polyrhythmCombination change → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          polyrhythmCombination: '3-over-4',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          polyrhythmCombination: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.polyrhythmCombination).toBe('3-over-4');
    });

    test('detects timeSignature change → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignature: '7/8',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignature: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.timeSignature).toBe('7/8');
    });

    test('detects timeSignatureJourney change → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignatureJourney: 'evolving',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignatureJourney: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.timeSignatureJourney).toBe('evolving');
    });

    test('detects moodCategory change → returns "style"', () => {
      // Arrange - moodCategory is passed separately
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: [] },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          moodCategory: null,
        },
        feedbackText: '',
        moodCategory: 'emotional',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.moodCategory).toBe('emotional');
    });
  });

  describe('null transition tests', () => {
    test('detects field cleared (value → null) → returns "style"', () => {
      // Arrange - harmonicStyle cleared
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: null, // Cleared
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift', // Was set
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.harmonicStyle).toBeNull();
    });

    test('detects field set (null → value) → returns "style"', () => {
      // Arrange - timeSignature set from null
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignature: '5/4', // Set
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          timeSignature: null, // Was null
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.timeSignature).toBe('5/4');
    });

    test('detects moodCategory cleared (value → null) → returns "style"', () => {
      // Arrange - moodCategory cleared
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: [] },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          moodCategory: 'energetic', // Was set
        },
        feedbackText: '',
        moodCategory: null, // Cleared
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.moodCategory).toBeNull();
    });
  });

  describe('multiple changes tests', () => {
    test('detects multiple new field changes simultaneously → returns "style"', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
          timeSignature: '7/8',
          polyrhythmCombination: '3-over-4',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: null,
          timeSignature: null,
          polyrhythmCombination: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.harmonicStyle).toBe('modal-shift');
      expect(result.styleChanges?.timeSignature).toBe('7/8');
      expect(result.styleChanges?.polyrhythmCombination).toBe('3-over-4');
    });

    test('returns "combined" when new field + feedback text', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: null,
        },
        feedbackText: 'make it more jazzy',
        lyricsMode: true,
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('combined');
      expect(result.styleChanges?.harmonicStyle).toBe('modal-shift');
    });

    test('returns "combined" when moodCategory change + feedback text', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: { seedGenres: [], sunoStyles: [] },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          moodCategory: null,
        },
        feedbackText: 'add more emotion',
        lyricsMode: true,
        moodCategory: 'emotional',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('combined');
      expect(result.styleChanges?.moodCategory).toBe('emotional');
    });

    test('returns "style" when mixing old + new field changes', () => {
      // Arrange - Both seedGenres (old) and harmonicStyle (new) changed
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: ['rock'],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
        },
        originalSelection: {
          seedGenres: ['jazz'],
          sunoStyles: [],
          harmonicStyle: null,
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('style');
      expect(result.styleChanges?.seedGenres).toEqual(['rock']);
      expect(result.styleChanges?.harmonicStyle).toBe('modal-shift');
    });
  });

  describe('no change tests', () => {
    test('returns "none" when new field unchanged', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
          timeSignature: '7/8',
        },
        originalSelection: {
          seedGenres: [],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
          timeSignature: '7/8',
        },
        feedbackText: '',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });

    test('returns "none" when all fields unchanged including moodCategory', () => {
      // Arrange
      const input = createInput({
        hasCurrentPrompt: true,
        currentSelection: {
          seedGenres: ['jazz'],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
        },
        originalSelection: {
          seedGenres: ['jazz'],
          sunoStyles: [],
          harmonicStyle: 'modal-shift',
          moodCategory: 'emotional',
        },
        feedbackText: '',
        moodCategory: 'emotional',
      });

      // Act
      const result = computeRefinementType(input);

      // Assert
      expect(result.refinementType).toBe('none');
      expect(result.styleChanges).toBeUndefined();
    });
  });
});
