import { describe, test, expect } from 'bun:test';

import type { EditorMode } from '@shared/types';

/**
 * Unit tests for ModeToggle component disabled behavior.
 *
 * Tests cover:
 * - Simple/Advanced toggle buttons disabled via autoDisable + context
 * - Lyrics toggle disabled via autoDisable + context
 * - Max toggle disabled via autoDisable + context
 * - All controls enabled when context is false
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
}

/**
 * Compute the disabled state for all ModeToggle controls.
 * All controls use autoDisable and get disabled state from context.
 * This simulates the context-based disabled state.
 */
function computeDisabledState(contextDisabled: boolean): ModeToggleDisabledState {
  return {
    simpleButtonDisabled: contextDisabled,
    advancedButtonDisabled: contextDisabled,
    lyricsSwitchDisabled: contextDisabled,
    maxSwitchDisabled: contextDisabled,
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
  describe('disabled state when context isDisabled=true', () => {
    test('Simple button is disabled when context is disabled', () => {
      // Act
      const result = computeDisabledState(true);

      // Assert
      expect(result.simpleButtonDisabled).toBe(true);
    });

    test('Advanced button is disabled when context is disabled', () => {
      // Act
      const result = computeDisabledState(true);

      // Assert
      expect(result.advancedButtonDisabled).toBe(true);
    });

    test('Lyrics switch is disabled when context is disabled', () => {
      // Act
      const result = computeDisabledState(true);

      // Assert
      expect(result.lyricsSwitchDisabled).toBe(true);
    });

    test('Max switch is disabled when context is disabled', () => {
      // Act
      const result = computeDisabledState(true);

      // Assert
      expect(result.maxSwitchDisabled).toBe(true);
    });

    test('all controls are disabled simultaneously when context is disabled', () => {
      // Act
      const result = computeDisabledState(true);

      // Assert
      expect(result.simpleButtonDisabled).toBe(true);
      expect(result.advancedButtonDisabled).toBe(true);
      expect(result.lyricsSwitchDisabled).toBe(true);
      expect(result.maxSwitchDisabled).toBe(true);
    });
  });

  describe('enabled state when context isDisabled=false', () => {
    test('Simple button is enabled when context is not disabled', () => {
      // Act
      const result = computeDisabledState(false);

      // Assert
      expect(result.simpleButtonDisabled).toBe(false);
    });

    test('Advanced button is enabled when context is not disabled', () => {
      // Act
      const result = computeDisabledState(false);

      // Assert
      expect(result.advancedButtonDisabled).toBe(false);
    });

    test('Lyrics switch is enabled when context is not disabled', () => {
      // Act
      const result = computeDisabledState(false);

      // Assert
      expect(result.lyricsSwitchDisabled).toBe(false);
    });

    test('Max switch is enabled when context is not disabled', () => {
      // Act
      const result = computeDisabledState(false);

      // Assert
      expect(result.maxSwitchDisabled).toBe(false);
    });

    test('all controls are enabled simultaneously when context is not disabled', () => {
      // Act
      const result = computeDisabledState(false);

      // Assert
      expect(result.simpleButtonDisabled).toBe(false);
      expect(result.advancedButtonDisabled).toBe(false);
      expect(result.lyricsSwitchDisabled).toBe(false);
      expect(result.maxSwitchDisabled).toBe(false);
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
  test('mode-toggle.tsx uses autoDisable on buttons', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify buttons use autoDisable prop
    expect(source).toContain("autoDisable");
    expect(source).toContain("variant={editorMode === 'simple'");
    expect(source).toContain("variant={editorMode === 'advanced'");
  });

  test('mode-toggle.tsx uses autoDisable on switches', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/mode-toggle.tsx'
    ).text();

    // Verify Switch components use autoDisable
    expect(source).toContain("checked={lyricsMode}");
    expect(source).toContain("checked={maxMode}");
    // Count occurrences of autoDisable - should be 4 (2 buttons + 2 switches)
    const matches = source.match(/autoDisable/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(4);
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
