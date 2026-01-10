import { describe, expect, test, mock, beforeEach } from 'bun:test';

import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import type { GenerationConfig } from '@bun/ai/types';

// Mock Ollama availability checks
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);
const mockInvalidateOllamaCache = mock(() => {});

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mockInvalidateOllamaCache,
}));

// Mock Ollama client for local LLM calls
const mockGenerateWithOllama = mock(() => Promise.resolve('Generated text from Ollama'));

await mock.module('@bun/ai/ollama-client', () => ({
  generateWithOllama: mockGenerateWithOllama,
}));

// Import after mocking
const { generateInitial } = await import('@bun/ai/generation');

function createMockConfig(overrides: Partial<GenerationConfig> = {}): GenerationConfig {
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
    ...overrides,
  };
}

describe('generateInitial - deterministic path', () => {
  test('generates prompt without LLM when lyrics mode is OFF', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: 'A jazz song with piano' },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.title).toBeDefined();
    expect(result.lyrics).toBeUndefined();
  });

  test('includes debug info when debug mode is enabled', async () => {
    const config = createMockConfig({
      isLyricsMode: () => false,
      isDebugMode: () => true,
    });

    const result = await generateInitial(
      { description: 'A rock song' },
      config
    );

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.systemPrompt).toContain('deterministic');
    expect(result.debugInfo?.model).toBe('test-model');
    expect(result.debugInfo?.provider).toBe('groq');
  });

  test('respects genre override', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: 'A song', genreOverride: 'jazz' },
      config
    );

    expect(result.text.toLowerCase()).toContain('jazz');
  });

  test('injects locked phrase when provided', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: 'A pop song', lockedPhrase: 'test-phrase-123' },
      config
    );

    expect(result.text).toContain('test-phrase-123');
  });

  test('generates max mode prompt when max mode is enabled', async () => {
    const config = createMockConfig({
      isLyricsMode: () => false,
      isMaxMode: () => true,
    });

    const result = await generateInitial(
      { description: 'An electronic song' },
      config
    );

    expect(result.text).toContain('MAX_MODE');
  });

  test('generates standard mode prompt when max mode is disabled', async () => {
    const config = createMockConfig({
      isLyricsMode: () => false,
      isMaxMode: () => false,
    });

    const result = await generateInitial(
      { description: 'A blues song' },
      config
    );

    expect(result.text).not.toContain('MAX_MODE');
  });

  test('generates deterministic title from genre and mood', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: 'A melancholic jazz song' },
      config
    );

    expect(result.title).toBeDefined();
    expect(result.title?.length).toBeGreaterThan(0);
    expect(result.title).not.toBe('Untitled');
  });
});

describe('generateInitial - edge cases', () => {
  test('handles empty description', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: '' },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
  });

  test('handles very long description', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });
    const longDescription = 'jazz '.repeat(200);

    const result = await generateInitial(
      { description: longDescription },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeLessThanOrEqual(1000);
  });

  test('handles special characters in description', async () => {
    const config = createMockConfig({ isLyricsMode: () => false });

    const result = await generateInitial(
      { description: 'A song with "quotes" and \'apostrophes\' and emoji 🎵' },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
  });
});

describe('generateInitial - offline mode with Ollama', () => {
  beforeEach(() => {
    mockCheckOllamaAvailable.mockClear();
    mockGenerateWithOllama.mockClear();
  });

  test('throws OllamaUnavailableError when Ollama is not running', async () => {
    const config = createMockConfig({
      isLyricsMode: () => true,
      isUseLocalLLM: () => true,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: false,
      hasGemma: false,
    });

    await expect(
      generateInitial({ description: 'A jazz song' }, config)
    ).rejects.toThrow(OllamaUnavailableError);
  });

  test('throws OllamaModelMissingError when Gemma model not installed', async () => {
    const config = createMockConfig({
      isLyricsMode: () => true,
      isUseLocalLLM: () => true,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: false,
    });

    await expect(
      generateInitial({ description: 'A rock song' }, config)
    ).rejects.toThrow(OllamaModelMissingError);
  });

  test('checks Ollama availability with correct endpoint', async () => {
    const customEndpoint = 'http://custom:12345';
    const config = createMockConfig({
      isLyricsMode: () => true,
      isUseLocalLLM: () => true,
      getOllamaEndpoint: () => customEndpoint,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    await generateInitial({ description: 'A pop song' }, config);

    expect(mockCheckOllamaAvailable).toHaveBeenCalledWith(customEndpoint);
  });

  test('generates prompt when Ollama is available with Gemma', async () => {
    const config = createMockConfig({
      isLyricsMode: () => true,
      isUseLocalLLM: () => true,
    });

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    const result = await generateInitial(
      { description: 'An electronic song' },
      config
    );

    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
    expect(mockCheckOllamaAvailable).toHaveBeenCalled();
  });

  test('does not check Ollama when offline mode is disabled', async () => {
    const config = createMockConfig({
      isLyricsMode: () => true,
      isUseLocalLLM: () => false,
    });

    const result = await generateInitial(
      { description: 'A blues song' },
      config
    );

    expect(result.text).toBeDefined();
    expect(mockCheckOllamaAvailable).not.toHaveBeenCalled();
  });

  test('does not check Ollama when lyrics mode is disabled', async () => {
    const config = createMockConfig({
      isLyricsMode: () => false,
      isUseLocalLLM: () => true,
    });

    const result = await generateInitial(
      { description: 'A country song' },
      config
    );

    expect(result.text).toBeDefined();
    expect(mockCheckOllamaAvailable).not.toHaveBeenCalled();
  });
});
