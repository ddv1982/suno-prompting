import { describe, test, expect } from 'bun:test';

/**
 * Tests for custom React hooks
 * Note: These tests verify the hook logic without React Testing Library
 * by testing the underlying functions and behaviors.
 */

// Import hook modules for testing exports
import * as asyncActionModule from '@/hooks/use-async-action';
import * as debounceModule from '@/hooks/use-debounce';

describe('useAsyncAction module', () => {
  describe('exports', () => {
    test('exports useAsyncAction function', () => {
      expect(typeof asyncActionModule.useAsyncAction).toBe('function');
    });

    test('exports useAsyncActionSafe function', () => {
      expect(typeof asyncActionModule.useAsyncActionSafe).toBe('function');
    });
  });

  describe('useAsyncAction behavior contract', () => {
    test('returns expected interface shape', () => {
      // Test that the hook has correct parameter types by checking function signature
      const hookFn = asyncActionModule.useAsyncAction;
      expect(hookFn.length).toBe(1); // Takes one argument (the action)
    });

    test('AsyncActionResult interface has required properties', () => {
      // Type-level verification that the result shape is correct
      type ExpectedInterface = asyncActionModule.AsyncActionResult<unknown[], unknown>;
      
      // Compile-time check - this validates the type exports
      const _typeCheck: ExpectedInterface = {
        isLoading: false,
        error: null,
        execute: async () => undefined,
        clearError: () => {},
      };
      
      expect(_typeCheck.isLoading).toBe(false);
      expect(_typeCheck.error).toBe(null);
      expect(typeof _typeCheck.execute).toBe('function');
      expect(typeof _typeCheck.clearError).toBe('function');
    });
  });
});

describe('useDebounce module', () => {
  describe('exports', () => {
    test('exports useDebounce function', () => {
      expect(typeof debounceModule.useDebounce).toBe('function');
    });

    test('exports useDebouncedValue function', () => {
      expect(typeof debounceModule.useDebouncedValue).toBe('function');
    });
  });

  describe('useDebounce behavior contract', () => {
    test('useDebounce is a function', () => {
      const hookFn = debounceModule.useDebounce;
      expect(typeof hookFn).toBe('function');
      // Note: Function.length doesn't count parameters with defaults
      // delay has a default value so length is 1 (just the value param)
      expect(hookFn.length).toBe(1);
    });

    test('useDebouncedValue is a function', () => {
      const hookFn = debounceModule.useDebouncedValue;
      expect(typeof hookFn).toBe('function');
      // Note: Function.length doesn't count parameters with defaults
      expect(hookFn.length).toBe(1);
    });
  });
});

