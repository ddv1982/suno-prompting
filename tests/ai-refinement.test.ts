import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';

import type { RefinementConfig } from '@bun/ai/types';

let refinePrompt: typeof import('@bun/ai/refinement').refinePrompt;
let mockCheckOllamaAvailable: ReturnType<typeof mock>;
let mockInvalidateOllamaCache: ReturnType<typeof mock>;
let mockGenerateWithOllama: ReturnType<typeof mock>;
let mockGenerateText: ReturnType<typeof mock>;
let mockCreateProviderRegistry: ReturnType<typeof mock>;
let mockExtractGenreFromPrompt: ReturnType<typeof mock>;
let mockExtractMoodFromPrompt: ReturnType<typeof mock>;
let mockRemixStyleTags: ReturnType<typeof mock>;

beforeEach(async () => {
  mockCheckOllamaAvailable = mock(() =>
    Promise.resolve({ available: true, hasGemma: true })
  );
  mockInvalidateOllamaCache = mock(() => {});
  mockGenerateWithOllama = mock(() =>
    Promise.resolve('[Verse]\nRefined lyrics from Ollama')
  );
  mockGenerateText = mock(() =>
    Promise.resolve({
      text: JSON.stringify({
        prompt: 'Refined jazz prompt with more piano',
        title: 'Refined Title',
        lyrics: '[VERSE]\nRefined lyrics here',
      }),
    })
  );
  mockCreateProviderRegistry = mock(() => ({
    languageModel: () => ({}),
  }));
  mockExtractGenreFromPrompt = mock(() => 'jazz');
  mockExtractMoodFromPrompt = mock(() => 'mellow');
  mockRemixStyleTags = mock((prompt: string) => ({
    text: `${prompt} with remixed style tags`,
    genre: 'jazz',
  }));

  await mock.module('@bun/ai/ollama-availability', () => ({
    checkOllamaAvailable: mockCheckOllamaAvailable,
    invalidateOllamaCache: mockInvalidateOllamaCache,
  }));

  await mock.module('@bun/ai/ollama-client', () => ({
    generateWithOllama: mockGenerateWithOllama,
  }));

  await mock.module('ai', () => ({
    generateText: mockGenerateText,
    createProviderRegistry: mockCreateProviderRegistry,
    experimental_createProviderRegistry: mockCreateProviderRegistry,
  }));

  await mock.module('@bun/prompt/deterministic', () => ({
    extractGenreFromPrompt: mockExtractGenreFromPrompt,
    extractMoodFromPrompt: mockExtractMoodFromPrompt,
    remixStyleTags: mockRemixStyleTags,
  }));

  ({ refinePrompt } = await import('@bun/ai/refinement'));
});

afterEach(() => {
  mock.restore();
});

function createMockConfig(overrides: Partial<RefinementConfig> = {}): RefinementConfig {
  return {
    getModel: () => ({} as any),
    isDebugMode: () => false,
    isMaxMode: () => false,
    isLyricsMode: () => false,
    isStoryMode: () => false,
    isUseLocalLLM: () => false,
    isLLMAvailable: () => false,
    getUseSunoTags: () => true,
    getModelName: () => 'test-model',
    getProvider: () => 'groq',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    getOllamaEndpointIfLocal: () => undefined,
    postProcess: async (text: string) => text,
    ...overrides,
  };
}

describe('refinePrompt', () => {
  test('refines prompt with feedback (deterministic style)', async () => {
    const config = createMockConfig();

    const result = await refinePrompt(
      {
        currentPrompt: 'A jazz song',
        currentTitle: 'Original Title',
        feedback: 'Add more piano',
      },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.text).toContain('jazz');
    // Title is preserved (not refined by LLM) in deterministic mode
    expect(result.title).toBe('Original Title');
  });

  test('preserves current title when JSON parse fails', async () => {
    const config = createMockConfig();

    const result = await refinePrompt(
      {
        currentPrompt: 'genre: "pop"\nbpm: "120"',
        currentTitle: 'My Pop Song',
        feedback: 'Add more energy',
      },
      config
    );

    expect(result.title).toBeDefined();
  });

  test('includes lyrics when lyrics mode is enabled', async () => {
    const config = createMockConfig({ isLyricsMode: () => true });

    const result = await refinePrompt(
      {
        currentPrompt: 'A ballad',
        currentTitle: 'Love Song',
        feedback: 'Make it sadder',
        currentLyrics: '[VERSE]\nOriginal lyrics',
      },
      config
    );

    expect(result.lyrics).toBeDefined();
  });

  test('bootstraps lyrics when lyrics mode is enabled but currentLyrics is missing', async () => {
    const config = createMockConfig({ isLyricsMode: () => true });

    const result = await refinePrompt(
      {
        currentPrompt: 'A ballad',
        currentTitle: 'Love Song',
        feedback: '',
        lyricsTopic: 'rainy night',
      },
      config
    );

    expect(result.lyrics).toBeDefined();
  });

  test('bootstraps lyrics in direct mode when lyrics mode is enabled and currentLyrics is missing', async () => {
    const config = createMockConfig({ isLyricsMode: () => true });

    const result = await refinePrompt(
      {
        currentPrompt: 'old prompt',
        currentTitle: 'Direct Mode Title',
        feedback: '',
        lyricsTopic: 'city lights',
        sunoStyles: ['dream-pop'],
      },
      config
    );

    expect(result.lyrics).toBeDefined();
  });

  test('re-injects locked phrase after refinement', async () => {
    const config = createMockConfig();

    const result = await refinePrompt(
      {
        currentPrompt: 'A jazz song',
        currentTitle: 'Jazz Song',
        feedback: 'Add drums',
        lockedPhrase: 'my-special-phrase',
      },
      config
    );

    expect(result.text).toContain('my-special-phrase');
  });
});

