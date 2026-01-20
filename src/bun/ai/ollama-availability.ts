/**
 * Ollama Availability Module
 *
 * Provides on-demand availability detection for Ollama with 30-second caching.
 * Checks if Ollama is running and if the Gemma 3 4B model is installed.
 *
 * Uses node:http instead of fetch to bypass Bun's fetch bug (#6932) where
 * response bodies are empty when Content-Length header is missing.
 *
 * @module ai/ollama-availability
 */

import * as http from 'node:http';

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
  models?: { name: string }[];
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
 * Make an HTTP GET request to Ollama's /api/tags endpoint using node:http.
 * This avoids Bun's fetch bug where response bodies are empty.
 */
async function ollamaTagsRequest(
  endpoint: string,
  timeoutMs: number
): Promise<OllamaTagsResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const port = url.port ? parseInt(url.port, 10) : 11434;

    const req = http.request(
      {
        hostname: url.hostname,
        port,
        path: '/api/tags',
        method: 'GET',
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer | string) => {
          data += String(chunk);
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Ollama returned status ${String(res.statusCode)}`));
          } else {
            try {
              resolve(JSON.parse(data) as OllamaTagsResponse);
            } catch {
              reject(new Error('Invalid JSON response from Ollama'));
            }
          }
        });
      }
    );

    req.on('error', (error: Error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama availability check timed out'));
    });

    req.end();
  });
}

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
    const tags = await ollamaTagsRequest(endpoint, AVAILABILITY_TIMEOUT_MS);

    // Check if Gemma 3 4B model is available
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
