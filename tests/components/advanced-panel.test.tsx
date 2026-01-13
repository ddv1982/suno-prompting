import { describe, test, expect } from 'bun:test';

import type { MoodCategory } from '@bun/mood';
import type { AdvancedSelection } from '@shared/types';

/**
 * Unit tests for AdvancedPanel component disabled behavior.
 *
 * Tests cover:
 * - Clear All button disabled during generation
 * - MoodCategoryCombobox disabled during generation
 * - GenreMultiSelect disabled during generation
 * - SunoStylesMultiSelect disabled during generation
 * - AdvancedOptionsGrid comboboxes disabled during generation
 * - All controls enabled when not generating
 *
 * Following project convention: test pure logic and prop behavior without full React render.
 */

// ============================================
// Types matching the component props
// ============================================

interface AdvancedPanelProps {
  selection: AdvancedSelection;
  onUpdate: (updates: Partial<AdvancedSelection>) => void;
  onClear: () => void;
  computedPhrase: string;
  moodCategory?: MoodCategory | null;
  onMoodCategoryChange: (category: MoodCategory | null) => void;
  isGenerating: boolean;
}

// ============================================
// Pure logic functions extracted from component
// ============================================

interface AdvancedPanelDisabledState {
  clearAllButtonDisabled: boolean;
  moodCategoryComboboxDisabled: boolean;
  genreMultiSelectDisabled: boolean;
  sunoStylesMultiSelectDisabled: boolean;
  advancedOptionsGridDisabled: boolean;
}

/**
 * Compute the disabled state for all AdvancedPanel controls.
 * Most controls are disabled when isGenerating is true.
 * Genre and Suno Styles have additional disable conditions based on mutual exclusivity.
 */
