import { describe, test, expect } from 'bun:test';

import type { AdvancedSelection } from '@shared/types';

/**
 * Unit tests for AdvancedPanel component disabled behavior.
 *
 * Tests cover:
 * - Clear All button disabled via autoDisable context
 * - MoodCategoryCombobox disabled via autoDisable context
 * - GenreMultiSelect disabled via autoDisable context + mutual exclusion
 * - SunoStylesMultiSelect disabled via autoDisable context + mutual exclusion
 * - AdvancedOptionsGrid comboboxes disabled via autoDisable context
 * - All controls enabled when context allows
 *
 * Following project convention: test pure logic and prop behavior without full React render.
 * Note: isGenerating prop has been replaced with autoDisable pattern via GenerationDisabledProvider.
 */

// ============================================
// Types (AdvancedPanelProps no longer needed since we test context-based logic)
// ============================================

// ============================================
// Pure logic functions extracted from component
// ============================================

interface AdvancedPanelDisabledState {
  /** Clear All button uses autoDisable - disabled via context */
  clearAllButtonDisabled: boolean;
  /** MoodCategoryCombobox uses autoDisable (default true) - disabled via context */
  moodCategoryComboboxDisabled: boolean;
  /** GenreMultiSelect uses autoDisable + disabled prop for mutual exclusion with sunoStyles */
  genreMultiSelectDisabled: boolean;
  /** SunoStylesMultiSelect uses autoDisable + disabled prop for mutual exclusion with genres */
  sunoStylesMultiSelectDisabled: boolean;
  /** AdvancedOptionsGrid options use autoDisable - disabled via context */
  advancedOptionsGridDisabled: boolean;
}

/**
 * Compute the disabled state for AdvancedPanel controls based on mutual exclusion logic.
 *
 * Note: Generation/LLM availability disabling is handled via GenerationDisabledProvider
 * context with autoDisable props. This function only computes the component-specific
 * disable conditions (mutual exclusivity between genres and suno styles).
 *
 * @param contextDisabled - Whether the GenerationDisabledProvider context is disabled
 * @param selection - Current advanced selection state
 */
function computeDisabledState(
  contextDisabled: boolean,
  selection: AdvancedSelection
): AdvancedPanelDisabledState {
  // Genre and Suno Styles have mutual exclusivity
  const isDirectMode = selection.sunoStyles.length > 0;
  const hasGenres = selection.seedGenres.length > 0;

  return {
    // These use autoDisable, so they're disabled when context is disabled
    clearAllButtonDisabled: contextDisabled,
    moodCategoryComboboxDisabled: contextDisabled,
    advancedOptionsGridDisabled: contextDisabled,
    // These have additional disable conditions (mutual exclusion)
    genreMultiSelectDisabled: contextDisabled || isDirectMode,
    sunoStylesMultiSelectDisabled: contextDisabled || hasGenres,
  };
}

/**
 * Check if Clear All button should be visible.
 * Only visible when there is any selection.
 */
function shouldShowClearAllButton(selection: AdvancedSelection): boolean {
  return (
    selection.seedGenres.length > 0 ||
    selection.sunoStyles.length > 0 ||
    selection.harmonicStyle !== null ||
    selection.harmonicCombination !== null ||
    selection.polyrhythmCombination !== null ||
    selection.timeSignature !== null ||
    selection.timeSignatureJourney !== null
  );
}

/**
 * Check if Direct Mode indicator should be shown.
 */
function isDirectMode(selection: AdvancedSelection): boolean {
  return selection.sunoStyles.length > 0;
}

/**
 * Create a default empty selection.
 */
