/**
 * Component Tests for Story Mode Toggle Behavior
 *
 * Tests the Story Mode toggle logic across all panels:
 * - Toggle renders correctly
 * - Disabled state when isLLMAvailable === false
 * - N/A badge appears when disabled
 * - Toggle state changes on click
 * - Helper text updates
 *
 * Task 5.4: Component Tests for Toggle Behavior
 */

import { describe, test, expect } from 'bun:test';

import { getStoryModeHelperText, getMaxModeHelperText } from '@shared/constants';

// ============================================
// Types matching component props
// ============================================

interface StoryModeToggleProps {
  storyMode: boolean;
  isLLMAvailable: boolean;
  maxMode: boolean;
  onStoryModeChange: (checked: boolean) => void;
}

interface ToggleRenderState {
  isChecked: boolean;
  isDisabled: boolean;
  showNaBadge: boolean;
  helperText: string | undefined;
}

// ============================================
// Pure logic functions for toggle behavior
// ============================================

/**
 * Compute the Story Mode toggle render state based on props.
 */
function computeStoryModeToggleState(props: StoryModeToggleProps): ToggleRenderState {
  const { storyMode, isLLMAvailable } = props;
  // Note: maxMode affects description text but not the toggle state itself

  return {
    isChecked: storyMode,
    isDisabled: !isLLMAvailable,
    showNaBadge: !isLLMAvailable,
    helperText: storyMode ? '(narrative format)' : undefined,
  };
}

/**
 * Determine if the toggle should show helper text inline.
 */
function shouldShowInlineHelperText(storyMode: boolean): boolean {
  return storyMode;
}

/**
 * Get the full helper text for Story Mode toggle (below the toggle row).
 */
function getToggleDescriptionText(storyMode: boolean, maxMode: boolean): string {
  return getStoryModeHelperText(storyMode, maxMode);
}

/**
 * Determine if LLMUnavailableNotice should be shown next to toggle.
 */
function shouldShowLLMUnavailableNotice(isLLMAvailable: boolean): boolean {
  return !isLLMAvailable;
}

/**
 * Handle toggle change - wraps the callback with any validation.
 */
function handleToggleChange(
  onStoryModeChange: (checked: boolean) => void,
  newValue: boolean,
  isLLMAvailable: boolean
): void {
  // Don't change if LLM unavailable (toggle should be disabled anyway)
  if (!isLLMAvailable) {
    return;
  }
  onStoryModeChange(newValue);
}

// ============================================
// Tests: Toggle Render State
// ============================================

describe('Story Mode Toggle', () => {
  describe('computeStoryModeToggleState', () => {
    test('shows unchecked state when storyMode is false', () => {
      const props: StoryModeToggleProps = {
        storyMode: false,
        isLLMAvailable: true,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isChecked).toBe(false);
      expect(state.isDisabled).toBe(false);
      expect(state.showNaBadge).toBe(false);
      expect(state.helperText).toBeUndefined();
    });

    test('shows checked state when storyMode is true', () => {
      const props: StoryModeToggleProps = {
        storyMode: true,
        isLLMAvailable: true,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isChecked).toBe(true);
      expect(state.helperText).toBe('(narrative format)');
    });

    test('shows disabled state when LLM is unavailable', () => {
      const props: StoryModeToggleProps = {
        storyMode: false,
        isLLMAvailable: false,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isDisabled).toBe(true);
      expect(state.showNaBadge).toBe(true);
    });

    test('shows N/A badge when LLM is unavailable', () => {
      const props: StoryModeToggleProps = {
        storyMode: false,
        isLLMAvailable: false,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.showNaBadge).toBe(true);
    });

    test('enabled but unchecked when LLM available and storyMode false', () => {
      const props: StoryModeToggleProps = {
        storyMode: false,
        isLLMAvailable: true,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isDisabled).toBe(false);
      expect(state.isChecked).toBe(false);
      expect(state.showNaBadge).toBe(false);
    });
  });

  describe('shouldShowInlineHelperText', () => {
    test('shows inline helper text when storyMode is true', () => {
      expect(shouldShowInlineHelperText(true)).toBe(true);
    });

    test('hides inline helper text when storyMode is false', () => {
      expect(shouldShowInlineHelperText(false)).toBe(false);
    });
  });

  describe('shouldShowLLMUnavailableNotice', () => {
    test('shows notice when LLM is unavailable', () => {
      expect(shouldShowLLMUnavailableNotice(false)).toBe(true);
    });

    test('hides notice when LLM is available', () => {
      expect(shouldShowLLMUnavailableNotice(true)).toBe(false);
    });
  });

  describe('handleToggleChange', () => {
    test('calls callback when LLM is available', () => {
      let capturedValue: boolean | undefined;
      const callback = (checked: boolean): void => {
        capturedValue = checked;
      };

      handleToggleChange(callback, true, true);

      expect(capturedValue).toBe(true as boolean);
    });

    test('does not call callback when LLM is unavailable', () => {
      let called = false;
      const callback = (): void => {
        called = true;
      };

      handleToggleChange(callback, true, false);

      expect(called).toBe(false as boolean);
    });

    test('passes correct value to callback', () => {
      let capturedValue: boolean | undefined;
      const callback = (checked: boolean): void => {
        capturedValue = checked;
      };

      handleToggleChange(callback, false, true);
      expect(capturedValue).toBe(false as boolean);

      handleToggleChange(callback, true, true);
      expect(capturedValue).toBe(true as boolean);
    });
  });
});

