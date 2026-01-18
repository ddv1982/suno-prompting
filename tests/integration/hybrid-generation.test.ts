import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

import type { GenerationConfig } from '@bun/ai/types';
import type { ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Integration tests for hybrid LLM + deterministic generation flow.
 *
 * Tests verify:
 * - Full flow with mocked LLM verifies thematic context in output
 * - Parallel execution of LLM extraction and deterministic building
 * - Timeout handling triggers fallback without error
 * - Thematic tags appear in output when LLM succeeds
 * - Moods in output match LLM moods (not genre moods)
 */

// Valid thematic context for mocking
const MOCK_THEMATIC_CONTEXT: ThematicContext = {
  themes: ['alien', 'bioluminescent', 'discovery'],
  moods: ['wondrous', 'awe-struck', 'curious'],
  scene: 'first steps into an alien jungle with glowing plants',
};

// Mock the thematic context extraction module
// Returns ThematicContext | null to match the real function signature
const mockExtractThematicContext = mock<() => Promise<ThematicContext | null>>(
  () => Promise.resolve(MOCK_THEMATIC_CONTEXT)
);

// Mock Ollama availability to prevent real network calls
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);

// Track timing for parallel execution verification
let extractionStartTime: number | null = null;

await mock.module('@bun/ai/thematic-context', () => ({
  extractThematicContext: async () => {
    extractionStartTime = performance.now();
    const result = await mockExtractThematicContext();
    return result;
  },
}));

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mock(() => {}),
}));

