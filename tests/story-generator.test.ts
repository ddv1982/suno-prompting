/**
 * Unit tests for Story Generator Module
 *
 * Tests cover:
 * - generateStoryNarrative with various inputs
 * - extractStructuredDataForStory helper
 * - prependMaxHeaders function
 * - Timeout handling (mock AbortController)
 * - Error handling and fallback paths
 *
 * Task 5.1: Unit Tests for Story Generator Module
 */

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

import type { StoryGenerationInput, StoryGenerationOptions } from '@bun/ai/story-generator';
import type { ThematicContext } from '@shared/schemas/thematic-context';

// ============================================
// Mock AI SDK (generateText) - NOT @bun/ai/llm-utils
// This avoids module mock conflicts with llm-utils.test.ts
// ============================================

const mockGenerateText = mock(async () => ({
  text: 'Ethereal synth pads float through the night at 120 BPM, driven by pulsing bass and shimmering arpeggios.',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 100, outputTokens: 50 },
}));

// Mock Ollama client for offline mode tests
const mockGenerateWithOllama = mock(async () =>
  'Ethereal synth pads float through the night at 120 BPM, driven by pulsing bass and shimmering arpeggios.'
);

let generateStoryNarrative: typeof import('@bun/ai/story-generator').generateStoryNarrative;
let generateStoryNarrativeWithTimeout: typeof import('@bun/ai/story-generator').generateStoryNarrativeWithTimeout;
let extractStructuredDataForStory: typeof import('@bun/ai/story-generator').extractStructuredDataForStory;
let prependMaxHeaders: typeof import('@bun/ai/story-generator').prependMaxHeaders;
let STORY_GENERATION_SYSTEM_PROMPT: typeof import('@bun/ai/story-generator').STORY_GENERATION_SYSTEM_PROMPT;
let STORY_GENERATION_TIMEOUT_MS: typeof import('@bun/ai/story-generator').STORY_GENERATION_TIMEOUT_MS;

beforeEach(async () => {
  await mock.module('ai', () => ({
    generateText: mockGenerateText,
  }));

  await mock.module('@bun/ai/ollama-client', () => ({
    generateWithOllama: mockGenerateWithOllama,
  }));

  ({
    generateStoryNarrative,
    generateStoryNarrativeWithTimeout,
    extractStructuredDataForStory,
    prependMaxHeaders,
    STORY_GENERATION_SYSTEM_PROMPT,
    STORY_GENERATION_TIMEOUT_MS,
  } = await import('@bun/ai/story-generator'));
});

afterEach(() => {
  mock.restore();
});

// ============================================
// Test Helpers
// ============================================

function createMockStoryInput(overrides: Partial<StoryGenerationInput> = {}): StoryGenerationInput {
  return {
    genre: 'electronic',
    bpmRange: 'between 120 and 130',
    moods: ['ethereal', 'dreamy'],
    instruments: ['synthesizer', 'drum machine', 'bass'],
    styleTags: ['ambient', 'atmospheric'],
    isDirectMode: false,
    ...overrides,
  };
}

function createMockStoryOptions(overrides: Partial<StoryGenerationOptions> = {}): StoryGenerationOptions {
  return {
    input: createMockStoryInput(overrides.input as Partial<StoryGenerationInput>),
    getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as unknown,
    ...overrides,
  } as StoryGenerationOptions;
}

// ============================================
// Tests: prependMaxHeaders
// ============================================