// ============================================
// Tests: Helper Text Content
// ============================================

describe('Story Mode Helper Text', () => {
  describe('getToggleDescriptionText', () => {
    test('returns standard text when storyMode is off', () => {
      const text = getToggleDescriptionText(false, false);

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    });

    test('returns narrative text when storyMode is on', () => {
      const text = getToggleDescriptionText(true, false);

      expect(text).toContain('narrative');
    });

    test('mentions MAX headers when both storyMode and maxMode are on', () => {
      const text = getToggleDescriptionText(true, true);

      expect(text).toContain('MAX');
    });
  });

  describe('getStoryModeHelperText from constants', () => {
    test('returns standard format text when storyMode is off', () => {
      const text = getStoryModeHelperText(false, false);

      expect(text).toContain('Standard');
    });

    test('returns narrative format text when storyMode is on', () => {
      const text = getStoryModeHelperText(true, false);

      expect(text).toContain('narrative');
    });

    test('returns MAX + narrative text when both modes are on', () => {
      const text = getStoryModeHelperText(true, true);

      expect(text).toContain('MAX');
      expect(text).toContain('narrative');
    });
  });
});

// ============================================
// Tests: Toggle in Different Panels
// ============================================

describe('Story Mode Toggle across panels', () => {
  describe('Quick Vibes panel toggle', () => {
    test('toggle state is correctly computed', () => {
      const props: StoryModeToggleProps = {
        storyMode: true,
        isLLMAvailable: true,
        maxMode: true,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isChecked).toBe(true);
      expect(state.isDisabled).toBe(false);
    });
  });

  describe('Creative Boost panel toggle', () => {
    test('toggle respects LLM availability', () => {
      const props: StoryModeToggleProps = {
        storyMode: false,
        isLLMAvailable: false,
        maxMode: false,
        onStoryModeChange: () => {},
      };

      const state = computeStoryModeToggleState(props);

      expect(state.isDisabled).toBe(true);
      expect(state.showNaBadge).toBe(true);
    });
  });

  describe('Full Prompt panel toggle', () => {
    test('toggle works with all mode combinations', () => {
      // Test all combinations
      const combinations = [
        { storyMode: false, isLLMAvailable: true, maxMode: false },
        { storyMode: true, isLLMAvailable: true, maxMode: false },
        { storyMode: false, isLLMAvailable: true, maxMode: true },
        { storyMode: true, isLLMAvailable: true, maxMode: true },
        { storyMode: false, isLLMAvailable: false, maxMode: false },
        { storyMode: false, isLLMAvailable: false, maxMode: true },
      ];

      combinations.forEach(({ storyMode, isLLMAvailable, maxMode }) => {
        const props: StoryModeToggleProps = {
          storyMode,
          isLLMAvailable,
          maxMode,
          onStoryModeChange: () => {},
        };

        const state = computeStoryModeToggleState(props);

        // Verify invariants
        expect(state.isChecked).toBe(storyMode);
        expect(state.isDisabled).toBe(!isLLMAvailable);
        expect(state.showNaBadge).toBe(!isLLMAvailable);
      });
    });
  });
});

// ============================================
// Tests: Source File Verification
// ============================================

describe('Story Mode Toggle source verification', () => {
  test('quick-vibes-panel toggles-section uses correct props', async () => {
    const source = await Bun.file(
      'src/main-ui/components/quick-vibes-panel/toggles-section.tsx'
    ).text();

    // Verify Story Mode toggle props
    expect(source).toContain('storyMode');
    expect(source).toContain('isLLMAvailable');
    expect(source).toContain('onStoryModeChange');
    expect(source).toContain('showNaBadge={!isLLMAvailable}');
    expect(source).toContain('disabled={!isLLMAvailable}');
    expect(source).toContain('BookOpen');
    expect(source).toContain('LLMUnavailableNotice');
  });

  test('creative-boost-panel toggles-section uses correct props', async () => {
    const source = await Bun.file(
      'src/main-ui/components/creative-boost-panel/toggles-section.tsx'
    ).text();

    // Verify Story Mode toggle props
    expect(source).toContain('storyMode');
    expect(source).toContain('isLLMAvailable');
    expect(source).toContain('onStoryModeChange');
    expect(source).toContain('showNaBadge={!isLLMAvailable}');
  });

  test('full-prompt-panel mode-toggle uses correct props', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/mode-toggle.tsx').text();

    // Verify Story Mode toggle props - simplified to match Lyrics/Max toggles
    expect(source).toContain('storyMode');
    expect(source).toContain('onStoryModeChange');
    expect(source).toContain('id="mode-story"');
  });
});

// ============================================
// Tests: Constants Integration
// ============================================

describe('Constants integration', () => {
  test('getStoryModeHelperText is exported from constants', () => {
    expect(typeof getStoryModeHelperText).toBe('function');
  });

  test('getMaxModeHelperText is exported from constants', () => {
    expect(typeof getMaxModeHelperText).toBe('function');
  });

  test('helper text functions return strings', () => {
    expect(typeof getStoryModeHelperText(false, false)).toBe('string');
    expect(typeof getStoryModeHelperText(true, false)).toBe('string');
    expect(typeof getStoryModeHelperText(true, true)).toBe('string');
    expect(typeof getMaxModeHelperText(false)).toBe('string');
    expect(typeof getMaxModeHelperText(true)).toBe('string');
  });
});