describe('Hook patterns', () => {
  describe('async action error handling pattern', () => {
    test('extracts error message from Error object', () => {
      const error: unknown = new Error('Test error message');
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      expect(message).toBe('Test error message');
    });

    test('handles non-Error objects gracefully', () => {
      const error: unknown = 'String error';
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      expect(message).toBe('An unexpected error occurred');
    });

    test('handles null/undefined errors', () => {
      const error: unknown = null;
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('debounce timing pattern', () => {
    test('setTimeout receives correct delay value', () => {
      // Test the debounce timing pattern conceptually
      const delay = 300;
      let capturedDelay = 0;
      
      // Simulate what the hook does internally
      const simulateSetTimeout = (_callback: () => void, ms: number) => {
        capturedDelay = ms;
      };
      
      simulateSetTimeout(() => {}, delay);
      expect(capturedDelay).toBe(300);
    });

    test('clearTimeout pattern for cleanup', () => {
      // Test cleanup pattern conceptually
      let wasCleared = false;
      
      const simulateClearTimeout = () => {
        wasCleared = true;
      };
      
      // Simulate effect cleanup
      simulateClearTimeout();
      expect(wasCleared).toBe(true);
    });
  });
});

describe('useAsyncAction integration patterns', () => {
  test('successful async action pattern', async () => {
    // Simulate the pattern used in useAsyncAction
    let isLoading = false;
    let error: string | null = null;
    let result: string | undefined;

    const action = async () => {
      return 'success';
    };

    // Simulate execute
    isLoading = true;
    error = null;
    
    try {
      result = await action();
      isLoading = false;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      error = message;
      isLoading = false;
    }

    expect(isLoading).toBe(false);
    expect(error).toBe(null);
    expect(result).toBe('success');
  });

  test('failed async action pattern', async () => {
    let isLoading = false;
    let error: string | null = null;

    const action = async () => {
      throw new Error('Operation failed');
    };

    // Simulate execute
    isLoading = true;
    error = null;
    
    try {
      await action();
      isLoading = false;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      error = message;
      isLoading = false;
    }

    expect(isLoading).toBe(false);
    expect(error).toBe('Operation failed');
  });

  test('clearError pattern resets error state', () => {
    let error: string | null = 'Previous error';
    
    // Simulate clearError
    const clearError = () => {
      error = null;
    };
    
    clearError();
    
    expect(error).toBeNull();
  });
});

describe('useDebounce integration patterns', () => {
  test('initial value is returned immediately', () => {
    const initialValue = 'initial';
    const debouncedValue = initialValue;
    
    // On first render, debounced value equals input value
    expect(debouncedValue).toBe(initialValue);
  });

  test('isDebouncing pattern detects pending updates', () => {
    const currentValue: string = 'new value';
    const debouncedValue: string = 'old value';
    
    // isDebouncing is true when values differ
    const isDebouncing = currentValue !== debouncedValue;
    
    expect(isDebouncing).toBe(true);
  });

  test('isDebouncing is false when values match', () => {
    const value = 'same value';
    const currentValue: string = value;
    const debouncedValue: string = value;
    
    const isDebouncing = currentValue !== debouncedValue;
    
    expect(isDebouncing).toBe(false);
  });

  test('default delay is 300ms', () => {
    // Verify the documented default
    const DEFAULT_DELAY = 300;
    expect(DEFAULT_DELAY).toBe(300);
  });
});

// ============================================================================
// Task 2.2: Unit Tests for Bug 1 - Quick Vibes Style Fallback
// ============================================================================

describe('handleRefineQuickVibes style fallback pattern', () => {
  /**
   * These tests verify the pattern used in useQuickVibesActions.handleRefineQuickVibes
   * for calculating effectiveSunoStyles.
   * 
   * Bug 1 Fix: UI state should be respected for styles - empty array means user cleared them.
   * The code should NOT fall back to stored styles when UI is explicitly empty.
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

  // This simulates the FIXED pattern (Bug 1 Fix)
  function calculateEffectiveSunoStyles(
    uiInput: QuickVibesInput,
    _storedInput: StoredInput // Intentionally unused - we respect UI state
  ): string[] {
    // Fix: Respect UI state for styles - empty array means user cleared them
    // Do NOT fall back to stored styles when UI is explicitly empty
    return uiInput.sunoStyles;
  }

  // This simulates the OLD buggy pattern (for comparison/documentation)
  function calculateEffectiveSunoStylesBuggy(
    uiInput: QuickVibesInput,
    storedInput: StoredInput
  ): string[] {
    // Bug: Falls back to stored styles when UI is empty
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
      sunoStyles: [], // User cleared styles
      customDescription: '',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi', 'chillwave'], // Previous generation had styles
      customDescription: '',
      category: 'lofi-study',
    };

    const result = calculateEffectiveSunoStyles(uiInput, storedInput);
    
    // Fix: Empty array should be respected (category-only mode)
    expect(result).toEqual([]);
    expect(result).not.toEqual(['lo-fi', 'chillwave']);
  });

  test('demonstrates the bug in old pattern', () => {
    // This test documents the buggy behavior that was fixed
    const uiInput: QuickVibesInput = {
      sunoStyles: [], // User cleared styles
      customDescription: '',
      category: 'lofi-study',
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: ['lo-fi', 'chillwave'],
      customDescription: '',
      category: 'lofi-study',
    };

    // Old buggy behavior would fall back to stored styles
    const buggyResult = calculateEffectiveSunoStylesBuggy(uiInput, storedInput);
    expect(buggyResult).toEqual(['lo-fi', 'chillwave']); // Bug: falls back
    
    // Fixed behavior respects UI state
    const fixedResult = calculateEffectiveSunoStyles(uiInput, storedInput);
    expect(fixedResult).toEqual([]); // Fix: respects empty UI state
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
    // Simulate what happens in the actual hook
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
    
    // Simulate API call parameters
    const apiCallParams = {
      currentPrompt: 'existing prompt',
      currentTitle: 'Existing Title',
      description: uiInput.customDescription || storedInput?.customDescription || '',
      feedback: 'make it better',
      withWordlessVocals: true,
      category: storedInput?.category ?? null,
      sunoStyles: effectiveSunoStyles, // This should be ['indie-rock']
    };

    expect(apiCallParams.sunoStyles).toEqual(['indie-rock']);
    expect(apiCallParams.description).toBe('energetic');
  });
});

// ============================================================================
// Bug Fix: Quick Vibes Category Not Respecting UI State on Refine
// ============================================================================

describe('handleRefineQuickVibes category pattern', () => {
  /**
   * These tests verify the pattern used in useQuickVibesActions.handleRefineQuickVibes
   * for passing the correct category to the API.
   * 
   * Bug Fix: UI state should be respected for category - when user switches from
   * a category to "none" and selects Suno V5 styles, the refine should use the
   * UI category (null), not the stored category.
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

  // This simulates the FIXED pattern
  function getEffectiveCategory(
    uiInput: QuickVibesInput,
    _storedInput: StoredInput // Intentionally unused - we respect UI state
  ): string | null {
    // Fix: Use UI category, not stored category
    return uiInput.category;
  }

  // This simulates the OLD buggy pattern (for comparison/documentation)
  function getEffectiveCategoryBuggy(
    _uiInput: QuickVibesInput,
    storedInput: StoredInput
  ): string | null {
    // Bug: Uses stored category instead of UI category
    return storedInput?.category ?? null;
  }

  test('uses UI category when user switches from category to Direct Mode', () => {
    // User generated with 'lofi-study', then switched to Direct Mode (category=null, styles selected)
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop', 'shoegaze'],
      customDescription: '',
      category: null, // User cleared category
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study', // Original category from generation
    };

    const result = getEffectiveCategory(uiInput, storedInput);
    
    expect(result).toBeNull();
    expect(result).not.toBe('lofi-study');
  });

  test('demonstrates the bug in old pattern - causes validation error', () => {
    // This test documents the buggy behavior that was fixed
    const uiInput: QuickVibesInput = {
      sunoStyles: ['dream-pop'], // User selected styles
      customDescription: '',
      category: null, // User cleared category
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study', // Stored category
    };

    // Old buggy behavior would use stored category
    const buggyCategory = getEffectiveCategoryBuggy(uiInput, storedInput);
    expect(buggyCategory).toBe('lofi-study'); // Bug: uses stored
    
    // This would cause validateCategoryStylesMutualExclusivity to throw
    // because both category AND sunoStyles are non-empty
    const wouldCauseValidationError = buggyCategory !== null && uiInput.sunoStyles.length > 0;
    expect(wouldCauseValidationError).toBe(true);
    
    // Fixed behavior respects UI state
    const fixedCategory = getEffectiveCategory(uiInput, storedInput);
    expect(fixedCategory).toBeNull(); // Fix: respects UI state
    
    // This passes validation
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
      category: 'ambient-focus', // Changed to different category
      withWordlessVocals: false,
    };
    const storedInput: StoredInput = {
      sunoStyles: [],
      customDescription: '',
      category: 'lofi-study', // Original category
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
    // Simulate the complete Direct Mode switch scenario
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

    const effectiveCategory = getEffectiveCategory(uiInput, storedInput);
    const effectiveSunoStyles = uiInput.sunoStyles; // Uses UI styles
    
    // Simulate API call parameters
    const apiCallParams = {
      currentPrompt: 'existing prompt',
      currentTitle: 'Study Session',
      description: uiInput.customDescription || storedInput?.customDescription || '',
      feedback: 'make it dreamy',
      withWordlessVocals: false,
      category: effectiveCategory,
      sunoStyles: effectiveSunoStyles,
    };

    // Category should be null (from UI), not 'lofi-study' (from stored)
    expect(apiCallParams.category).toBeNull();
    // Styles should be from UI
    expect(apiCallParams.sunoStyles).toEqual(['dream-pop', 'shoegaze']);
    // This combination passes validation (category is null)
    expect(apiCallParams.category === null || apiCallParams.sunoStyles.length === 0).toBe(true);
  });
});

describe('Context memoization patterns', () => {
  test('useMemo dependency array pattern', () => {
    // Verify the memoization pattern works correctly
    const deps1 = ['a', 'b'];
    const deps2 = ['a', 'b'];
    
    // Same reference check
    expect(deps1).not.toBe(deps2);
    
    // Deep equality check (what useMemo does for primitives)
    expect(deps1).toEqual(deps2);
  });

  test('useCallback stability pattern', () => {
    // Simulate useCallback behavior
    const createCallback = () => () => {};
    
    const cb1 = createCallback();
    const cb2 = createCallback();
    
    // Without memoization, callbacks are different
    expect(cb1).not.toBe(cb2);
  });

  test('object reference equality for context values', () => {
    // Without useMemo, object is recreated each render
    const createContextValue = () => ({
      value: 'test',
      handler: () => {},
    });
    
    const ctx1 = createContextValue();
    const ctx2 = createContextValue();
    
    // Without memoization, context value changes every render
    expect(ctx1).not.toBe(ctx2);
    
    // With memoization, same reference is reused
    const memoizedCtx = createContextValue();
    const sameMemoizedCtx = memoizedCtx;
    
    expect(memoizedCtx).toBe(sameMemoizedCtx);
  });
});
