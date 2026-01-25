/**
 * Generation Path: Offline Lyrics (Ollama)
 *
 * Offline generation path using Ollama local LLM.
 * Pre-flight checks Ollama availability before delegating to the
 * standard LLM-assisted generation with the Ollama model.
 *
 * @module ai/generation/paths/offline-lyrics
 */

import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { createLogger } from '@bun/logger';
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import { generateWithLyrics } from './with-lyrics';

import type { GenerateInitialOptions, TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';

const log = createLogger('Generation');

/**
 * Offline generation path using Ollama local LLM.
 *
 * Pre-flight checks Ollama availability before delegating to the
 * standard LLM-assisted generation with the Ollama model.
 *
 * @throws {OllamaUnavailableError} When Ollama server is not running
 * @throws {OllamaModelMissingError} When Gemma 3 4B model is not installed
 */
export async function generateWithOfflineLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  // Pre-flight check: Verify Ollama is available
  const endpoint = config.getOllamaEndpoint();
  const status = await checkOllamaAvailable(endpoint);

  if (!status.available) {
    throw new OllamaUnavailableError(endpoint);
  }

  if (!status.hasGemma) {
    throw new OllamaModelMissingError('gemma3:4b');
  }

  log.info('generateWithOfflineLyrics:start', { endpoint });

  // Delegate to standard generation with offline flag
  return generateWithLyrics(options, config, true, runtime);
}
