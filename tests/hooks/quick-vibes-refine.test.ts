import { describe, test, expect } from 'bun:test';

/**
 * Tests for Quick Vibes refine patterns
 * Bug 1 Fix: UI state should be respected for styles
 * Bug 2 Fix: UI state should be respected for category
 */

type QuickVibesInput = {
  sunoStyles: string[];
  customDescription: string;
  category: string | null;
  withWordlessVocals: boolean;
};

type StoredInput = {
  sunoStyles?: string[];
  customDescription?: string;
  category: string | null;
  withWordlessVocals?: boolean;
} | undefined;

describe('handleRefineQuickVibes style fallback pattern', () => {
  function calculateEffectiveSunoStyles(
    uiInput: QuickVibesInput,
    _storedInput: StoredInput
  ): string[] {
    return uiInput.sunoStyles;
  }

  function calculateEffectiveSunoStylesBuggy(
    uiInput: QuickVibesInput,
    storedInput: StoredInput
  ): string[] {
    return uiInput.sunoStyles.length > 0
      ? uiInput.sunoStyles
      : storedInput?.sunoStyles ?? [];
  }

  test('uses UI styles when populated', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop'],
      customDescription: '',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi'],
      customDescription: '',
      category: null,
    };

    const result = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    expect(result).toEqual(['dream-pop']);
    expect(result).not.toEqual(['lo-fi']);
  });

  test('uses empty array when UI cleared styles (category-only mode)', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi', 'chillwave'],
      customDescription: '',
      category: 'lofi-study',
    };

    const result = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    expect(result).toEqual([]);
    expect(result).not.toEqual(['lo-fi', 'chillwave']);
  });

  test('demonstrates the bug in old pattern', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi', 'chillwave'],
      customDescription: '',
      category: 'lofi-study',
    };

    const buggyResult = calculateEffectiveSunoStylesBuggy(uiInput, storedInput);
    expect(buggyResult).toEqual(['lo-fi', 'chillwave']);
    
    const fixedResult = calculateEffectiveSunoStyles(uiInput, storedInput);
    expect(fixedResult).toEqual([]);
  });

  test('handles undefined stored input gracefully', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = undefined;

    const result = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    expect(result).toEqual([]);
  });

  test('handles multiple UI styles correctly', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop', 'shoegaze', 'ambient'],
      customDescription: '',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi'],
      customDescription: '',
      category: null,
    };

    const result = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    expect(result).toEqual(['dream-pop', 'shoegaze', 'ambient']);
    expect(result.length).toBe(3);
  });

  test('correct effectiveSunoStyles passed to api.refineQuickVibes conceptually', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['indie-rock'],
      customDescription: 'energetic',
      category: null,
      withWordlessVocals: true,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi'],
      customDescription: 'chill',
      category: 'lofi-study',
    };

    const effectiveSunoStyles = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    const apiCallParams = {
      currentPrompt: 'existing prompt',
      currentTitle: 'Existing Title',
      description: uiInput.customDescription || storedInput?.customDescription || '',
      feedback: 'make it better',
      withWordlessVocals: true,
      category: storedInput?.category ?? null,
      sunoStyles: effectiveSunoStyles,
    };

    expect(apiCallParams.sunoStyles).toEqual(['indie-rock']);
    expect(apiCallParams.description).toBe('energetic');
  });
});

describe('handleRefineQuickVibes category pattern', () => {
  function getEffectiveCategory(
    uiInput: QuickVibesInput,
    _storedInput: StoredInput
  ): string | null {
    return uiInput.category;
  }

  function getEffectiveCategoryBuggy(
    _uiInput: QuickVibesInput,
    storedInput: StoredInput
  ): string | null {
    return storedInput?.category ?? null;
  }

  test('uses UI category when user switches from category to Direct Mode', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop', 'shoegaze'],
      customDescription: '',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
    };

    const result = getEffectiveCategory(uiInput, storedInput);
    
    expect(result).toBeNull();
    expect(result).not.toBe('lofi-study');
  });

  test('demonstrates the bug in old pattern - causes validation error', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop'],
      customDescription: '',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
    };

    const buggyCategory = getEffectiveCategoryBuggy(uiInput, storedInput);
    expect(buggyCategory).toBe('lofi-study');
    
    const wouldCauseValidationError = buggyCategory !== null && uiInput.sunoStyles.length > 0;
    expect(wouldCauseValidationError).toBe(true);
    
    const fixedCategory = getEffectiveCategory(uiInput, storedInput);
    expect(fixedCategory).toBeNull();
    
    const passesValidation = fixedCategory === null || uiInput.sunoStyles.length === 0;
    expect(passesValidation).toBe(true);
  });

  test('uses UI category when user keeps category', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: [],
      customDescription: 'more chill',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
    };

    const result = getEffectiveCategory(uiInput, storedInput);
    
    expect(result).toBe('lofi-study');
  });

  test('uses UI category when user changes to different category', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'ambient-focus',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study',
    };

    const result = getEffectiveCategory(uiInput, storedInput);
    
    expect(result).toBe('ambient-focus');
    expect(result).not.toBe('lofi-study');
  });

  test('handles undefined stored input gracefully', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['indie-rock'],
      customDescription: '',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = undefined;

    const result = getEffectiveCategory(uiInput, storedInput);
    
    expect(result).toBeNull();
  });

  test('correct parameters passed to api.refineQuickVibes - Direct Mode scenario', () => {
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop', 'shoegaze'],
      customDescription: 'ethereal vibes',
      category: null,
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: 'chill study',
      category: 'lofi-study',
    };

    const effectiveCategory = uiInput.category;
    const effectiveSunoStyles = uiInput.sunoStyles;
    
    const apiCallParams = {
      currentPrompt: 'existing prompt',
      currentTitle: 'Study Session',
      description: uiInput.customDescription || storedInput?.customDescription || '',
      feedback: 'make it dreamy',
      withWordlessVocals: false,
      category: effectiveCategory,
      sunoStyles: effectiveSunoStyles,
    };

    expect(apiCallParams.category).toBeNull();
    expect(apiCallParams.sunoStyles).toEqual(['dream-pop', 'shoegaze']);
    expect(apiCallParams.category === null || apiCallParams.sunoStyles.length === 0).toBe(true);
  });
});
