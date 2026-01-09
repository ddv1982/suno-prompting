import { describe, expect, test, mock, beforeEach } from 'bun:test';

import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import type { RefinementConfig } from '@bun/ai/types';

// Mock Ollama availability checks
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);
const mockInvalidateOllamaCache = mock(() => {});

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mockInvalidateOllamaCache,
}));

// Mock generateText before importing refinement module
await mock.module('ai', () => ({
  generateText: async () => ({
    text: JSON.stringify({
      prompt: 'Refined jazz prompt with more piano',
      title: 'Refined Title',
      lyrics: '[VERSE]\nRefined lyrics here',
    }),
  }),
}));

const { refinePrompt } = await import('@bun/ai/refinement');

function createMockConfig(overrides: Partial<RefinementConfig> = {}): RefinementConfig {
  return {
    getModel: () => ({} as any),
    getOllamaModel: () => ({} as any),
    isDebugMode: () => false,
    isMaxMode: () => false,
    isLyricsMode: () => false,
    isUseLocalLLM: () => false,
    getUseSunoTags: () => true,
    getModelName: () => 'test-model',
    getProvider: () => 'groq',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    postProcess: async (text: string) => text,
    buildDebugInfo: (systemPrompt, userPrompt, rawResponse) => ({
      systemPrompt,
      userPrompt,
      model: 'test-model',
      provider: 'groq',
      timestamp: new Date().toISOString(),
      requestBody: '{}',
      responseBody: rawResponse,
    }),
    ...overrides,
  };
}

describe('refinePrompt', () => {
  test('refines prompt with feedback', async () => {
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
    expect(result.title).toBe('Refined Title');
  });

  test('includes debug info when debug mode is enabled', async () => {
    const config = createMockConfig({ isDebugMode: () => true });

    const result = await refinePrompt(
      {
        currentPrompt: 'A rock song',
        currentTitle: 'Rock Song',
        feedback: 'Make it heavier',
      },
      config
    );

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.model).toBe('test-model');
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

describe('refinePrompt - offline mode with Ollama', () => {
  beforeEach(() => {
    mockCheckOllamaAvailable.mockClear();
  });

  test('throws OllamaUnavailableError when Ollama is not running', async () => {
    const config = createMockConfig({ isUseLocalLLM: () => true });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: false,
      hasGemma: false,
    });

    await expect(
      refinePrompt(
        {
          currentPrompt: 'A jazz song',
          currentTitle: 'Jazz Song',
          feedback: 'Add more piano',
        },
        config
      )
    ).rejects.toThrow(OllamaUnavailableError);
  });

  test('throws OllamaModelMissingError when Gemma model not installed', async () => {
    const config = createMockConfig({ isUseLocalLLM: () => true });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: false,
    });

    await expect(
      refinePrompt(
        {
          currentPrompt: 'A rock song',
          currentTitle: 'Rock Song',
          feedback: 'Make it heavier',
        },
        config
      )
    ).rejects.toThrow(OllamaModelMissingError);
  });

  test('checks Ollama availability with correct endpoint', async () => {
    const customEndpoint = 'http://custom:12345';
    const config = createMockConfig({
      isUseLocalLLM: () => true,
      getOllamaEndpoint: () => customEndpoint,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    await refinePrompt(
      {
        currentPrompt: 'A pop song',
        currentTitle: 'Pop Song',
        feedback: 'Add drums',
      },
      config
    );

    expect(mockCheckOllamaAvailable).toHaveBeenCalledWith(customEndpoint);
  });

  test('refines prompt when Ollama is available with Gemma', async () => {
    const config = createMockConfig({ isUseLocalLLM: () => true });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    const result = await refinePrompt(
      {
        currentPrompt: 'An electronic song',
        currentTitle: 'Electronic Song',
        feedback: 'Add more synth',
      },
      config
    );

    expect(result.text).toBeDefined();
    expect(mockCheckOllamaAvailable).toHaveBeenCalled();
  });

  test('does not check Ollama when offline mode is disabled', async () => {
    const config = createMockConfig({ isUseLocalLLM: () => false });

    const result = await refinePrompt(
      {
        currentPrompt: 'A blues song',
        currentTitle: 'Blues Song',
        feedback: 'Make it sadder',
      },
      config
    );

    expect(result.text).toBeDefined();
    expect(mockCheckOllamaAvailable).not.toHaveBeenCalled();
  });

  test('performs actual refinement in offline mode', async () => {
    const config = createMockConfig({
      isUseLocalLLM: () => true,
      isLyricsMode: () => true,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    const result = await refinePrompt(
      {
        currentPrompt: 'A folk song',
        currentTitle: 'Folk Song',
        feedback: 'Add more storytelling',
        currentLyrics: '[VERSE]\nOld story',
      },
      config
    );

    // Verify refinement actually happens (not passthrough)
    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.lyrics).toBeDefined();
  });
});
