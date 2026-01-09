import { describe, expect, test, beforeEach, mock } from 'bun:test';

import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import type { LanguageModel } from 'ai';

// Mock Ollama availability checks
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);
const mockInvalidateOllamaCache = mock(() => {});

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mockInvalidateOllamaCache,
}));

// Mock content generator functions
const mockGenerateTitle = mock(() =>
  Promise.resolve({ title: 'Generated Title', debugInfo: undefined })
);
const mockGenerateLyrics = mock(() =>
  Promise.resolve({ lyrics: '[VERSE]\nGenerated lyrics', debugInfo: undefined })
);

await mock.module('@bun/ai/content-generator', () => ({
  generateTitle: mockGenerateTitle,
  generateLyrics: mockGenerateLyrics,
  detectGenreFromTopic: mock(() => Promise.resolve({ genre: 'pop', debugInfo: undefined })),
}));

// Import after mocking
const { remixTitle, remixLyrics } = await import('@bun/ai/remix');

const mockModel = {} as LanguageModel;
const mockGetModel = () => mockModel;

describe('remixTitle', () => {
  beforeEach(() => {
    mockGenerateTitle.mockClear();
  });

  test('generates new title using AI', async () => {
    const result = await remixTitle(
      'genre: "jazz"\nmood: "smooth"',
      'A smooth jazz song',
      mockGetModel
    );

    expect(result.title).toBe('Generated Title');
    expect(mockGenerateTitle).toHaveBeenCalled();
  });

  test('extracts genre and mood from prompt', async () => {
    await remixTitle(
      'genre: "rock"\nmood: "energetic, powerful"',
      'An energetic rock song',
      mockGetModel
    );

    expect(mockGenerateTitle).toHaveBeenCalledWith(
      'An energetic rock song',
      'rock',
      expect.any(String),
      mockGetModel
    );
  });
});

describe('remixLyrics - cloud mode', () => {
  beforeEach(() => {
    mockGenerateLyrics.mockClear();
    mockCheckOllamaAvailable.mockClear();
  });

  test('generates new lyrics using AI', async () => {
    const result = await remixLyrics(
      'genre: "pop"\nmood: "happy"',
      'A happy pop song',
      undefined,
      false,
      mockGetModel
    );

    expect(result.lyrics).toBe('[VERSE]\nGenerated lyrics');
    expect(mockGenerateLyrics).toHaveBeenCalled();
  });

  test('uses lyrics topic when provided', async () => {
    await remixLyrics(
      'genre: "folk"\nmood: "nostalgic"',
      'A folk song',
      'A story about home',
      false,
      mockGetModel
    );

    expect(mockGenerateLyrics).toHaveBeenCalledWith(
      'A story about home',
      'folk',
      'nostalgic',
      false,
      mockGetModel,
      false,
      90000 // Default AI timeout
    );
  });

  test('passes maxMode flag correctly', async () => {
    await remixLyrics(
      'genre: "electronic"\nmood: "energetic"',
      'An electronic song',
      undefined,
      true, // maxMode
      mockGetModel,
      true
    );

    expect(mockGenerateLyrics).toHaveBeenCalledWith(
      'An electronic song',
      'electronic',
      'energetic',
      true, // maxMode
      mockGetModel,
      true, // useSunoTags
      90000 // Default AI timeout
    );
  });

  test('does not check Ollama in cloud mode', async () => {
    await remixLyrics(
      'genre: "jazz"\nmood: "smooth"',
      'A jazz song',
      undefined,
      false,
      mockGetModel,
      false,
      false // isOffline = false
    );

    expect(mockCheckOllamaAvailable).not.toHaveBeenCalled();
  });
});

describe('remixLyrics - offline mode with Ollama', () => {
  beforeEach(() => {
    mockGenerateLyrics.mockClear();
    mockCheckOllamaAvailable.mockClear();
  });

  test('throws OllamaUnavailableError when Ollama is not running', async () => {
    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: false,
      hasGemma: false,
    });

    await expect(
      remixLyrics(
        'genre: "rock"\nmood: "powerful"',
        'A rock song',
        undefined,
        false,
        mockGetModel,
        false,
        true, // isOffline
        'http://127.0.0.1:11434'
      )
    ).rejects.toThrow(OllamaUnavailableError);
  });

  test('throws OllamaModelMissingError when Gemma model not installed', async () => {
    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: false,
    });

    await expect(
      remixLyrics(
        'genre: "pop"\nmood: "upbeat"',
        'A pop song',
        undefined,
        false,
        mockGetModel,
        false,
        true,
        'http://127.0.0.1:11434'
      )
    ).rejects.toThrow(OllamaModelMissingError);
  });

  test('checks Ollama availability with correct endpoint', async () => {
    const customEndpoint = 'http://custom:12345';

    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    await remixLyrics(
      'genre: "electronic"\nmood: "energetic"',
      'An electronic song',
      undefined,
      false,
      mockGetModel,
      false,
      true,
      customEndpoint
    );

    expect(mockCheckOllamaAvailable).toHaveBeenCalledWith(customEndpoint);
  });

  test('generates lyrics when Ollama is available with Gemma', async () => {
    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    const result = await remixLyrics(
      'genre: "folk"\nmood: "nostalgic"',
      'A folk song',
      'A story about wandering',
      false,
      mockGetModel,
      false,
      true,
      'http://127.0.0.1:11434'
    );

    expect(result.lyrics).toBe('[VERSE]\nGenerated lyrics');
    expect(mockCheckOllamaAvailable).toHaveBeenCalled();
    expect(mockGenerateLyrics).toHaveBeenCalled();
  });

  test('uses lyrics topic in offline mode', async () => {
    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    await remixLyrics(
      'genre: "blues"\nmood: "melancholic"',
      'A blues song',
      'Lost love and regret',
      false,
      mockGetModel,
      true,
      true,
      'http://127.0.0.1:11434'
    );

    expect(mockGenerateLyrics).toHaveBeenCalledWith(
      'Lost love and regret',
      'blues',
      'melancholic',
      false,
      mockGetModel,
      true,
      30000 // Ollama timeout
    );
  });

  test('supports max mode in offline mode', async () => {
    mockCheckOllamaAvailable.mockResolvedValueOnce({
      available: true,
      hasGemma: true,
    });

    await remixLyrics(
      'genre: "rock"\nmood: "aggressive"',
      'A rock song',
      undefined,
      true, // maxMode
      mockGetModel,
      true,
      true,
      'http://127.0.0.1:11434'
    );

    expect(mockGenerateLyrics).toHaveBeenCalledWith(
      'A rock song',
      'rock',
      'aggressive',
      true, // maxMode
      mockGetModel,
      true,
      30000 // Ollama timeout
    );
  });
});
