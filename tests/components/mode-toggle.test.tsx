import { describe, test, expect } from 'bun:test';

import type { EditorMode } from '@shared/types';

/**
 * Unit tests for ModeToggle component disabled behavior.
 *
 * Tests cover:
 * - Simple/Advanced toggle buttons disabled via autoDisable + context
 * - Settings toggles (Lyrics, Max, Story) are NEVER auto-disabled - they're persistent settings
 * - Only explicit disabled prop disables settings toggles (e.g., Story when LLM unavailable)
 *
 * Following project convention: test pure logic and prop behavior without full React render.
 */

// ============================================
// Pure logic functions extracted from component
// ============================================

interface ModeToggleDisabledState {
  simpleButtonDisabled: boolean;
  advancedButtonDisabled: boolean;
  lyricsSwitchDisabled: boolean;
  maxSwitchDisabled: boolean;
  storySwitchDisabled: boolean;
}

/**
 * Compute the disabled state for all ModeToggle controls.
 * 
 * Buttons use autoDisable and get disabled from context.
 * Settings toggles (Lyrics, Max, Story) do NOT auto-disable - they're always interactive
 * except when explicitly disabled (e.g., Story when LLM unavailable).
 */
function computeDisabledState(
  contextDisabled: boolean,
  storyExplicitlyDisabled = false
): ModeToggleDisabledState {
  return {
    // Buttons auto-disable during generation
    simpleButtonDisabled: contextDisabled,
    advancedButtonDisabled: contextDisabled,
    // Settings toggles are always enabled (never auto-disable)
    lyricsSwitchDisabled: false,
    maxSwitchDisabled: false,
    // Story only disabled when explicitly set (LLM unavailable)
    storySwitchDisabled: storyExplicitlyDisabled,
  };
}

/**
 * Compute the variant for Simple/Advanced buttons.
 */
function computeButtonVariant(
  editorMode: EditorMode,
  buttonMode: EditorMode
): 'default' | 'outline' {
  return editorMode === buttonMode ? 'default' : 'outline';
}

// ============================================
// Tests: Disabled State During Generation
// ============================================

describe('ModeToggle', () => {
  describe('buttons disabled when context isDisabled=true', () => {
    test('Simple button is disabled when context is disabled', () => {
      const result = computeDisabledState(true);
      expect(result.simpleButtonDisabled).toBe(true);
    });

    test('Advanced button is disabled when context is disabled', () => {
      const result = computeDisabledState(true);
      expect(result.advancedButtonDisabled).toBe(true);
    });
  });

  describe('settings toggles never auto-disable (always interactive)', () => {
    test('Lyrics switch is enabled even when context is disabled', () => {
      const result = computeDisabledState(true);
      expect(result.lyricsSwitchDisabled).toBe(false);
    });

    test('Max switch is enabled even when context is disabled', () => {
      const result = computeDisabledState(true);
      expect(result.maxSwitchDisabled).toBe(false);
    });

    test('Story switch is enabled when context is disabled but LLM is available', () => {
      const result = computeDisabledState(true, false);
      expect(result.storySwitchDisabled).toBe(false);
    });

    test('Story switch is disabled only when explicitly disabled (LLM unavailable)', () => {
      const result = computeDisabledState(true, true);
      expect(result.storySwitchDisabled).toBe(true);
    });
  });

  describe('enabled state when context isDisabled=false', () => {
    test('Simple button is enabled when context is not disabled', () => {
      const result = computeDisabledState(false);
      expect(result.simpleButtonDisabled).toBe(false);
    });

    test('Advanced button is enabled when context is not disabled', () => {
      const result = computeDisabledState(false);
      expect(result.advancedButtonDisabled).toBe(false);
    });

    test('all settings toggles are enabled when context is not disabled', () => {
      const result = computeDisabledState(false);
      expect(result.lyricsSwitchDisabled).toBe(false);
      expect(result.maxSwitchDisabled).toBe(false);
      expect(result.storySwitchDisabled).toBe(false);
    });
  });

  describe('button variant computation', () => {
    test('Simple button shows default variant when editorMode is simple', () => {
      const variant = computeButtonVariant('simple', 'simple');
      expect(variant).toBe('default');
    });

    test('Simple button shows outline variant when editorMode is advanced', () => {
      const variant = computeButtonVariant('advanced', 'simple');
      expect(variant).toBe('outline');
    });

    test('Advanced button shows default variant when editorMode is advanced', () => {
      const variant = computeButtonVariant('advanced', 'advanced');
      expect(variant).toBe('default');
    });

    test('Advanced button shows outline variant when editorMode is simple', () => {
      const variant = computeButtonVariant('simple', 'advanced');
      expect(variant).toBe('outline');
    });
  });

  describe('disabled state does not affect button variant', () => {
    test('Simple button keeps correct variant when disabled', () => {
      // Arrange
      const editorMode: EditorMode = 'simple';

      // Act
      const disabledState = computeDisabledState(true);
      const variant = computeButtonVariant(editorMode, 'simple');

      // Assert
      expect(disabledState.simpleButtonDisabled).toBe(true);
      expect(variant).toBe('default'); // Still default variant
    });

    test('Advanced button keeps correct variant when disabled', () => {
      // Arrange
      const editorMode: EditorMode = 'advanced';

      // Act
      const disabledState = computeDisabledState(true);
      const variant = computeButtonVariant(editorMode, 'advanced');

      // Assert
      expect(disabledState.advancedButtonDisabled).toBe(true);
      expect(variant).toBe('default'); // Still default variant
    });
  });
});

describe('ModeToggle source verification', () => {
  test('mode-toggle.tsx uses ToggleRow component for all toggles', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify uses ToggleRow (standard component) instead of custom implementation
    expect(source).toContain('import { ToggleRow }');
    expect(source).toContain('id="mode-lyrics"');
    expect(source).toContain('id="mode-max"');
    expect(source).toContain('id="mode-story"');
  });

  test('mode-toggle.tsx uses autoDisable on buttons only', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify buttons use autoDisable prop
    expect(source).toContain("autoDisable");
    expect(source).toContain("variant={editorMode === 'simple'");
    expect(source).toContain("variant={editorMode === 'advanced'");
    // Count occurrences of autoDisable - should be 2 (only the 2 buttons)
    const matches = source.match(/autoDisable/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(2);
  });

  test('mode-toggle.tsx does not have isGenerating prop', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify isGenerating is NOT in the props interface (uses context instead)
    expect(source).not.toContain("isGenerating: boolean");
    expect(source).not.toContain("disabled={isGenerating}");
  });

  test('ModeToggleProps does not include isGenerating', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify the props interface doesn't include isGenerating
    const propsMatch = /interface ModeToggleProps \{[\s\S]*?\}/.exec(source);
    expect(propsMatch).not.toBeNull();
    expect(propsMatch?.[0]).not.toContain('isGenerating');
  });
});