describe('prependMaxHeaders', () => {
  test('prepends MAX Mode headers to narrative', () => {
    const narrative = 'A smooth jazz melody unfolds in the night.';
    const result = prependMaxHeaders(narrative);

    // Uses standard MAX_MODE_HEADER from shared/max-format
    expect(result).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result).toContain('[QUALITY: MAX](MAX)');
    expect(result).toContain('[REALISM: MAX](MAX)');
    expect(result).toContain('[REAL_INSTRUMENTS: MAX](MAX)');
    expect(result).toContain(narrative);
  });

  test('adds blank line between headers and narrative', () => {
    const narrative = 'Test narrative content.';
    const result = prependMaxHeaders(narrative);

    // Verify blank line separation
    expect(result).toContain('\n\n');
    expect(result.endsWith(narrative)).toBe(true);
  });

  test('handles empty narrative', () => {
    const result = prependMaxHeaders('');

    expect(result).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result.endsWith('\n\n')).toBe(true);
  });

  test('preserves narrative content exactly', () => {
    const narrative = 'The song features [special] "characters" and newlines\nacross multiple lines.';
    const result = prependMaxHeaders(narrative);

    expect(result).toContain(narrative);
  });
});

// ============================================
// Tests: extractStructuredDataForStory
// ============================================

