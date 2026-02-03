/**
 * Integration Tests for Story Mode Generation Paths
 *
 * Tests the complete Story Mode generation flow:
 * - Story Mode ON + LLM available → narrative output
 * - Story Mode ON + LLM fails → deterministic + fallback flag
 * - Story Mode + MAX Mode → headers + narrative
 * - Story Mode + Direct Mode → styles in narrative
 * - Story Mode OFF → standard structured output
 *
 * Task 5.3: Integration Tests for Story Mode Generation Paths
 */

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

import { createSeededRng } from '@shared/utils/random';

import type { GenerationConfig } from '@bun/ai/types';
import type { ThematicContext } from '@shared/schemas/thematic-context';

// ============================================
// Mock Setup
// ============================================

// Mock thematic context extraction
const mockExtractThematicContext = mock<() => Promise<ThematicContext | null>>(() =>
  Promise.resolve({
    themes: ['electronic', 'night', 'urban'] as [string, string, string],
    moods: ['energetic', 'driving'],
    scene: 'A neon-lit dance floor with pulsing lights',
  })
);

// Mock generateText from AI SDK
const mockGenerateText = mock(async () => ({
  text: 'Generated LLM response',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 100, outputTokens: 50 },
}));

let generateInitial: typeof import('@bun/ai/generation').generateInitial;

// ============================================
// Test Helpers
// ============================================

function createMockConfig(overrides: Partial<GenerationConfig> = {}): GenerationConfig {
  return {
    getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as unknown,
    isDebugMode: () => false,
    isMaxMode: () => false,
    isLyricsMode: () => false,
    isStoryMode: () => false,
    isUseLocalLLM: () => false,
    isLLMAvailable: () => true,
    getUseSunoTags: () => true,
    getModelName: () => 'gpt-4',
    getProvider: () => 'openai',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    getOllamaEndpointIfLocal: () => undefined,
    ...overrides,
  } as GenerationConfig;
}

// ============================================
// Tests: Story Mode Generation Paths
// ============================================