function computeDisabledState(props: AdvancedPanelProps): AdvancedPanelDisabledState {
  const { isGenerating, selection } = props;
  
  // Genre and Suno Styles have mutual exclusivity
  const isDirectMode = selection.sunoStyles.length > 0;
  const hasGenres = selection.seedGenres.length > 0;

  return {
    clearAllButtonDisabled: isGenerating,
    moodCategoryComboboxDisabled: isGenerating,
    // Genre is disabled when generating OR when Suno styles are selected
    genreMultiSelectDisabled: isGenerating || isDirectMode,
    // Suno Styles is disabled when generating OR when genres are selected
    sunoStylesMultiSelectDisabled: isGenerating || hasGenres,
    advancedOptionsGridDisabled: isGenerating,
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
    test('Clear All button is disabled when isGenerating=true', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: { ...createDefaultSelection(), seedGenres: ['jazz'] },
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(true);
    });

    test('Clear All button is enabled when isGenerating=false', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: { ...createDefaultSelection(), seedGenres: ['jazz'] },
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(false);
    });

    test('Clear All button visibility depends on selection', () => {
      // Empty selection - not visible
      expect(shouldShowClearAllButton(createDefaultSelection())).toBe(false);

      // Has genres - visible
      expect(shouldShowClearAllButton({ ...createDefaultSelection(), seedGenres: ['jazz'] })).toBe(true);

      // Has suno styles - visible
      expect(shouldShowClearAllButton({ ...createDefaultSelection(), sunoStyles: ['dream-pop'] })).toBe(true);

      // Has harmonic style - visible
      expect(shouldShowClearAllButton({ ...createDefaultSelection(), harmonicStyle: 'minor' })).toBe(true);
    });
  });

  describe('MoodCategoryCombobox disabled state', () => {
    test('MoodCategoryCombobox is disabled when isGenerating=true', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.moodCategoryComboboxDisabled).toBe(true);
    });

    test('MoodCategoryCombobox is enabled when isGenerating=false', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.moodCategoryComboboxDisabled).toBe(false);
    });
  });

  describe('GenreMultiSelect disabled state', () => {
    test('GenreMultiSelect is disabled when isGenerating=true', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(true);
    });

    test('GenreMultiSelect is disabled when sunoStyles are selected (Direct Mode)', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: { ...createDefaultSelection(), sunoStyles: ['dream-pop'] },
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(true);
    });

    test('GenreMultiSelect is enabled when isGenerating=false and no sunoStyles', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.genreMultiSelectDisabled).toBe(false);
    });
  });

  describe('SunoStylesMultiSelect disabled state', () => {
    test('SunoStylesMultiSelect is disabled when isGenerating=true', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
    });

    test('SunoStylesMultiSelect is disabled when genres are selected', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: { ...createDefaultSelection(), seedGenres: ['jazz'] },
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
    });

    test('SunoStylesMultiSelect is enabled when isGenerating=false and no genres', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.sunoStylesMultiSelectDisabled).toBe(false);
    });
  });

  describe('AdvancedOptionsGrid disabled state', () => {
    test('AdvancedOptionsGrid is disabled when isGenerating=true', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.advancedOptionsGridDisabled).toBe(true);
    });

    test('AdvancedOptionsGrid is enabled when isGenerating=false', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.advancedOptionsGridDisabled).toBe(false);
    });
  });

  describe('all controls disabled state during generation', () => {
    test('all controls are disabled simultaneously when generating', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: true,
      };

      // Act
      const result = computeDisabledState(props);

      // Assert
      expect(result.clearAllButtonDisabled).toBe(true);
      expect(result.moodCategoryComboboxDisabled).toBe(true);
      expect(result.genreMultiSelectDisabled).toBe(true);
      expect(result.sunoStylesMultiSelectDisabled).toBe(true);
      expect(result.advancedOptionsGridDisabled).toBe(true);
    });

    test('all controls are enabled simultaneously when not generating (empty selection)', () => {
      // Arrange
      const props: AdvancedPanelProps = {
        selection: createDefaultSelection(),
        onUpdate: () => {},
        onClear: () => {},
        computedPhrase: '',
        moodCategory: null,
        onMoodCategoryChange: () => {},
        isGenerating: false,
      };

      // Act
      const result = computeDisabledState(props);

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
  test('advanced-panel.tsx contains disabled prop on Clear All button', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify Clear All button has disabled={isGenerating}
    expect(source).toContain('Clear All');
    expect(source).toContain('disabled={isGenerating}');
  });

  test('advanced-panel.tsx passes isGenerating to MoodCategoryCombobox', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify MoodCategoryCombobox receives disabled prop
    expect(source).toContain('MoodCategoryCombobox');
    expect(source).toContain('disabled={isGenerating}');
  });

  test('advanced-panel.tsx passes isGenerating to GenreMultiSelect', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify GenreMultiSelect receives disabled prop
    expect(source).toContain('GenreMultiSelect');
    expect(source).toContain('disabled={isGenerating || genresDisabled}');
  });

  test('advanced-panel.tsx passes isGenerating to SunoStylesMultiSelect', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify SunoStylesMultiSelect receives disabled prop
    expect(source).toContain('SunoStylesMultiSelect');
    expect(source).toContain('disabled={isGenerating || stylesDisabled}');
  });

  test('advanced-panel.tsx passes isGenerating to AdvancedOptionsGrid', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify AdvancedOptionsGrid receives isGenerating prop
    expect(source).toContain('AdvancedOptionsGrid');
    expect(source).toContain('isGenerating={isGenerating}');
  });

  test('isGenerating is properly defined in props', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-panel.tsx'
    ).text();

    // Verify isGenerating is in the props interface
    expect(source).toContain('isGenerating: boolean');
  });
});

describe('AdvancedOptionsGrid source verification', () => {
  test('advanced-options-grid.tsx receives isGenerating prop', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-options-grid.tsx'
    ).text();

    // Verify isGenerating is in the props
    expect(source).toContain('isGenerating');
  });

  test('advanced-options-grid.tsx passes disabled to AdvancedOption components', async () => {
    const source = await Bun.file(
      'src/main-ui/components/advanced-panel/advanced-options-grid.tsx'
    ).text();

    // Verify AdvancedOption components receive disabled prop
    expect(source).toContain('AdvancedOption');
    expect(source).toContain('disabled={isGenerating}');
  });
});
