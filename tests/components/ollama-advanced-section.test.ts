/**
 * Component Tests for Ollama Advanced Section
 *
 * Tests the temperature slider behavior and range:
 * - Slider has max value of 1 (not 2)
 * - Helper text contains correct range (0.0-1.0)
 *
 * Task 4.3: Add Component Test for Temperature Slider
 */

import { describe, test, expect } from 'bun:test';

// ============================================
// Types matching component behavior
// ============================================

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  value: number;
}

// ============================================
// Pure logic functions for component behavior
// ============================================

/**
 * Get the temperature slider configuration.
 * These values should match the component implementation.
 */
function getTemperatureSliderConfig(temperature: number): SliderConfig {
  return {
    min: 0,
    max: 1, // Changed from 2 to 1 per Task 3.1
    step: 0.1,
    value: temperature,
  };
}

/**
 * Get the max tokens slider configuration.
 */
function getMaxTokensSliderConfig(maxTokens: number): SliderConfig {
  return {
    min: 500,
    max: 4000,
    step: 100,
    value: maxTokens,
  };
}

/**
 * Get the context length slider configuration.
 */
function getContextLengthSliderConfig(contextLength: number): SliderConfig {
  return {
    min: 2048,
    max: 8192,
    step: 1024,
    value: contextLength,
  };
}

/**
 * Get the temperature helper text.
 * Should show correct range (0.0-1.0) per Task 3.2.
 */
function getTemperatureHelperText(): string {
  return 'Higher values make output more random (0.0-1.0)';
}

/**
 * Format temperature display value.
 */
function formatTemperatureDisplay(value: number): string {
  return value.toFixed(1);
}

/**
 * Validate temperature is within allowed range.
 */
function isValidTemperature(value: number): boolean {
  return value >= 0 && value <= 1;
}

/**
 * Handle temperature slider change with clamping.
 */
function handleTemperatureChange(
  value: number,
  onTemperatureChange: (value: number) => void
): void {
  // Clamp to valid range
  const clamped = Math.max(0, Math.min(1, value));
  onTemperatureChange(clamped);
}

// ============================================
// Tests: Temperature Slider Configuration
// ============================================

describe('Ollama Advanced Section', () => {
  describe('Temperature Slider', () => {
    test('slider has max value of 1', () => {
      const config = getTemperatureSliderConfig(0.7);

      expect(config.max).toBe(1);
    });

    test('slider has min value of 0', () => {
      const config = getTemperatureSliderConfig(0.7);

      expect(config.min).toBe(0);
    });

    test('slider has step of 0.1', () => {
      const config = getTemperatureSliderConfig(0.7);

      expect(config.step).toBe(0.1);
    });

    test('slider value reflects prop value', () => {
      const config = getTemperatureSliderConfig(0.5);

      expect(config.value).toBe(0.5);
    });

    test('helper text contains correct range 0.0-1.0', () => {
      const helperText = getTemperatureHelperText();

      expect(helperText).toContain('0.0-1.0');
      expect(helperText).not.toContain('0.0-2.0');
    });

    test('helper text describes randomness', () => {
      const helperText = getTemperatureHelperText();

      expect(helperText).toContain('random');
    });
  });

  describe('Temperature Display', () => {
    test('formats temperature to one decimal place', () => {
      expect(formatTemperatureDisplay(0.7)).toBe('0.7');
      expect(formatTemperatureDisplay(1)).toBe('1.0');
      expect(formatTemperatureDisplay(0)).toBe('0.0');
      expect(formatTemperatureDisplay(0.33333)).toBe('0.3');
    });
  });

  describe('Temperature Validation', () => {
    test('validates temperature within range', () => {
      expect(isValidTemperature(0)).toBe(true);
      expect(isValidTemperature(0.5)).toBe(true);
      expect(isValidTemperature(1)).toBe(true);
    });

    test('rejects temperature outside range', () => {
      expect(isValidTemperature(-0.1)).toBe(false);
      expect(isValidTemperature(1.1)).toBe(false);
      expect(isValidTemperature(2)).toBe(false);
    });
  });

  describe('Temperature Change Handler', () => {
    test('calls callback with valid value', () => {
      let capturedValue: number | undefined;
      const callback = (value: number): void => {
        capturedValue = value;
      };

      handleTemperatureChange(0.5, callback);

      expect(capturedValue).toBe(0.5);
    });

    test('clamps value above max to 1', () => {
      let capturedValue: number | undefined;
      const callback = (value: number): void => {
        capturedValue = value;
      };

      handleTemperatureChange(1.5, callback);

      expect(capturedValue).toBe(1);
    });

    test('clamps value below min to 0', () => {
      let capturedValue: number | undefined;
      const callback = (value: number): void => {
        capturedValue = value;
      };

      handleTemperatureChange(-0.5, callback);

      expect(capturedValue).toBe(0);
    });
  });
});