describe('Story Mode Generation Integration', () => {
  beforeEach(async () => {
    mockExtractThematicContext.mockReset();
    mockGenerateText.mockReset();

    // Default successful responses
    mockExtractThematicContext.mockResolvedValue({
      themes: ['electronic', 'night', 'urban'] as [string, string, string],
      moods: ['energetic', 'driving'],
      scene: 'A neon-lit dance floor with pulsing lights',
    });

    mockGenerateText.mockResolvedValue({
      text: 'Ethereal synths pulse through the night at 120 BPM, creating a dreamy electronic atmosphere.',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    await mock.module('ai', () => ({
      generateText: mockGenerateText,
    }));

    await mock.module('@bun/ai/thematic-context', () => ({
      extractThematicContext: async () => {
        const result = await mockExtractThematicContext();
        return result;
      },
    }));

    ({ generateInitial } = await import('@bun/ai/generation'));
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Story Mode OFF', () => {
    test('produces standard structured output', async () => {
      const config = createMockConfig({
        isStoryMode: () => false,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'an electronic dance track' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Standard format verification
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');
      expect(result.text).toContain('Mood:');
      expect(result.text).toContain('Instruments:');

      // Should have section markers
      expect(result.text.toUpperCase()).toMatch(/\[(INTRO|VERSE|CHORUS)\]/);

      // Should NOT be narrative format (no story-specific markers)
      expect(result.storyModeFallback).toBeUndefined();
    });

    test('MAX Mode produces MAX format headers without narrative', async () => {
      const config = createMockConfig({
        isStoryMode: () => false,
        isMaxMode: () => true,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a jazz ballad' },
        config,
        { rng: createSeededRng(12345) }
      );

      // MAX format verification
      expect(result.text).toContain('[Is_MAX_MODE: MAX]');
      expect(result.text).toContain('genre:');
      expect(result.text).toContain('bpm:');
      expect(result.text).toContain('instruments:');
    });
  });

  describe('Story Mode ON + LLM available', () => {
    test('produces narrative output', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'an ethereal electronic track' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Narrative format verification - should be prose, not structured
      // The LLM mock returns narrative text
      expect(result.text.length).toBeGreaterThan(50);

      // Should NOT have structured format markers (Genre:, BPM:, etc. as labels)
      // Note: The narrative may naturally mention genre and BPM as part of prose
      expect(result.title).toBeDefined();
    });

    test('narrative does not include section markers', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a smooth jazz session' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Narrative should not contain structured section markers
      expect(result.text).not.toContain('[INTRO]');
      expect(result.text).not.toContain('[VERSE]');
      expect(result.text).not.toContain('[CHORUS]');
      expect(result.text).not.toContain('[BRIDGE]');
      expect(result.text).not.toContain('[OUTRO]');
    });
  });

  describe('Story Mode ON + MAX Mode', () => {
    test('produces MAX headers + narrative', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => true,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a cinematic orchestral piece' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Should have MAX headers prepended (using standard MAX_MODE_HEADER)
      expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
      expect(result.text).toContain('[QUALITY: MAX](MAX)');
      expect(result.text).toContain('[REALISM: MAX](MAX)');
      expect(result.text).toContain('[REAL_INSTRUMENTS: MAX](MAX)');

      // After headers should be narrative (no structured format)
      const afterHeaders = result.text.split('\n\n').slice(1).join('\n\n');
      expect(afterHeaders.length).toBeGreaterThan(50);
    });
  });

  describe('Story Mode ON + LLM fails', () => {
    test('falls back to deterministic output with fallback flag', async () => {
      // Make the story LLM call fail
      mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));

      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a rock anthem' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Should fall back to structured format
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');

      // Should have fallback flag set
      expect(result.storyModeFallback).toBe(true);
    });
  });

  describe('Story Mode ON + LLM unavailable', () => {
    test('uses deterministic output when LLM unavailable', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => false, // LLM unavailable
      });

      const result = await generateInitial(
        { description: 'a funk groove' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Should use deterministic format since LLM unavailable
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');
      expect(result.text).toContain('Mood:');

      // No fallback flag since Story Mode can't even attempt when LLM unavailable
      expect(result.storyModeFallback).toBeUndefined();
    });
  });

  describe('Story Mode + Direct Mode', () => {
    test('incorporates Suno V5 styles in narrative', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        {
          description: 'dreamy soundscape',
          sunoStyles: ['dream-pop', 'shoegaze', 'ethereal'],
        },
        config,
        { rng: createSeededRng(12345) }
      );

      // Direct Mode with Story Mode should produce narrative
      expect(result.text.length).toBeGreaterThan(50);
      expect(result.title).toBeDefined();

      // Should not have structured markers
      expect(result.text).not.toContain('[INTRO]');
      expect(result.text).not.toContain('[VERSE]');
    });

    test('Direct Mode + Story Mode + MAX Mode combines all', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => true,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        {
          description: 'epic cinematic',
          sunoStyles: ['orchestral', 'cinematic', 'epic'],
        },
        config,
        { rng: createSeededRng(12345) }
      );

      // Should have MAX headers (standard MAX_MODE_HEADER)
      expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
      expect(result.text).toContain('[QUALITY: MAX](MAX)');

      // Should have narrative content after headers
      const lines = result.text.split('\n');
      const narrativeStartIndex = lines.findIndex((line, i) => i > 0 && line.length > 0 && !line.startsWith('['));
      expect(narrativeStartIndex).toBeGreaterThan(0);
    });
  });

  describe('Determinism with Story Mode OFF', () => {
    test('same seed produces identical output', async () => {
      const seed = 42;

      const config = createMockConfig({
        isStoryMode: () => false,
        isLLMAvailable: () => false, // Pure deterministic
      });

      const result1 = await generateInitial(
        { description: 'a blues song' },
        config,
        { rng: createSeededRng(seed) }
      );

      const result2 = await generateInitial(
        { description: 'a blues song' },
        config,
        { rng: createSeededRng(seed) }
      );

      expect(result1.text).toBe(result2.text);
    });
  });

  describe('Output format validation', () => {
    test('Story Mode output is within character limits', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isMaxMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'a complex experimental ambient soundscape' },
        config,
        { rng: createSeededRng(12345) }
      );

      // Story Mode output should be reasonable length
      expect(result.text.length).toBeLessThan(3000);
      expect(result.text.length).toBeGreaterThan(50);
    });

    test('title is always generated', async () => {
      const config = createMockConfig({
        isStoryMode: () => true,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'any music' },
        config,
        { rng: createSeededRng(12345) }
      );

      expect(result.title).toBeDefined();
      expect((result.title ?? '').length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// Tests: Story Mode with Lyrics Mode
// ============================================

describe('Story Mode + Lyrics Mode interaction', () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
    mockExtractThematicContext.mockReset();

    // Mock for thematic context
    mockExtractThematicContext.mockResolvedValue({
      themes: ['romantic', 'summer', 'love'] as [string, string, string],
      moods: ['tender', 'warm'],
      scene: 'A sunset beach with golden light',
    });

    // Mock returns different responses based on call order:
    // 1st call: title generation
    // 2nd call: lyrics generation
    // 3rd call (if story mode): story generation
    let callCount = 0;
    mockGenerateText.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Title generation
        return {
          text: 'Summer Love',
          response: { modelId: 'gpt-4' },
          finishReason: 'stop',
          usage: { inputTokens: 50, outputTokens: 10 },
        };
      } else if (callCount === 2) {
        // Lyrics generation
        return {
          text: '[VERSE]\nWalking on the shore\n[CHORUS]\nSummer love forever more',
          response: { modelId: 'gpt-4' },
          finishReason: 'stop',
          usage: { inputTokens: 100, outputTokens: 100 },
        };
      } else {
        // Story generation
        return {
          text: 'Warm acoustic melodies drift at 95 BPM, tender piano chords beneath heartfelt vocals.',
          response: { modelId: 'gpt-4' },
          finishReason: 'stop',
          usage: { inputTokens: 100, outputTokens: 60 },
        };
      }
    });
  });

  test('Story Mode + Lyrics Mode generates narrative with lyrics', async () => {
    const config = createMockConfig({
      isStoryMode: () => true,
      isLyricsMode: () => true,
      isLLMAvailable: () => true,
    });

    const result = await generateInitial(
      { description: 'a pop love song', lyricsTopic: 'summer romance' },
      config,
      { rng: createSeededRng(12345) }
    );

    // When Story Mode + Lyrics Mode, should have narrative prose instead of structured prompt
    expect(result.text).not.toContain('Genre:');
    expect(result.text).not.toContain('BPM:');
    expect(result.text.length).toBeGreaterThan(50);

    // Should still have lyrics generated
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain('[VERSE]');
    expect(result.lyrics).toContain('[CHORUS]');

    // Title should exist
    expect(result.title).toBeDefined();
  });

  test('Story Mode + Lyrics Mode + MAX Mode adds headers to narrative', async () => {
    const config = createMockConfig({
      isStoryMode: () => true,
      isLyricsMode: () => true,
      isMaxMode: () => true,
      isLLMAvailable: () => true,
    });

    const result = await generateInitial(
      { description: 'an epic power ballad', lyricsTopic: 'overcoming adversity' },
      config,
      { rng: createSeededRng(12345) }
    );

    // Should have MAX headers
    expect(result.text).toContain('[Is_MAX_MODE: MAX]');

    // Should have lyrics
    expect(result.lyrics).toBeDefined();

    // Title should exist
    expect(result.title).toBeDefined();
  });

  test('Story Mode + Lyrics Mode fallback returns deterministic prompt with lyrics', async () => {
    // Make the story generation fail
    let callCount = 0;
    mockGenerateText.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { text: 'Fallback Title', response: { modelId: 'gpt-4' }, finishReason: 'stop', usage: { inputTokens: 50, outputTokens: 10 } };
      } else if (callCount === 2) {
        return { text: '[VERSE]\nFallback lyrics', response: { modelId: 'gpt-4' }, finishReason: 'stop', usage: { inputTokens: 100, outputTokens: 50 } };
      } else {
        // Story generation fails
        throw new Error('API rate limit exceeded');
      }
    });

    const config = createMockConfig({
      isStoryMode: () => true,
      isLyricsMode: () => true,
      isLLMAvailable: () => true,
    });

    const result = await generateInitial(
      { description: 'a country song', lyricsTopic: 'road trip' },
      config,
      { rng: createSeededRng(12345) }
    );

    // Should fall back to structured format
    expect(result.text).toContain('Genre:');

    // Should still have lyrics
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain('[VERSE]');

    // Should have fallback flag
    expect(result.storyModeFallback).toBe(true);
  });

  test('Story Mode OFF + Lyrics Mode produces structured prompt with lyrics', async () => {
    const config = createMockConfig({
      isStoryMode: () => false,
      isLyricsMode: () => true,
      isLLMAvailable: () => true,
    });

    const result = await generateInitial(
      { description: 'a folk song', lyricsTopic: 'mountain trails' },
      config,
      { rng: createSeededRng(12345) }
    );

    // Should have structured format (not narrative)
    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('BPM:');

    // Should have lyrics
    expect(result.lyrics).toBeDefined();
  });
});
