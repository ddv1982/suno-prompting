/**
 * Ollama Availability Module
 *
 * Provides on-demand availability detection for Ollama with 30-second caching.
 * Checks if Ollama is running and if the Gemma 3 4B model is installed.
 *
 * @module ai/ollama-availability
 */

import { APP_CONSTANTS } from '@shared/constants';
import { createLogger } from '@shared/logger';

const log = createLogger('OllamaAvailability');

/** Cached availability status */
interface CachedStatus {
  available: boolean;
  hasGemma: boolean;
  checkedAt: number;
}

/** Response from Ollama /api/tags endpoint */
interface OllamaTagsResponse {
  models?: Array<{ name: string }>;
}

/** Cache TTL in milliseconds */
const CACHE_TTL_MS = APP_CONSTANTS.OLLAMA.AVAILABILITY_CACHE_TTL_MS;

/** Timeout for availability check in milliseconds */
const AVAILABILITY_TIMEOUT_MS = APP_CONSTANTS.OLLAMA.AVAILABILITY_TIMEOUT_MS;

/** The model we're looking for */
const GEMMA_MODEL = 'gemma3:4b';

/** Cached status - module-level singleton */
let cachedStatus: CachedStatus | null = null;

/**
 * Check if Ollama is available and has the Gemma 3 4B model.
 * Results are cached for 30 seconds to avoid excessive network calls.
 *
 * @param endpoint - Ollama server endpoint (defaults to localhost:11434)
 * @returns Object with `available` and `hasGemma` boolean flags
 */
export async function checkOllamaAvailable(
  endpoint: string = APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT
): Promise<{ available: boolean; hasGemma: boolean }> {
  const now = Date.now();

  // Return cached result if still valid
  if (cachedStatus && now - cachedStatus.checkedAt < CACHE_TTL_MS) {
    log.info('checkOllamaAvailable:cached', {
      available: cachedStatus.available,
      hasGemma: cachedStatus.hasGemma,
    });
    return { available: cachedStatus.available, hasGemma: cachedStatus.hasGemma };
  }

  try {
    // Check if Ollama is running by querying the tags endpoint
    const tagsResponse = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
    });

    if (!tagsResponse.ok) {
      log.warn('checkOllamaAvailable:notOk', { status: tagsResponse.status });
      cachedStatus = { available: false, hasGemma: false, checkedAt: now };
      return { available: false, hasGemma: false };
    }

    // Check if Gemma 3 4B model is available
    const tags = (await tagsResponse.json()) as OllamaTagsResponse;
    const hasGemma =
      tags.models?.some(
        (m) => m.name === GEMMA_MODEL || m.name.startsWith(`${GEMMA_MODEL}:`)
      ) ?? false;

    cachedStatus = { available: true, hasGemma, checkedAt: now };
    log.info('checkOllamaAvailable:success', {
      hasGemma,
      modelCount: tags.models?.length ?? 0,
    });
    return { available: true, hasGemma };
  } catch (error: unknown) {
    log.warn('checkOllamaAvailable:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    cachedStatus = { available: false, hasGemma: false, checkedAt: now };
    return { available: false, hasGemma: false };
  }
}

/**
 * Invalidate the cached availability status.
 * Call this when Ollama settings change (e.g., endpoint URL).
 */
export function invalidateOllamaCache(): void {
  cachedStatus = null;
  log.info('invalidateOllamaCache:cleared');
}