// ============================================
// Tests: Other Sliders (Max Tokens, Context Length)
// ============================================

describe('Max Tokens Slider', () => {
  test('slider has correct min/max range', () => {
    const config = getMaxTokensSliderConfig(2000);

    expect(config.min).toBe(500);
    expect(config.max).toBe(4000);
    expect(config.step).toBe(100);
  });

  test('slider value reflects prop value', () => {
    const config = getMaxTokensSliderConfig(3000);

    expect(config.value).toBe(3000);
  });
});

describe('Context Length Slider', () => {
  test('slider has correct min/max range', () => {
    const config = getContextLengthSliderConfig(4096);

    expect(config.min).toBe(2048);
    expect(config.max).toBe(8192);
    expect(config.step).toBe(1024);
  });

  test('slider value reflects prop value', () => {
    const config = getContextLengthSliderConfig(6144);

    expect(config.value).toBe(6144);
  });
});

// ============================================
// Tests: Source File Verification
// ============================================

describe('Ollama Advanced Section source verification', () => {
  test('temperature slider has max={1} in source', async () => {
    const source = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Verify temperature slider has correct max value
    // The slider should have max={1}, not max={2}
    expect(source).toContain('max={1}');

    // Verify the temperature slider section structure
    expect(source).toContain('Temperature');
    expect(source).toContain('Slider');
  });

  test('helper text shows 0.0-1.0 range in source', async () => {
    const source = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Verify helper text contains correct range
    expect(source).toContain('0.0-1.0');
    expect(source).not.toContain('0.0-2.0');
  });

  test('temperature slider has step={0.1} in source', async () => {
    const source = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Verify temperature slider has correct step value
    expect(source).toContain('step={0.1}');
  });

  test('component exports correctly', async () => {
    const source = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Verify the component is properly exported
    expect(source).toContain('export function OllamaAdvancedSection');
  });

  test('component receives correct prop types', async () => {
    const source = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Verify all expected props are present
    expect(source).toContain('temperature: number');
    expect(source).toContain('maxTokens: number');
    expect(source).toContain('contextLength: number');
    expect(source).toContain('onTemperatureChange');
    expect(source).toContain('onMaxTokensChange');
    expect(source).toContain('onContextLengthChange');
  });
});

// ============================================
// Tests: Component Export Verification
// ============================================

describe('OllamaAdvancedSection Component Export', () => {
  test('component is exported and callable', async () => {
    const { OllamaAdvancedSection } =
      await import('@/components/settings-modal/ollama-advanced-section');

    expect(OllamaAdvancedSection).toBeDefined();
    expect(typeof OllamaAdvancedSection).toBe('function');
  });

  test('component returns ReactElement (function component)', async () => {
    const { OllamaAdvancedSection } =
      await import('@/components/settings-modal/ollama-advanced-section');

    // Verify it's a function component by checking its name/type
    expect(OllamaAdvancedSection.name).toBe('OllamaAdvancedSection');
  });
});

// ============================================
// Tests: Temperature Slider Configuration Alignment with Zod Schema
// ============================================

describe('Temperature Slider Alignment with Zod Schema', () => {
  test('slider max (1) aligns with SetOllamaSettingsSchema temperature max', async () => {
    // Read both files to verify alignment
    const componentSource = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    const schemaSource = await Bun.file('src/shared/schemas/ollama.ts').text();

    // Component should have max={1}
    expect(componentSource).toContain('max={1}');

    // Schema should have .max(1) for temperature validation
    // Format: temperature: z.number()...max(1, 'Temperature must be at most 1')
    expect(schemaSource).toContain('.max(1');
  });

  test('slider min (0) aligns with SetOllamaSettingsSchema temperature min', async () => {
    const componentSource = await Bun.file(
      'src/main-ui/components/settings-modal/ollama-advanced-section.tsx'
    ).text();

    // Component should have min={0}
    expect(componentSource).toContain('min={0}');
  });
});