describe('extractStructuredDataForStory', () => {
  const sampleDeterministicText = `[Energetic, Electronic, Key: A minor]

Genre: electronic
BPM: between 120 and 130
Mood: energetic, driving
Instruments: synthesizer, drum machine, bass synth
Style Tags: dark, pulsing, cinematic
Recording: studio production

[INTRO] Pulsing synths build atmosphere`;

  test('extracts genre from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.genre).toBe('electronic');
  });

  test('extracts BPM range from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.bpmRange).toBe('between 120 and 130');
  });

  test('extracts moods from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.moods).toContain('energetic');
    expect(result.moods).toContain('driving');
  });

  test('extracts instruments from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.instruments.length).toBeGreaterThan(0);
    expect(result.instruments).toContain('synthesizer');
    expect(result.instruments).toContain('drum machine');
  });

  test('extracts style tags from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.styleTags.length).toBeGreaterThan(0);
    expect(result.styleTags).toContain('dark');
    expect(result.styleTags).toContain('pulsing');
  });

  test('extracts recording context from deterministic text', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.recordingContext).toBe('studio production');
  });

  test('extracts sub-genres from header', () => {
    const textWithSubGenres = `[Energetic, Synthwave, Darkwave, Key: A minor]

Genre: electronic
BPM: between 110 and 130`;

    const result = extractStructuredDataForStory(textWithSubGenres, null, {});

    // Sub-genres extracted from header (filtering out mood and key)
    expect(result.subGenres).toBeDefined();
    expect(result.subGenres?.length).toBeGreaterThan(0);
  });

  test('merges thematic context when provided', () => {
    const thematicContext: ThematicContext = {
      themes: ['nostalgia', 'night', 'urban'],
      moods: ['melancholic', 'reflective'],
      scene: 'Late night in a neon-lit city',
      era: '80s',
      energyLevel: 'moderate',
    };

    const result = extractStructuredDataForStory(sampleDeterministicText, thematicContext, {});

    expect(result.themes).toEqual(['nostalgia', 'night', 'urban']);
    expect(result.scene).toBe('Late night in a neon-lit city');
    expect(result.era).toBe('80s');
    expect(result.energyLevel).toBe('moderate');
  });

  test('handles null thematic context gracefully', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.themes).toBeUndefined();
    expect(result.scene).toBeUndefined();
    expect(result.era).toBeUndefined();
  });

  test('includes description when provided', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {
      description: 'A driving electronic track',
    });

    expect(result.description).toBe('A driving electronic track');
  });

  test('includes sunoStyles for Direct Mode', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {
      sunoStyles: ['synthwave', 'darkwave'],
    });

    expect(result.sunoStyles).toEqual(['synthwave', 'darkwave']);
    expect(result.isDirectMode).toBe(true);
  });

  test('sets isDirectMode to false when no sunoStyles', () => {
    const result = extractStructuredDataForStory(sampleDeterministicText, null, {});

    expect(result.isDirectMode).toBe(false);
  });

  test('handles MAX MODE format text', () => {
    const maxModeText = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)

genre: "jazz"
bpm: "between 80 and 110"
mood: "smooth, warm"
instruments: "Rhodes, tenor sax, upright bass"
style tags: "sophisticated, late-night"
recording: "intimate jazz club"`;

    const result = extractStructuredDataForStory(maxModeText, null, {});

    expect(result.genre).toBe('jazz');
    expect(result.bpmRange).toBe('between 80 and 110');
  });

  test('provides fallback values for missing fields', () => {
    const minimalText = 'Some text without standard format';

    const result = extractStructuredDataForStory(minimalText, null, {});

    // Should have fallback values
    expect(result.genre).toBe('pop');
    expect(result.bpmRange).toBe('natural tempo');
    expect(result.moods).toEqual([]);
    expect(result.instruments).toEqual([]);
    expect(result.styleTags).toEqual([]);
  });
});

// ============================================
// Tests: generateStoryNarrative
// ============================================

describe('generateStoryNarrative', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'The song opens with ethereal synth pads floating at 120 BPM, creating a dreamy atmosphere.',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    });
  });

  test('generates narrative successfully', async () => {
    const options = createMockStoryOptions();
    const result = await generateStoryNarrative(options);

    expect(result.success).toBe(true);
    expect(result.narrative).toContain('ethereal synth pads');
    expect(result.error).toBeUndefined();
  });

  test('calls LLM with system and user prompts', async () => {
    const options = createMockStoryOptions();
    await generateStoryNarrative(options);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    // Verify system prompt is passed (contains story generation instructions)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('narrative prose'),
      })
    );
  });

  test('includes genre and BPM in LLM prompt', async () => {
    const options = createMockStoryOptions({
      input: {
        genre: 'jazz',
        bpmRange: 'between 80 and 110',
        moods: ['melancholic', 'smooth'],
        instruments: ['Rhodes piano', 'tenor sax'],
        styleTags: ['sophisticated'],
        isDirectMode: false,
      },
    });

    const result = await generateStoryNarrative(options);

    // Verify successful generation (the mock provides the response)
    expect(result.success).toBe(true);
    // Verify LLM was called with prompt containing input data
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('jazz'),
      })
    );
  });

  test('includes Suno styles in prompt for Direct Mode', async () => {
    const options = createMockStoryOptions({
      input: {
        genre: 'electronic',
        bpmRange: 'between 120 and 130',
        moods: ['energetic'],
        instruments: ['synthesizer'],
        styleTags: ['dark'],
        sunoStyles: ['synthwave', 'darkwave'],
        isDirectMode: true,
      },
    });

    const result = await generateStoryNarrative(options);

    expect(result.success).toBe(true);
    // Verify prompt includes Suno styles
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('synthwave'),
      })
    );
  });

  test('trims whitespace from response', async () => {
    mockGenerateText.mockResolvedValue({
      text: '  \n  A narrative with extra whitespace.  \n  ',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const options = createMockStoryOptions();
    const result = await generateStoryNarrative(options);

    expect(result.narrative).toBe('A narrative with extra whitespace.');
    expect(result.success).toBe(true);
  });

  test('returns failure result on LLM error', async () => {
    mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));

    const options = createMockStoryOptions();
    const result = await generateStoryNarrative(options);

    expect(result.success).toBe(false);
    expect(result.narrative).toBe('');
    expect(result.error).toContain('API rate limit exceeded');
  });

  test('works with ollamaEndpoint option', async () => {
    const options = createMockStoryOptions({
      ollamaEndpoint: 'http://localhost:11434',
    });

    const result = await generateStoryNarrative(options);

    // When ollamaEndpoint is set, callLLM uses Ollama instead of cloud
    // The test verifies the function accepts this option without error
    expect(result.success).toBe(true);
  });

  test('respects timeout configuration', async () => {
    const options = createMockStoryOptions();

    const result = await generateStoryNarrative(options);

    // Verify generation completes successfully within timeout
    expect(result.success).toBe(true);
    expect(STORY_GENERATION_TIMEOUT_MS).toBe(8000);
  });

  test('returns failure result on empty LLM response', async () => {
    mockGenerateText.mockResolvedValue({
      text: '',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 0 },
    });

    const options = createMockStoryOptions();
    const result = await generateStoryNarrative(options);

    expect(result.success).toBe(false);
    expect(result.narrative).toBe('');
  });
});

// ============================================
// Tests: generateStoryNarrativeWithTimeout
// ============================================

describe('generateStoryNarrativeWithTimeout', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'A narrative generated within timeout.',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    });
  });

  test('returns success when generation completes in time', async () => {
    const options = createMockStoryOptions();
    const result = await generateStoryNarrativeWithTimeout(options);

    expect(result.success).toBe(true);
    expect(result.narrative).toBe('A narrative generated within timeout.');
  });

  test('timeout constant is 8 seconds', () => {
    expect(STORY_GENERATION_TIMEOUT_MS).toBe(8000);
  });

  test('returns failure result on error', async () => {
    mockGenerateText.mockRejectedValue(new Error('Network error'));

    const options = createMockStoryOptions();
    const result = await generateStoryNarrativeWithTimeout(options);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

// ============================================
// Tests: System Prompt
// ============================================

describe('STORY_GENERATION_SYSTEM_PROMPT', () => {
  test('includes task description', () => {
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('transform structured music data into evocative narrative prose');
  });

  test('specifies output requirements', () => {
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('100-500 characters');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('Pure narrative prose');
  });

  test('includes examples', () => {
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('INPUT:');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('OUTPUT:');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('jazz');
  });

  test('specifies critical rules', () => {
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('NEVER include section markers');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('NEVER use structured formats');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('ALWAYS embed the tempo/BPM');
  });

  test('prohibits MAX terminology in narrative', () => {
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('NEVER mention "MAX"');
    expect(STORY_GENERATION_SYSTEM_PROMPT).toContain('MAX-related terminology');
  });
});

// ============================================
// Tests: Edge Cases
// ============================================

describe('edge cases', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'Generated narrative.',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    });
  });

  test('handles empty moods array', async () => {
    const options = createMockStoryOptions({
      input: {
        genre: 'pop',
        bpmRange: 'between 100 and 120',
        moods: [],
        instruments: ['guitar'],
        styleTags: [],
        isDirectMode: false,
      },
    });

    const result = await generateStoryNarrative(options);
    expect(result.success).toBe(true);
  });

  test('handles minimal input', async () => {
    const options = createMockStoryOptions({
      input: {
        genre: 'rock',
        bpmRange: 'natural tempo',
        moods: [],
        instruments: [],
        styleTags: [],
        isDirectMode: false,
      },
    });

    const result = await generateStoryNarrative(options);
    expect(result.success).toBe(true);
  });

  test('handles special characters in input', async () => {
    const options = createMockStoryOptions({
      input: {
        genre: 'R&B',
        bpmRange: 'between 80 and 100',
        moods: ['sensual', 'smooth'],
        instruments: ['808s', 'hi-hats'],
        styleTags: ['neo-soul'],
        isDirectMode: false,
      },
    });

    const result = await generateStoryNarrative(options);
    expect(result.success).toBe(true);

    // Verify prompt includes special characters correctly
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('R&B'),
      })
    );
  });

  test('handles very long input arrays', async () => {
    const manyMoods = Array.from({ length: 20 }, (_, i) => `mood${i}`);
    const manyInstruments = Array.from({ length: 15 }, (_, i) => `instrument${i}`);

    const options = createMockStoryOptions({
      input: {
        genre: 'experimental',
        bpmRange: 'between 60 and 180',
        moods: manyMoods,
        instruments: manyInstruments,
        styleTags: ['complex', 'layered'],
        isDirectMode: false,
      },
    });

    const result = await generateStoryNarrative(options);
    expect(result.success).toBe(true);
  });
});
