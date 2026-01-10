import { describe, expect, test, mock } from 'bun:test';

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


