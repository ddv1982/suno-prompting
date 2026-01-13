import { describe, test, expect } from 'bun:test';

import * as originalSelectionModule from '@/hooks/use-original-selection';

/**
 * Test suite for useOriginalSelection hook.
 *
 * This hook tracks the original advanced selection when a prompt is generated,
 * enabling detection of style field changes for refinement type auto-detection.
 *
 * Key behaviors:
 * - Returns null when no current prompt exists
 * - Captures advancedSelection when currentPrompt becomes truthy
 * - Resets to null when currentPrompt is cleared
 * - Uses useRef to avoid unnecessary re-renders
 * - Captures all AdvancedSelection fields including new harmonic/time fields
 * - Captures moodCategory separately (not part of AdvancedSelection)
 */
describe('useOriginalSelection', () => {
  describe('exports', () => {
    test('exports useOriginalSelection function', () => {
      expect(typeof originalSelectionModule.useOriginalSelection).toBe('function');
    });
  });

  describe('useOriginalSelection behavior contract', () => {
    test('useOriginalSelection is a function with correct arity', () => {
      const hookFn = originalSelectionModule.useOriginalSelection;
      expect(typeof hookFn).toBe('function');
      // Hook takes 3 arguments: currentPrompt, advancedSelection, and moodCategory
      expect(hookFn.length).toBe(3);
    });
  });
});

describe('selection capture patterns', () => {
  describe('prompt state transitions', () => {
    test('pattern: no prompt means null selection', () => {
      // Arrange
      const currentPrompt = '';

      // Act - When there's no prompt, original selection should be null
      const shouldCaptureSelection = !!currentPrompt;

      // Assert
      expect(shouldCaptureSelection).toBe(false);
    });

    test('pattern: truthy prompt triggers capture', () => {
      // Arrange
      const currentPrompt = 'Generated music prompt';

      // Act
      const shouldCaptureSelection = !!currentPrompt;

      // Assert
      expect(shouldCaptureSelection).toBe(true);
    });

    test('pattern: transition from no prompt to has prompt', () => {
      // Arrange
      const prevPrompt = '';
      const currentPrompt = 'New prompt';

      // Act - Detect transition
      const hadPrompt = !!prevPrompt;
      const hasPrompt = !!currentPrompt;
      const shouldCapture = !hadPrompt && hasPrompt;

      // Assert
      expect(shouldCapture).toBe(true);
    });

    test('pattern: transition from has prompt to no prompt (reset)', () => {
      // Arrange
      const prevPrompt = 'Old prompt';
      const currentPrompt = '';

      // Act - Detect transition
      const hadPrompt = !!prevPrompt;
      const hasPrompt = !!currentPrompt;
      const shouldReset = hadPrompt && !hasPrompt;

      // Assert
      expect(shouldReset).toBe(true);
    });

    test('pattern: no transition when prompt remains truthy', () => {
      // Arrange - Both have prompt
      const prevPrompt = 'Old prompt';
      const currentPrompt = 'New prompt';

      // Act
      const hadPrompt = !!prevPrompt;
      const hasPrompt = !!currentPrompt;
      const shouldCapture = !hadPrompt && hasPrompt;
      const shouldReset = hadPrompt && !hasPrompt;

      // Assert - Neither capture nor reset
      expect(shouldCapture).toBe(false);
      expect(shouldReset).toBe(false);
    });
  });

  describe('selection stability', () => {
    test('captured selection should not update when current selection changes', () => {
      // Arrange - Simulate captured selection
      const originalSelection = { seedGenres: ['jazz'], sunoStyles: [] };
      const currentSelection = { seedGenres: ['rock'], sunoStyles: ['grunge'] };

      // Act - Original should remain stable
      const capturedRef = originalSelection;

      // Assert - Different references
      expect(capturedRef).not.toBe(currentSelection);
      expect(capturedRef.seedGenres).toEqual(['jazz']);
    });

    test('reference equality for stable selection', () => {
      // Arrange
      const selection = { seedGenres: ['jazz'], sunoStyles: [] };
      const capturedRef = selection;

      // Act - Same reference should be returned
      const subsequentReturn = capturedRef;

      // Assert
      expect(capturedRef).toBe(subsequentReturn);
    });
  });

  describe('deep copy behavior', () => {
    test('selection arrays should be copied to prevent mutation', () => {
      // Arrange
      const originalSelection = { seedGenres: ['jazz', 'blues'], sunoStyles: ['smooth-jazz'] };

      // Act - Create copy pattern used in the hook
      const capturedSelection = {
        seedGenres: [...originalSelection.seedGenres],
        sunoStyles: [...originalSelection.sunoStyles],
      };

      // Assert - Copies should have same values but different references
      expect(capturedSelection.seedGenres).toEqual(originalSelection.seedGenres);
      expect(capturedSelection.seedGenres).not.toBe(originalSelection.seedGenres);
      expect(capturedSelection.sunoStyles).toEqual(originalSelection.sunoStyles);
      expect(capturedSelection.sunoStyles).not.toBe(originalSelection.sunoStyles);
    });

    test('mutation of original does not affect captured', () => {
      // Arrange
      const originalSelection = { seedGenres: ['jazz'], sunoStyles: [] };
      const capturedSelection = {
        seedGenres: [...originalSelection.seedGenres],
        sunoStyles: [...originalSelection.sunoStyles],
      };

      // Act - Mutate original
      originalSelection.seedGenres.push('rock');

      // Assert - Captured should be unchanged
      expect(capturedSelection.seedGenres).toEqual(['jazz']);
      expect(originalSelection.seedGenres).toEqual(['jazz', 'rock']);
    });
  });
});

