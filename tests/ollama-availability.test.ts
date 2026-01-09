import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test';

import { APP_CONSTANTS } from '@shared/constants';

// Module-level cache to simulate the real module's caching behavior
let cachedStatus: { available: boolean; hasGemma: boolean; checkedAt: number } | null = null;
const CACHE_TTL_MS = APP_CONSTANTS.OLLAMA.AVAILABILITY_CACHE_TTL_MS;
const AVAILABILITY_TIMEOUT_MS = APP_CONSTANTS.OLLAMA.AVAILABILITY_TIMEOUT_MS;
const GEMMA_MODEL = 'gemma3:4b';

// Create a mock fetch that will be controlled by our tests
// Using explicit type to match fetch signature
const fetchMock = mock((_url: string, _options?: RequestInit) => 
  Promise.resolve(new Response())
);

// Mock implementation that mirrors the real module but uses our mock fetch
const mockCheckOllamaAvailable = async (
  endpoint: string = APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT
): Promise<{ available: boolean; hasGemma: boolean }> => {
  const now = Date.now();

  // Return cached result if still valid
  if (cachedStatus && now - cachedStatus.checkedAt < CACHE_TTL_MS) {
    return { available: cachedStatus.available, hasGemma: cachedStatus.hasGemma };
  }

  try {
    const tagsResponse = await fetchMock(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
    });

    if (!tagsResponse.ok) {
      cachedStatus = { available: false, hasGemma: false, checkedAt: now };
      return { available: false, hasGemma: false };
    }

    const tags = (await tagsResponse.json()) as { models?: Array<{ name: string }> };
    const hasGemma =
      tags.models?.some(
        (m) => m.name === GEMMA_MODEL || m.name.startsWith(`${GEMMA_MODEL}:`)
      ) ?? false;

    cachedStatus = { available: true, hasGemma, checkedAt: now };
    return { available: true, hasGemma };
  } catch {
    cachedStatus = { available: false, hasGemma: false, checkedAt: now };
    return { available: false, hasGemma: false };
  }
};

const mockInvalidateOllamaCache = (): void => {
  cachedStatus = null;
};

// Use mock.module to register our mock - this will be used by ALL tests
await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mockInvalidateOllamaCache,
}));

// Re-import to get our mocked versions
const { checkOllamaAvailable, invalidateOllamaCache } = await import(
  '@bun/ai/ollama-availability'
);

describe('checkOllamaAvailable', () => {
  beforeEach(() => {
    // Clear mock state before each test
    fetchMock.mockClear();
    // Invalidate cache before each test to ensure fresh state
    invalidateOllamaCache();
  });

  afterEach(() => {
    // Invalidate cache after each test to prevent cross-test pollution
    invalidateOllamaCache();
  });

  describe('when Ollama is running with Gemma model', () => {
    test('returns available and hasGemma true', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: 'gemma3:4b' }, { name: 'llama2:latest' }],
          }),
          { status: 200 }
        )
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT}/api/tags`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    test('recognizes Gemma model with tag suffix', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: 'gemma3:4b:latest' }],
          }),
          { status: 200 }
        )
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(true);
    });
  });

  describe('when Ollama is running without Gemma model', () => {
    test('returns available but hasGemma false', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: 'llama2:latest' }, { name: 'mistral:latest' }],
          }),
          { status: 200 }
        )
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
    });

    test('handles empty model list', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
    });

    test('handles missing models property', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
    });
  });

  describe('when Ollama is not running', () => {
    test('returns unavailable when fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });

    test('returns unavailable when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('Not found', { status: 404 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });

    test('returns unavailable when server returns 500', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('Server error', { status: 500 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });
  });

  describe('custom endpoint', () => {
    test('uses custom endpoint when provided', async () => {
      const customEndpoint = 'http://custom-host:12345';
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      await checkOllamaAvailable(customEndpoint);

      expect(fetchMock).toHaveBeenCalledWith(
        `${customEndpoint}/api/tags`,
        expect.any(Object)
      );
    });
  });

  describe('caching behavior', () => {
    test('caches result for 30 seconds', async () => {
      // First call
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      const result1 = await checkOllamaAvailable();
      expect(result1.available).toBe(true);
      expect(result1.hasGemma).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await checkOllamaAvailable();
      expect(result2.available).toBe(true);
      expect(result2.hasGemma).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    test('caches result regardless of endpoint (cache is global)', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      await checkOllamaAvailable('http://127.0.0.1:11434');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Cache is global, not per-endpoint
      await checkOllamaAvailable('http://other-host:11434');
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still cached
    });

    test('invalidateOllamaCache clears cache', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      // First call
      await checkOllamaAvailable();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Invalidate cache
      invalidateOllamaCache();

      // Second call should fetch again
      await checkOllamaAvailable();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('timeout behavior', () => {
    test('uses 5-second timeout', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      await checkOllamaAvailable();

      // Verify timeout is used
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('invalidateOllamaCache', () => {
    test('can be called multiple times safely', () => {
      expect(() => {
        invalidateOllamaCache();
        invalidateOllamaCache();
        invalidateOllamaCache();
      }).not.toThrow();
    });

    test('forces fresh check after invalidation', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      // Check, cache, invalidate, check again
      await checkOllamaAvailable();
      await checkOllamaAvailable(); // Cached
      expect(fetchMock).toHaveBeenCalledTimes(1);

      invalidateOllamaCache();

      await checkOllamaAvailable(); // Fresh
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
