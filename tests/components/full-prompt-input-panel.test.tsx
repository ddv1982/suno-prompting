import { describe, test, expect } from 'bun:test';

import { canRefineFullPrompt } from '@shared/submit-validation';

import type { RefinementType, StyleChanges, AdvancedSelection, OriginalAdvancedSelection } from '@shared/types';

/**
 * Integration tests for FullPromptInputPanel button state logic.
 *
 * Tests the refinement button state behavior based on:
 * - Original selection tracking
 * - Style field changes (seedGenres, sunoStyles)
 * - Feedback text presence
 * - Lyrics mode state
 * - Generation state (isGenerating)
 *
 * These tests verify the component's canSubmit logic without rendering React components,
 * following the project's test pattern of testing pure logic extraction.
 */

// ============================================
// Pure Logic Functions (same as in hooks)
// ============================================

/**
 * Compare two arrays for equality (order-independent).
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Detect style changes between current and original selection.
 */
function detectStyleChanges(
  current: AdvancedSelection,
  original: OriginalAdvancedSelection | null
): StyleChanges | undefined {
  if (!original) return undefined;

  const changes: StyleChanges = {};
  let hasChanges = false;

  if (!arraysEqual(current.seedGenres, original.seedGenres)) {
    changes.seedGenres = current.seedGenres;
    hasChanges = true;
  }

  if (!arraysEqual(current.sunoStyles, original.sunoStyles)) {
    changes.sunoStyles = current.sunoStyles;
    hasChanges = true;
  }

  return hasChanges ? changes : undefined;
}

/**
 * Compute refinement type based on inputs.
 */