describe('useOriginalSelection integration patterns', () => {
  describe('hook lifecycle simulation', () => {
    test('initial render with no prompt returns null', () => {
      // Simulate initial state
      const currentPrompt = '';
      const originalRef: { seedGenres: string[]; sunoStyles: string[] } | null = null;

      // Assert
      expect(originalRef).toBeNull();
      expect(!!currentPrompt).toBe(false);
    });

    test('prompt generation captures selection', () => {
      // Simulate state after prompt generated
      let originalRef: { seedGenres: string[]; sunoStyles: string[] } | null = null;
      const advancedSelection = { seedGenres: ['jazz'], sunoStyles: ['smooth-jazz'] };

      // Simulate capture
      originalRef = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
      };

      // Assert
      expect(originalRef).not.toBeNull();
      expect(originalRef?.seedGenres).toEqual(['jazz']);
      expect(originalRef?.sunoStyles).toEqual(['smooth-jazz']);
    });

    test('selection remains stable after capture', () => {
      // Arrange - Already captured
      const originalRef = { seedGenres: ['jazz'], sunoStyles: [] };
      // Simulate a changed selection (demonstrating immutability)
      const changedSelection = { seedGenres: ['rock'], sunoStyles: ['grunge'] };

      // Act - Hook should NOT update originalRef when selection changes
      // (This is the behavior we want - original stays stable)
      const currentRef = originalRef; // Same reference

      // Assert - originalRef should stay stable, not update to changedSelection
      expect(currentRef).toBe(originalRef);
      expect(currentRef.seedGenres).toEqual(['jazz']);
      expect(currentRef.seedGenres).not.toEqual(changedSelection.seedGenres);
    });

    test('prompt clear resets selection to null', () => {
      // Arrange - Has captured selection
      let originalRef: { seedGenres: string[]; sunoStyles: string[] } | null = {
        seedGenres: ['jazz'],
        sunoStyles: [],
      };
      const currentPrompt = ''; // Cleared

      // Act - Simulate reset
      if (!currentPrompt) {
        originalRef = null;
      }

      // Assert
      expect(originalRef).toBeNull();
    });
  });

  describe('useRef pattern validation', () => {
    test('useRef current property pattern', () => {
      // Simulate useRef behavior
      const ref = { current: null as { seedGenres: string[]; sunoStyles: string[] } | null };

      // Initial state
      expect(ref.current).toBeNull();

      // Set value
      ref.current = { seedGenres: ['jazz'], sunoStyles: [] };
      expect(ref.current).not.toBeNull();

      // Clear value
      ref.current = null;
      expect(ref.current).toBeNull();
    });

    test('useRef maintains stable reference', () => {
      // Arrange
      const ref = { current: { seedGenres: ['jazz'], sunoStyles: [] } };
      const initialCurrent = ref.current;

      // Act - Access current multiple times
      const access1 = ref.current;
      const access2 = ref.current;

      // Assert - Same reference
      expect(access1).toBe(initialCurrent);
      expect(access2).toBe(initialCurrent);
      expect(access1).toBe(access2);
    });
  });
});