describe('refinePrompt - edge cases', () => {
  test('handles empty feedback', async () => {
    const config = createMockConfig();

    const result = await refinePrompt(
      {
        currentPrompt: 'A jazz song',
        currentTitle: 'Jazz Song',
        feedback: '',
      },
      config
    );

    expect(result.text).toBeDefined();
  });

  test('preserves current lyrics when lyrics mode but no new lyrics returned', async () => {
    const config = createMockConfig({ isLyricsMode: () => true });

    const result = await refinePrompt(
      {
        currentPrompt: 'A ballad',
        currentTitle: 'Love Song',
        feedback: 'Just change the tempo',
        currentLyrics: '[VERSE]\nKeep these lyrics',
      },
      config
    );

    expect(result.lyrics).toBeDefined();
  });
});

describe('refinePrompt with local LLM (offline mode)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGenerateWithOllama.mockClear();
    mockGenerateText.mockClear();
    mockRemixStyleTags.mockClear();
  });

  test('uses deterministic refinement for style when local LLM is active (no lyrics mode)', async () => {
    const config = createMockConfig({
      isUseLocalLLM: () => true,
      isLyricsMode: () => false,
    });

    const result = await refinePrompt(
      {
        currentPrompt: 'A jazz song with smooth vibes',
        currentTitle: 'Jazz Song',
        feedback: 'Add more piano',
      },
      config
    );

    // Style should be refined deterministically
    expect(result.text).toBeDefined();
    expect(result.text).toContain('with remixed style tags');
    expect(result.lyrics).toBeUndefined();
    
    // Should NOT call Ollama for style refinement
    expect(mockGenerateWithOllama).not.toHaveBeenCalled();
    // Should NOT call cloud generateText either
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  test('uses deterministic style + LLM lyrics when local LLM + lyrics mode', async () => {
    const config = createMockConfig({
      isUseLocalLLM: () => true,
      isLyricsMode: () => true,
    });

    const result = await refinePrompt(
      {
        currentPrompt: 'A jazz song with smooth vibes',
        currentTitle: 'Jazz Song',
        feedback: 'Make the lyrics more emotional',
        currentLyrics: '[Verse 1]\nOriginal lyrics about love',
      },
      config
    );

    // Style should be deterministic, lyrics refined via LLM
    expect(result.text).toBeDefined();
    expect(result.text).toContain('with remixed style tags');
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain('Refined lyrics from Ollama');
    
    // Should call Ollama exactly once - for lyrics only
    expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
    // Should NOT call cloud generateText
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  test('uses deterministic style + cloud LLM lyrics for cloud providers', async () => {
    const config = createMockConfig({
      isUseLocalLLM: () => false,
      isLyricsMode: () => true,
    });

    const result = await refinePrompt(
      {
        currentPrompt: 'A rock ballad',
        currentTitle: 'Rock Ballad',
        feedback: 'Add more guitar',
        currentLyrics: '[Verse 1]\nOriginal rock lyrics',
      },
      config
    );

    // Cloud: uses deterministic style + cloud LLM for lyrics (unified architecture)
    expect(result.text).toBeDefined();
    expect(result.text).toContain('with remixed style tags'); // Deterministic style
    expect(result.title).toBe('Rock Ballad'); // Title preserved (not from LLM)
    expect(result.lyrics).toBeDefined();
    
    // Should call cloud generateText for lyrics only
    expect(mockGenerateText).toHaveBeenCalled();
    // Should NOT use Ollama client for cloud mode
    expect(mockGenerateWithOllama).not.toHaveBeenCalled();
  });

  test('bootstraps new lyrics when refinementType is lyrics but no currentLyrics exist', async () => {
    const config = createMockConfig({
      isUseLocalLLM: () => true,
      isLyricsMode: () => true,
    });

    // Act - no currentLyrics provided, should bootstrap instead of throw
    const result = await refinePrompt(
      {
        currentPrompt: 'genre: "jazz"\nmood: "smooth"',
        currentTitle: 'Jazz Vibes',
        feedback: 'make it more emotional',
        refinementType: 'lyrics',
        // No currentLyrics - should bootstrap new lyrics
      },
      config
    );

    // Assert - should return bootstrapped lyrics (prompt unchanged in lyrics-only mode)
    expect(result.text).toBe('genre: "jazz"\nmood: "smooth"');
    expect(result.title).toBe('Jazz Vibes');
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain('Refined lyrics from Ollama');
    
    // Should call Ollama for lyrics bootstrap
    expect(mockGenerateWithOllama).toHaveBeenCalled();
  });
});
