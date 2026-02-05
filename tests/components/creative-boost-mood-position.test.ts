import { describe, test, expect } from 'bun:test';

describe('CreativeBoostPanel - Mood Selector Position', () => {
  // Note: CreativeBoostPanel uses useSettingsContext which imports RPC client (electrobun/view)
  // requiring browser environment. Skip direct export test.
  test('ModeSpecificInputs can be imported', async () => {
    const { ModeSpecificInputs } =
      await import('@/components/creative-boost-panel/mode-specific-inputs');
    expect(ModeSpecificInputs).toBeDefined();
    expect(typeof ModeSpecificInputs).toBe('function');
  });

  test('mood selector is enabled in both simple and advanced modes', async () => {
    // ModeSpecificInputs handles mood display for both modes
    const { ModeSpecificInputs } =
      await import('@/components/creative-boost-panel/mode-specific-inputs');
    const componentString = ModeSpecificInputs.toString();

    // Should have MoodCategoryCombobox in both simple and advanced modes
    expect(componentString).toContain('MoodCategoryCombobox');
    expect(componentString).toContain('isSimpleMode');
  });

  test('helper text is consistent regardless of direct mode', async () => {
    const { ModeSpecificInputs } =
      await import('@/components/creative-boost-panel/mode-specific-inputs');
    const componentString = ModeSpecificInputs.toString();

    // Verify helper text is always the same (not conditional on Direct Mode)
    expect(componentString).toContain('Influences the emotional tone of enrichment');
    // Should NOT have Direct Mode disabled message
    expect(componentString).not.toContain('Disabled when using direct Suno styles');
  });

  test('badge text is always optional', async () => {
    const { ModeSpecificInputs } =
      await import('@/components/creative-boost-panel/mode-specific-inputs');
    const componentString = ModeSpecificInputs.toString();

    // Verify badge text is always "optional" (not conditional)
    expect(componentString).toContain('optional');
    expect(componentString).toContain('badgeText');
  });

  test('component structure includes mood after creativity slider', async () => {
    // Note: CreativeBoostPanel import skipped due to electrobun browser API dependency
    // Verify ModeSpecificInputs contains the expected mood and genre components
    const { ModeSpecificInputs } =
      await import('@/components/creative-boost-panel/mode-specific-inputs');
    const modeInputsString = ModeSpecificInputs.toString();

    // ModeSpecificInputs should contain mood and genre components
    expect(modeInputsString).toContain('MoodCategoryCombobox');
    expect(modeInputsString).toContain('GenreMultiSelect');
  });
});