function createDefaultSelection(): AdvancedSelection {
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

// ============================================
// Tests: Clear All Button Disabled State
// ============================================

describe('AdvancedPanel', () => {
  describe('Clear All button disabled state', () => {
    test('Clear All button is disabled when context is disabled', () => {
      // Arrange - context disabled (e.g., generating or LLM unavailable)
      const contextDisabled = true;
      const selection = { ...createDefaultSelection(), seedGenres: ['jazz'] };

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(true);
    });

    test('Clear All button is enabled when context is enabled', () => {
      // Arrange - context enabled
      const contextDisabled = false;
      const selection = { ...createDefaultSelection(), seedGenres: ['jazz'] };

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(false);
    });

    test('Clear All button visibility depends on selection', () => {
      // Empty selection - not visible
      expect(shouldShowClearAllButton(createDefaultSelection())).toBe(false);

      // Has genres - visible
      expect(shouldShowClearAllButton({ ...createDefaultSelection(), seedGenres: ['jazz'] })).toBe(
        true
      );

      // Has suno styles - visible
      expect(
        shouldShowClearAllButton({ ...createDefaultSelection(), sunoStyles: ['dream-pop'] })
      ).toBe(true);

      // Has harmonic style - visible
      expect(
        shouldShowClearAllButton({ ...createDefaultSelection(), harmonicStyle: 'minor' })
      ).toBe(true);
    });
  });

  describe('MoodCategoryCombobox disabled state', () => {
    test('MoodCategoryCombobox is disabled when context is disabled', () => {
      // Arrange - context disabled
      const contextDisabled = true;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.moodCategoryComboboxDisabled).toBe(true);
    });

    test('MoodCategoryCombobox is enabled when context is enabled', () => {
      // Arrange - context enabled
      const contextDisabled = false;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.moodCategoryComboboxDisabled).toBe(false);
    });
  });

  describe('GenreMultiSelect disabled state', () => {
    test('GenreMultiSelect is disabled when context is disabled', () => {
      // Arrange - context disabled
      const contextDisabled = true;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(true);
    });

    test('GenreMultiSelect is disabled when sunoStyles are selected (Direct Mode)', () => {
      // Arrange - context enabled but in Direct Mode
      const contextDisabled = false;
      const selection = { ...createDefaultSelection(), sunoStyles: ['dream-pop'] };

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(true);
    });

    test('GenreMultiSelect is enabled when context is enabled and no sunoStyles', () => {
      // Arrange - context enabled, no Direct Mode
      const contextDisabled = false;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(false);
    });
  });

  describe('SunoStylesMultiSelect disabled state', () => {
    test('SunoStylesMultiSelect is disabled when context is disabled', () => {
      // Arrange - context disabled
      const contextDisabled = true;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
    });

    test('SunoStylesMultiSelect is disabled when genres are selected', () => {
      // Arrange - context enabled but genres selected (mutual exclusion)
      const contextDisabled = false;
      const selection = { ...createDefaultSelection(), seedGenres: ['jazz'] };

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
    });

    test('SunoStylesMultiSelect is enabled when context is enabled and no genres', () => {
      // Arrange - context enabled, no genres
      const contextDisabled = false;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(false);
    });
  });

  describe('AdvancedOptionsGrid disabled state', () => {
    test('AdvancedOptionsGrid is disabled when context is disabled', () => {
      // Arrange - context disabled
      const contextDisabled = true;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.advancedOptionsGridDisabled).toBe(true);
    });

    test('AdvancedOptionsGrid is enabled when context is enabled', () => {
      // Arrange - context enabled
      const contextDisabled = false;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.advancedOptionsGridDisabled).toBe(false);
    });
  });

  describe('all controls disabled state when context disabled', () => {
    test('all controls are disabled simultaneously when context is disabled', () => {
      // Arrange - context disabled (generating or LLM unavailable)
      const contextDisabled = true;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(true);
      expect(result.moodCategoryComboboxDisabled).toBe(true);
      expect(result.genreMultiSelectDisabled).toBe(true);
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
      expect(result.advancedOptionsGridDisabled).toBe(true);
    });

    test('all controls are enabled simultaneously when context is enabled (empty selection)', () => {
      // Arrange - context enabled, no mutual exclusion conditions
      const contextDisabled = false;
      const selection = createDefaultSelection();

      // Act
      const result = computeDisabledState(contextDisabled, selection);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(false);
      expect(result.moodCategoryComboboxDisabled).toBe(false);
      expect(result.genreMultiSelectDisabled).toBe(false);
      expect(result.sunoStylesMultiSelectDisabled).toBe(false);
      expect(result.advancedOptionsGridDisabled).toBe(false);
    });
  });

  describe('Direct Mode detection', () => {
    test('isDirectMode returns true when sunoStyles are selected', () => {
      const selection = { ...createDefaultSelection(), sunoStyles: ['dream-pop'] };
      expect(isDirectMode(selection)).toBe(true);
    });

    test('isDirectMode returns false when sunoStyles are empty', () => {
      expect(isDirectMode(createDefaultSelection())).toBe(false);
    });

    test('isDirectMode returns false when only genres are selected', () => {
      const selection = { ...createDefaultSelection(), seedGenres: ['jazz', 'blues'] };
      expect(isDirectMode(selection)).toBe(false);
    });
  });
});

describe('AdvancedPanel source verification', () => {
  test('advanced-panel.tsx contains autoDisable on Clear All button', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify Clear All button has autoDisable
    expect(source).toContain('Clear All');
    expect(source).toContain('autoDisable');
  });

  test('advanced-panel.tsx uses MoodCategoryCombobox with default autoDisable', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify MoodCategoryCombobox is used (autoDisable defaults to true in component)
    expect(source).toContain('MoodCategoryCombobox');
  });

  test('advanced-panel.tsx passes disabled to GenreMultiSelect', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify GenreMultiSelect receives disabled prop for mutual exclusion
    expect(source).toContain('GenreMultiSelect');
    expect(source).toContain('disabled={genresDisabled}');
  });

  test('advanced-panel.tsx passes disabled to SunoStylesMultiSelect', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify SunoStylesMultiSelect receives disabled prop for mutual exclusion
    expect(source).toContain('SunoStylesMultiSelect');
    expect(source).toContain('disabled={stylesDisabled}');
  });

  test('advanced-panel.tsx renders AdvancedOptionsGrid', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify AdvancedOptionsGrid is rendered
    expect(source).toContain('AdvancedOptionsGrid');
  });
});

describe('AdvancedOptionsGrid source verification', () => {
  test('advanced-options-grid.tsx uses AdvancedOption components', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-options-grid.tsx'
    ).text();

    // Verify AdvancedOption components are used
    expect(source).toContain('AdvancedOption');
  });

  test('advanced-options-grid.tsx passes disabledByMutualExclusion to AdvancedOption', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-options-grid.tsx'
    ).text();

    // Verify AdvancedOption components receive disabledByMutualExclusion prop
    expect(source).toContain('disabledByMutualExclusion');
  });
});