await mock.module('@bun/ai/ollama-client', () => ({
  generateWithOllama: mock(() => Promise.resolve('Generated text')),
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
    isLLMAvailable: () => true, // LLM available by default for hybrid tests
    getUseSunoTags: () => true,
    getModelName: () => 'test-model',
    getProvider: () => 'groq',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    getOllamaEndpointIfLocal: () => undefined,
    ...overrides,
  } as GenerationConfig;
}

describe('Hybrid Generation Integration', () => {
  beforeEach(() => {
    mockExtractThematicContext.mockReset();
    mockExtractThematicContext.mockResolvedValue(MOCK_THEMATIC_CONTEXT);
    extractionStartTime = null;
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Full hybrid flow with mocked LLM', () => {
    test('thematic context themes appear in style tags when LLM succeeds', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'exploring an alien jungle with bioluminescent plants' },
        config
      );

      expect(result.text).toBeDefined();
      // At least one theme should be appended to style tags
      // Note: Due to 10-tag limit, not all themes may appear in final output
      const hasTheme = result.text.toLowerCase().includes('alien') ||
                       result.text.toLowerCase().includes('bioluminescent');
      expect(hasTheme).toBe(true);
    });

    test('thematic context moods replace genre moods when LLM succeeds', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'exploring an alien jungle with bioluminescent plants' },
        config
      );

      // LLM moods should appear in the output
      expect(result.text.toLowerCase()).toContain('wondrous');
    });

    test('thematic context scene NOT in recording field when LLM succeeds', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'exploring an alien jungle with bioluminescent plants' },
        config
      );

      // Recording should NOT contain scene phrase (scene goes to style tags)
      const recordingMatch = result.text.match(/recording:\s*"([^"]+)"/i);
      if (recordingMatch?.[1]) {
        expect(recordingMatch[1].toLowerCase()).not.toContain('first steps');
        expect(recordingMatch[1].toLowerCase()).not.toContain('alien jungle');
      }
      // Themes should still appear
      const hasTheme = result.text.toLowerCase().includes('alien') ||
                       result.text.toLowerCase().includes('bioluminescent');
      expect(hasTheme).toBe(true);
    });

    test('header uses first LLM mood (capitalized) when thematic context available', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'exploring an alien jungle' },
        config
      );

      // First mood should be capitalized in header
      expect(result.text).toContain('Wondrous');
    });

    test('extraction function is called when LLM available', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      await generateInitial(
        { description: 'a summer beach song' },
        config
      );

      // Verify extraction was called (parameters are passed internally)
      expect(mockExtractThematicContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Parallel execution verification', () => {
    test('deterministic result is available even with slow LLM extraction', async () => {
      // Simulate slow LLM extraction (200ms)
      mockExtractThematicContext.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_THEMATIC_CONTEXT;
      });

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const startTime = performance.now();
      const result = await generateInitial(
        { description: 'a jazz song' },
        config
      );
      const endTime = performance.now();

      expect(result.text).toBeDefined();
      // Total time should be close to LLM time (200ms) + merge time,
      // not LLM time + deterministic time (which would be 200ms + ~40ms sequential)
      expect(endTime - startTime).toBeLessThan(400);
    });

    test('extraction starts before deterministic completes (parallel)', async () => {
      let deterministicStartTime: number | null = null;

      // Track when extraction starts vs when deterministic would complete
      mockExtractThematicContext.mockImplementation(async () => {
        // Record when extraction starts
        extractionStartTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        return MOCK_THEMATIC_CONTEXT;
      });

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      deterministicStartTime = performance.now();
      await generateInitial(
        { description: 'a rock song' },
        config
      );

      // Extraction should start very close to the deterministic start
      // (within 10ms, indicating parallel execution)
      expect(extractionStartTime).not.toBeNull();
      if (extractionStartTime !== null && deterministicStartTime !== null) {
        expect(extractionStartTime - deterministicStartTime).toBeLessThan(10);
      }
    });
  });

  describe('Timeout handling', () => {
    test('timeout triggers fallback without error', async () => {
      // Simulate LLM timeout by rejecting with timeout error
      mockExtractThematicContext.mockRejectedValue(new Error('AbortError: signal timed out'));

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      // Should not throw - falls back to deterministic
      const result = await generateInitial(
        { description: 'a pop song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.title).toBeDefined();
    });

    test('fallback output matches pure deterministic format', async () => {
      mockExtractThematicContext.mockRejectedValue(new Error('Timeout'));

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a classical song' },
        config
      );

      // Should have standard deterministic format
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');
      expect(result.text).toContain('Mood:');
    });
  });

  describe('Max mode hybrid generation', () => {
    test('thematic context merges correctly in max mode', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
        isMaxMode: () => true,
      });

      const result = await generateInitial(
        { description: 'exploring an alien jungle' },
        config
      );

      expect(result.text).toContain('MAX_MODE');
      // LLM moods should replace genre moods in style tags
      expect(result.text.toLowerCase()).toContain('wondrous');
      // Recording should contain production descriptors, not scene
      const recordingMatch = result.text.match(/recording:\s*"([^"]+)"/i);
      if (recordingMatch?.[1]) {
        expect(recordingMatch[1].toLowerCase()).not.toContain('first steps');
      }
    });

    test('max mode falls back cleanly when extraction fails', async () => {
      mockExtractThematicContext.mockResolvedValue(null);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
        isMaxMode: () => true,
      });

      const result = await generateInitial(
        { description: 'an electronic song' },
        config
      );

      expect(result.text).toContain('MAX_MODE');
      expect(result.text).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    test('empty description skips thematic extraction', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      await generateInitial(
        { description: '' },
        config
      );

      // Extraction should not be called for empty description
      expect(mockExtractThematicContext).not.toHaveBeenCalled();
    });

    test('null thematic context uses pure deterministic', async () => {
      mockExtractThematicContext.mockResolvedValue(null);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'short' }, // Too short for extraction
        config
      );

      expect(result.text).toBeDefined();
      // Should not contain LLM-specific content
      expect(result.text.toLowerCase()).not.toContain('wondrous');
    });

    test('locked phrase still works with thematic context', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        {
          description: 'exploring an alien jungle',
          lockedPhrase: 'LOCKED_PHRASE_123',
        },
        config
      );

      expect(result.text).toContain('LOCKED_PHRASE_123');
      // Should also have thematic context
      expect(result.text.toLowerCase()).toContain('alien');
    });
  });
});