function computeRefinementType(input: {
  currentSelection: AdvancedSelection;
  originalSelection: OriginalAdvancedSelection | null;
  feedbackText: string;
  lyricsMode: boolean;
  hasCurrentPrompt: boolean;
}): { refinementType: RefinementType; styleChanges: StyleChanges | undefined } {
  const { currentSelection, originalSelection, feedbackText, lyricsMode, hasCurrentPrompt } = input;

  if (!hasCurrentPrompt) {
    return { refinementType: 'none', styleChanges: undefined };
  }

  const styleChanges = detectStyleChanges(currentSelection, originalSelection);
  const hasStyleChanges = styleChanges !== undefined;
  const hasFeedback = feedbackText.trim().length > 0;

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
// Helper: Create Component Props State
// ============================================

interface ComponentState {
  currentPrompt: string;
  pendingInput: string;
  advancedSelection: AdvancedSelection;
  originalSelection: OriginalAdvancedSelection | null;
  lyricsMode: boolean;
  isGenerating: boolean;
  inputOverLimit: boolean;
  lyricsTopicOverLimit: boolean;
  lockedPhraseValidation: { isValid: boolean; error: string | null };
}

function createDefaultAdvancedSelection(): AdvancedSelection {
  return {
    seedGenres: [],
    sunoStyles: [],
    harmonicStyle: null,
    harmonicCombination: null,
    polyrhythmCombination: null,
    timeSignature: null,
    timeSignatureJourney: null,
  };
}

function createDefaultOriginalSelection(): OriginalAdvancedSelection {
  return {
    seedGenres: [],
    sunoStyles: [],
  };
}

/**
 * Calculate button enabled state using same logic as FullPromptInputPanel.
 * canSubmit = !isGenerating && !inputOverLimit && !lyricsTopicOverLimit && lockedPhraseValidation.isValid && (currentPrompt ? canRefine : canSubmitContent)
 */
function calculateButtonEnabled(state: ComponentState): boolean {
  const { currentPrompt, pendingInput, advancedSelection, originalSelection, lyricsMode, isGenerating, inputOverLimit, lyricsTopicOverLimit, lockedPhraseValidation } = state;

  // Basic validation checks
  if (isGenerating) return false;
  if (inputOverLimit) return false;
  if (lyricsTopicOverLimit) return false;
  if (!lockedPhraseValidation.isValid) return false;

  // If we're in refine mode (has currentPrompt)
  if (currentPrompt) {
    const { styleChanges } = computeRefinementType({
      currentSelection: advancedSelection,
      originalSelection,
      feedbackText: pendingInput,
      lyricsMode,
      hasCurrentPrompt: true,
    });

    // Use canRefineFullPrompt for final validation
    return canRefineFullPrompt({
      feedbackText: pendingInput,
      styleChanges,
      lyricsMode,
    });
  }

  // Initial generation mode - not tested here
  return false;
}

// ============================================
// Tests
// ============================================

describe('FullPromptInputPanel Button State Integration', () => {
  describe('REFINE button disabled when nothing changed', () => {
    test('button disabled when no style changes and no feedback text', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });

    test('button disabled when selection matches original (no changes)', () => {
      // Arrange - Same selection as original
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: ['smooth-jazz'],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['jazz'],
        sunoStyles: ['smooth-jazz'],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });
  });

  describe('REFINE button enabled when genre changed', () => {
    test('button enabled when seedGenres differ from original', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['rock'], // Changed from jazz to rock
        sunoStyles: [],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button enabled when genre added to empty original', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection: {
          ...createDefaultAdvancedSelection(),
          seedGenres: ['jazz'],
        },
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button enabled when genre removed', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz', 'blues'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['jazz'], // Removed blues
        sunoStyles: [],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });
  });

  describe('REFINE button enabled when sunoStyles changed', () => {
    test('button enabled when sunoStyles differ from original', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: [],
        sunoStyles: ['dream-pop'],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: [],
        sunoStyles: ['shoegaze'], // Changed from dream-pop to shoegaze
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button enabled when sunoStyles added', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection: {
          ...createDefaultAdvancedSelection(),
          sunoStyles: ['indie-rock', 'post-punk'],
        },
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });
  });

  describe('REFINE button enabled when feedback text entered', () => {
    test('button enabled with feedback text in lyrics mode', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'make it more emotional',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button enabled with feedback text in lyrics mode OFF', () => {
      // Arrange - When lyrics mode is OFF, feedback routes to style refinement
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'add more bass',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: false,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button disabled with whitespace-only feedback', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '   \n\t  ',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });
  });

  describe('REFINE button enabled when both style and feedback changed', () => {
    test('button enabled with genre change AND feedback text', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['rock'],
        sunoStyles: [],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'make it more energetic',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });

    test('button enabled with sunoStyles change AND feedback text', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: [],
        sunoStyles: ['dream-pop'],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: [],
        sunoStyles: ['shoegaze', 'post-rock'],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'add ethereal vocals',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(true);
    });
  });

  describe('Button remains disabled during generation', () => {
    test('button disabled when isGenerating is true (no changes)', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: '',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: true,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });

    test('button disabled when isGenerating is true (with changes)', () => {
      // Arrange - Even with valid changes, button should be disabled while generating
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['rock'],
        sunoStyles: [],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'make it louder',
        advancedSelection,
        originalSelection,
        lyricsMode: true,
        isGenerating: true, // Generating
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });
  });

  describe('Additional validation constraints', () => {
    test('button disabled when input over limit', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };

      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'valid feedback',
        advancedSelection: {
          ...createDefaultAdvancedSelection(),
          seedGenres: ['rock'],
        },
        originalSelection,
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: true, // Over limit
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });

    test('button disabled when lyrics topic over limit', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'valid feedback',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: true, // Over limit
        lockedPhraseValidation: { isValid: true, error: null },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });

    test('button disabled when locked phrase validation fails', () => {
      // Arrange
      const state: ComponentState = {
        currentPrompt: 'existing prompt',
        pendingInput: 'valid feedback',
        advancedSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        lyricsMode: true,
        isGenerating: false,
        inputOverLimit: false,
        lyricsTopicOverLimit: false,
        lockedPhraseValidation: { isValid: false, error: 'Invalid locked phrase' },
      };

      // Act
      const isEnabled = calculateButtonEnabled(state);

      // Assert
      expect(isEnabled).toBe(false);
    });
  });

  describe('Refinement type detection', () => {
    test('detects style refinement type when only genre changed', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['rock'],
        sunoStyles: [],
      };

      // Act
      const { refinementType, styleChanges } = computeRefinementType({
        currentSelection: advancedSelection,
        originalSelection,
        feedbackText: '',
        lyricsMode: true,
        hasCurrentPrompt: true,
      });

      // Assert
      expect(refinementType).toBe('style');
      expect(styleChanges?.seedGenres).toEqual(['rock']);
    });

    test('detects lyrics refinement type when only feedback provided in lyrics mode', () => {
      // Arrange & Act
      const result = computeRefinementType({
        currentSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        feedbackText: 'make it more emotional',
        lyricsMode: true,
        hasCurrentPrompt: true,
      });

      // Assert
      expect(result.refinementType).toBe('lyrics');
      expect(result.styleChanges).toBeUndefined();
    });

    test('detects style refinement when feedback provided in lyrics mode OFF', () => {
      // Arrange & Act
      const result = computeRefinementType({
        currentSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        feedbackText: 'add more bass',
        lyricsMode: false,
        hasCurrentPrompt: true,
      });

      // Assert
      expect(result.refinementType).toBe('style');
    });

    test('detects combined refinement when both present', () => {
      // Arrange
      const originalSelection: OriginalAdvancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const advancedSelection = {
        ...createDefaultAdvancedSelection(),
        seedGenres: ['rock'],
        sunoStyles: [],
      };

      // Act
      const { refinementType, styleChanges } = computeRefinementType({
        currentSelection: advancedSelection,
        originalSelection,
        feedbackText: 'make it louder',
        lyricsMode: true,
        hasCurrentPrompt: true,
      });

      // Assert
      expect(refinementType).toBe('combined');
      expect(styleChanges?.seedGenres).toEqual(['rock']);
    });

    test('returns none when no changes and not in refine mode', () => {
      // Arrange & Act
      const result = computeRefinementType({
        currentSelection: createDefaultAdvancedSelection(),
        originalSelection: createDefaultOriginalSelection(),
        feedbackText: 'some text',
        lyricsMode: true,
        hasCurrentPrompt: false, // Not in refine mode
      });

      // Assert
      expect(result.refinementType).toBe('none');
    });
  });

  describe('Refinement success callback flow', () => {
    /**
     * Tests for the success feedback flow:
     * 1. onGenerate returns Promise<boolean>
     * 2. When successful refinement (success=true, isRefine=true), refined state set to true
     * 3. After timeout, refined state resets to false
     * 4. Initial generation (success=true, isRefine=false) does NOT trigger refined state
     */

    interface SuccessFlowInput {
      currentPrompt: string;
      onGenerateResult: boolean;
    }

    interface SuccessFlowOutput {
      shouldTriggerRefinedState: boolean;
    }

    /**
     * Pure logic: determine if refined state should be triggered after generation.
     */
    function computeSuccessFlow(input: SuccessFlowInput): SuccessFlowOutput {
      const { currentPrompt, onGenerateResult } = input;
      const isRefine = !!currentPrompt;
      const shouldTriggerRefinedState = onGenerateResult && isRefine;
      return { shouldTriggerRefinedState };
    }

    test('triggers refined state on successful refinement', () => {
      const result = computeSuccessFlow({
        currentPrompt: 'existing prompt',
        onGenerateResult: true,
      });

      expect(result.shouldTriggerRefinedState).toBe(true);
    });

    test('does not trigger refined state on failed refinement', () => {
      const result = computeSuccessFlow({
        currentPrompt: 'existing prompt',
        onGenerateResult: false,
      });

      expect(result.shouldTriggerRefinedState).toBe(false);
    });

    test('does not trigger refined state on successful initial generation', () => {
      const result = computeSuccessFlow({
        currentPrompt: '', // No current prompt = initial generation
        onGenerateResult: true,
      });

      expect(result.shouldTriggerRefinedState).toBe(false);
    });

    test('does not trigger refined state on failed initial generation', () => {
      const result = computeSuccessFlow({
        currentPrompt: '',
        onGenerateResult: false,
      });

      expect(result.shouldTriggerRefinedState).toBe(false);
    });
  });
});