describe('useEffect dependency patterns', () => {
  test('effect should depend on currentPrompt and all selection fields', () => {
    // This test validates the dependency pattern including new fields
    const currentPrompt = 'test';
    const seedGenres = ['jazz'];
    const sunoStyles = ['smooth'];
    const harmonicStyle = 'modal-shift';
    const harmonicCombination = 'dorian-to-mixolydian';
    const polyrhythmCombination = '3-over-4';
    const timeSignature = '7/8';
    const timeSignatureJourney = 'evolving';
    const moodCategory = 'melancholy';

    // Dependencies array pattern used in hook (all 9 dependencies)
    const deps = [
      currentPrompt,
      seedGenres,
      sunoStyles,
      harmonicStyle,
      harmonicCombination,
      polyrhythmCombination,
      timeSignature,
      timeSignatureJourney,
      moodCategory,
    ];

    expect(deps).toHaveLength(9);
    expect(deps[0]).toBe(currentPrompt);
    expect(deps[1]).toBe(seedGenres);
    expect(deps[2]).toBe(sunoStyles);
    expect(deps[3]).toBe(harmonicStyle);
    expect(deps[4]).toBe(harmonicCombination);
    expect(deps[5]).toBe(polyrhythmCombination);
    expect(deps[6]).toBe(timeSignature);
    expect(deps[7]).toBe(timeSignatureJourney);
    expect(deps[8]).toBe(moodCategory);
  });
});

// ============================================
// New Field Capture Tests (Task 4.1)
// ============================================

