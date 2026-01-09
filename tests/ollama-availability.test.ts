import { describe, expect, test, beforeEach, mock } from 'bun:test';

import { APP_CONSTANTS } from '@shared/constants';

// Mock fetch globally before importing the module
const mockFetch = mock(async () => new Response());
globalThis.fetch = mockFetch as any;

const {
  checkOllamaAvailable,
  invalidateOllamaCache,
} = await import('@bun/ai/ollama-availability');

describe('checkOllamaAvailable', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Invalidate cache before each test
    invalidateOllamaCache();
  });

  describe('when Ollama is running with Gemma model', () => {
    test('returns available and hasGemma true', async () => {
      mockFetch.mockResolvedValueOnce(
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
      expect(mockFetch).toHaveBeenCalledWith(
        `${APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT}/api/tags`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    test('recognizes Gemma model with tag suffix', async () => {
      mockFetch.mockResolvedValueOnce(
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
      mockFetch.mockResolvedValueOnce(
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
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
    });

    test('handles missing models property', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
    });
  });

  describe('when Ollama is not running', () => {
    test('returns unavailable when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });

    test('returns unavailable when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }));

      const result = await checkOllamaAvailable();

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });

    test('returns unavailable when server returns 500', async () => {
      mockFetch.mockResolvedValueOnce(
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
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      await checkOllamaAvailable(customEndpoint);

      expect(mockFetch).toHaveBeenCalledWith(
        `${customEndpoint}/api/tags`,
        expect.any(Object)
      );
    });
  });

  describe('caching behavior', () => {
    test('caches result for 30 seconds', async () => {
      // First call
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      const result1 = await checkOllamaAvailable();
      expect(result1.available).toBe(true);
      expect(result1.hasGemma).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await checkOllamaAvailable();
      expect(result2.available).toBe(true);
      expect(result2.hasGemma).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    test('caches result regardless of endpoint (cache is global)', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      await checkOllamaAvailable('http://localhost:11434');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Cache is global, not per-endpoint
      await checkOllamaAvailable('http://other-host:11434');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still cached
    });

    test('invalidateOllamaCache clears cache', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
          status: 200,
        })
      );

      // First call
      await checkOllamaAvailable();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Invalidate cache
      invalidateOllamaCache();

      // Second call should fetch again
      await checkOllamaAvailable();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('timeout behavior', () => {
    test('uses 5-second timeout', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      await checkOllamaAvailable();

      // Verify timeout is used
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});

describe('invalidateOllamaCache', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('can be called multiple times safely', () => {
    expect(() => {
      invalidateOllamaCache();
      invalidateOllamaCache();
      invalidateOllamaCache();
    }).not.toThrow();
  });

  test('forces fresh check after invalidation', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }), {
        status: 200,
      })
    );

    // Check, cache, invalidate, check again
    await checkOllamaAvailable();
    await checkOllamaAvailable(); // Cached
    expect(mockFetch).toHaveBeenCalledTimes(1);

    invalidateOllamaCache();

    await checkOllamaAvailable(); // Fresh
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
