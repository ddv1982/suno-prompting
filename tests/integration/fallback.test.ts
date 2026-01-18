import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

import { createSeededRng } from '@shared/utils/random';

import type { GenerationConfig } from '@bun/ai/types';

/**
 * Integration tests for LLM unavailable fallback scenarios.
 *
 * Tests verify:
 * - LLM unavailable → pure deterministic (no error)
 * - API key missing → pure deterministic (no error)
 * - Ollama offline → pure deterministic (no error)
 * - Same seed consistency (fallback = same output as before)
 * - No regression in fallback latency (~40ms)
 */

// Mock thematic context to track calls
const mockExtractThematicContext = mock(() => Promise.resolve(null));

// Mock Ollama availability
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: false, hasGemma: false })
);

await mock.module('@bun/ai/thematic-context', () => ({
  extractThematicContext: mockExtractThematicContext,
}));

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mock(() => {}),
}));

await mock.module('@bun/ai/ollama-client', () => ({
  generateWithOllama: mock(() => Promise.reject(new Error('Ollama offline'))),
}));

// Import after mocking
const { generateInitial } = await import('@bun/ai/generation');

function createMockConfig(overrides: Partial<GenerationConfig> = {}): GenerationConfig {
  return {
    getModel: () => ({} as unknown),
    getOllamaModel: () => ({} as unknown),
    isDebugMode: () => false,
    isMaxMode: () => false,
    isLyricsMode: () => false,
    isUseLocalLLM: () => false,
    isLLMAvailable: () => false, // LLM unavailable by default for fallback tests
    getUseSunoTags: () => true,
    getModelName: () => 'test-model',
    getProvider: () => 'groq',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    getOllamaEndpointIfLocal: () => undefined,
    ...overrides,
  } as GenerationConfig;
}

describe('Fallback Integration Tests', () => {
  beforeEach(() => {
    mockExtractThematicContext.mockReset();
    mockExtractThematicContext.mockResolvedValue(null);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('LLM unavailable scenarios', () => {
    test('LLM unavailable → pure deterministic output (no error)', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      // Should not throw
      const result = await generateInitial(
        { description: 'a jazz song with piano' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.title).toBeDefined();
      expect(result.lyrics).toBeUndefined();
    });

    test('LLM unavailable skips thematic extraction entirely', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      await generateInitial(
        { description: 'a rock song' },
        config
      );

      // Extraction should not be called when LLM unavailable
      expect(mockExtractThematicContext).not.toHaveBeenCalled();
    });

    test('API key missing → pure deterministic (no error)', async () => {
      // Simulate API key missing by making getModel throw
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
        getModel: () => { throw new Error('No API key configured'); },
      });

      // Should not throw - falls back to deterministic
      const result = await generateInitial(
        { description: 'an electronic song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('Ollama offline → pure deterministic (no error)', async () => {
      mockCheckOllamaAvailable.mockResolvedValue({ available: false, hasGemma: false });

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
        isUseLocalLLM: () => true,
      });

      // Should not throw
      const result = await generateInitial(
        { description: 'a classical song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
    });
  });

  describe('Same seed consistency', () => {
    test('same seed produces identical output in fallback mode', async () => {
      const seed = 42;

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      // Generate first time
      const result1 = await generateInitial(
        { description: 'a pop song' },
        config,
        { rng: createSeededRng(seed) }
      );

      // Generate second time with same seed
      const result2 = await generateInitial(
        { description: 'a pop song' },
        config,
        { rng: createSeededRng(seed) }
      );

      // Results should be identical
      expect(result1.text).toBe(result2.text);
    });

    test('fallback output matches pure deterministic baseline', async () => {
      const seed = 12345;

      // Generate with LLM unavailable (fallback)
      const configFallback = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const fallbackResult = await generateInitial(
        { description: 'a blues song' },
        configFallback,
        { rng: createSeededRng(seed) }
      );

      // Generate with LLM available but extraction returns null (should be same)
      mockExtractThematicContext.mockResolvedValue(null);
      const configHybrid = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const hybridResult = await generateInitial(
        { description: 'a blues song' },
        configHybrid,
        { rng: createSeededRng(seed) }
      );

      // When extraction returns null, output should match pure deterministic
      expect(fallbackResult.text).toBe(hybridResult.text);
    });
  });

  describe('Fallback latency', () => {
    test('fallback generation completes within 100ms', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const startTime = performance.now();
      await generateInitial(
        { description: 'a fast generation test' },
        config
      );
      const endTime = performance.now();

      // Should complete within 100ms (target is ~40ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('multiple fallback generations maintain consistent latency', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const times: number[] = [];

      // Run 5 generations and measure time
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await generateInitial(
          { description: `test song ${i}` },
          config
        );
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // All should be under 100ms
      times.forEach(time => {
        expect(time).toBeLessThan(100);
      });

      // Variance should be reasonable (no outliers)
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - average)));
      expect(maxDeviation).toBeLessThan(50);
    });
  });

  describe('Standard and Max mode fallback', () => {
    test('standard mode fallback produces valid format', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
        isMaxMode: () => false,
      });

      const result = await generateInitial(
        { description: 'a jazz song' },
        config
      );

      // Standard mode format verification
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');
      expect(result.text).toContain('Mood:');
      expect(result.text).toContain('Instruments:');
      expect(result.text).not.toContain('MAX_MODE');
    });

    test('max mode fallback produces valid format', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
        isMaxMode: () => true,
      });

      const result = await generateInitial(
        { description: 'an electronic song' },
        config
      );

      // Max mode format verification
      expect(result.text).toContain('MAX_MODE');
      expect(result.text).toContain('genre:');
      expect(result.text).toContain('bpm:');
      expect(result.text).toContain('instruments:');
    });
  });

  describe('Error handling during fallback', () => {
    test('extraction error falls back gracefully without user-visible error', async () => {
      // Make extraction throw an error
      mockExtractThematicContext.mockRejectedValue(new Error('Network error'));

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true, // LLM "available" but will fail
      });

      // Should not throw - falls back to deterministic
      const result = await generateInitial(
        { description: 'a rock song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('malformed extraction response falls back gracefully', async () => {
      // Return null (simulating malformed JSON that failed validation)
      mockExtractThematicContext.mockResolvedValue(null);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a country song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
    });
  });

  describe('Genre override with fallback', () => {
    test('genre override works correctly in fallback mode', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const result = await generateInitial(
        { description: 'a song', genreOverride: 'jazz' },
        config
      );

      expect(result.text.toLowerCase()).toContain('jazz');
    });

    test('locked phrase works correctly in fallback mode', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const result = await generateInitial(
        { description: 'a pop song', lockedPhrase: 'my-locked-phrase' },
        config
      );

      expect(result.text).toContain('my-locked-phrase');
    });
  });
});