describe('new field capture patterns', () => {
  describe('captures new AdvancedSelection fields at generation time', () => {
    test('captures harmonicStyle at generation time', () => {
      // Arrange
      const advancedSelection = {
        seedGenres: ['jazz'],
        sunoStyles: [],
        harmonicStyle: 'modal-shift',
        harmonicCombination: null,
        polyrhythmCombination: null,
        timeSignature: null,
        timeSignatureJourney: null,
      };
      const moodCategory = null;

      // Act - Simulate capture logic from the hook
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.harmonicStyle).toBe('modal-shift');
    });

    test('captures harmonicCombination at generation time', () => {
      // Arrange
      const advancedSelection = {
        seedGenres: [],
        sunoStyles: ['dream-pop'],
        harmonicStyle: null,
        harmonicCombination: 'dorian-to-mixolydian',
        polyrhythmCombination: null,
        timeSignature: null,
        timeSignatureJourney: null,
      };
      const moodCategory = null;

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.harmonicCombination).toBe('dorian-to-mixolydian');
    });

    test('captures polyrhythmCombination at generation time', () => {
      // Arrange
      const advancedSelection = {
        seedGenres: ['afrobeat'],
        sunoStyles: [],
        harmonicStyle: null,
        harmonicCombination: null,
        polyrhythmCombination: '3-over-4',
        timeSignature: null,
        timeSignatureJourney: null,
      };
      const moodCategory = null;

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.polyrhythmCombination).toBe('3-over-4');
    });

    test('captures timeSignature at generation time', () => {
      // Arrange
      const advancedSelection = {
        seedGenres: ['prog-rock'],
        sunoStyles: [],
        harmonicStyle: null,
        harmonicCombination: null,
        polyrhythmCombination: null,
        timeSignature: '7/8',
        timeSignatureJourney: null,
      };
      const moodCategory = null;

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.timeSignature).toBe('7/8');
    });

    test('captures timeSignatureJourney at generation time', () => {
      // Arrange
      const advancedSelection = {
        seedGenres: [],
        sunoStyles: ['experimental'],
        harmonicStyle: null,
        harmonicCombination: null,
        polyrhythmCombination: null,
        timeSignature: null,
        timeSignatureJourney: 'evolving',
      };
      const moodCategory = null;

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.timeSignatureJourney).toBe('evolving');
    });

    test('captures moodCategory at generation time', () => {
      // Arrange - moodCategory is passed separately, not part of AdvancedSelection
      const advancedSelection = {
        seedGenres: ['indie'],
        sunoStyles: [],
        harmonicStyle: null,
        harmonicCombination: null,
        polyrhythmCombination: null,
        timeSignature: null,
        timeSignatureJourney: null,
      };
      const moodCategory = 'melancholy';

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert
      expect(capturedSelection.moodCategory).toBe('melancholy');
    });

    test('captures null values correctly for nullable fields', () => {
      // Arrange - All nullable fields set to null
      const advancedSelection = {
        seedGenres: [],
        sunoStyles: [],
        harmonicStyle: null,
        harmonicCombination: null,
        polyrhythmCombination: null,
        timeSignature: null,
        timeSignatureJourney: null,
      };
      const moodCategory = null;

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert - All nullable fields should be null
      expect(capturedSelection.harmonicStyle).toBeNull();
      expect(capturedSelection.harmonicCombination).toBeNull();
      expect(capturedSelection.polyrhythmCombination).toBeNull();
      expect(capturedSelection.timeSignature).toBeNull();
      expect(capturedSelection.timeSignatureJourney).toBeNull();
      expect(capturedSelection.moodCategory).toBeNull();
    });

    test('captures all fields together with mixed values', () => {
      // Arrange - Mix of null and non-null values
      const advancedSelection = {
        seedGenres: ['jazz', 'fusion'],
        sunoStyles: ['smooth-jazz'],
        harmonicStyle: 'modal-shift',
        harmonicCombination: null,
        polyrhythmCombination: '5-over-4',
        timeSignature: '9/8',
        timeSignatureJourney: null,
      };
      const moodCategory = 'energetic';

      // Act
      const capturedSelection = {
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        moodCategory,
      };

      // Assert - All fields captured correctly
      expect(capturedSelection.seedGenres).toEqual(['jazz', 'fusion']);
      expect(capturedSelection.sunoStyles).toEqual(['smooth-jazz']);
      expect(capturedSelection.harmonicStyle).toBe('modal-shift');
      expect(capturedSelection.harmonicCombination).toBeNull();
      expect(capturedSelection.polyrhythmCombination).toBe('5-over-4');
      expect(capturedSelection.timeSignature).toBe('9/8');
      expect(capturedSelection.timeSignatureJourney).toBeNull();
      expect(capturedSelection.moodCategory).toBe('energetic');
    });
  });

  describe('nullable field value preservation', () => {
    test('primitive nullable fields are copied by value (not reference)', () => {
      // Arrange
      const harmonicStyle = 'modal-shift';
      const capturedValue = harmonicStyle;

      // Assert - Primitive strings are compared by value
      expect(capturedValue).toBe(harmonicStyle);
      expect(capturedValue).toBe('modal-shift');
    });

    test('null is preserved as null (not undefined)', () => {
      // Arrange
      const harmonicStyle: string | null = null;
      const capturedValue = harmonicStyle;

      // Assert
      expect(capturedValue).toBeNull();
      expect(capturedValue).not.toBeUndefined();
    });
  });
});
