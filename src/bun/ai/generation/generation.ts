/**
 * Initial Prompt Generation Module
 *
 * Router that directs generation requests to the appropriate path:
 * - Direct Mode (sunoStyles provided): Uses Suno V5 styles as-is with enrichment
 * - Lyrics OFF: Hybrid path - deterministic prompt, LLM for thematic context & title (when available)
 * - Lyrics ON + Offline: Hybrid path - deterministic prompt, Ollama for thematic context, genre, title & lyrics
 * - Lyrics ON + Cloud: Hybrid path - deterministic prompt, cloud LLM for thematic context, genre, title & lyrics
 *
 * @module ai/generation/generation
 */

import { generateDirectMode } from './direct-mode-generation';
import {
  generateWithoutLyrics,
  generateWithLyrics,
  generateWithOfflineLyrics,
} from './paths';

import type { GenerateInitialOptions, TraceRuntime } from './types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';

/**
 * Generate initial prompt.
 *
 * Routes to the appropriate generation path based on configuration:
 * - Direct Mode (sunoStyles provided): Uses Suno V5 styles as-is with enrichment
 * - Lyrics OFF: Hybrid path (deterministic prompt + optional LLM for thematic context & title)
 * - Lyrics ON + Offline: Hybrid path (deterministic prompt + Ollama for context, genre, title, lyrics)
 * - Lyrics ON + Cloud: Hybrid path (deterministic prompt + cloud LLM for context, genre, title, lyrics)
 *
 * @param options - Options for generating initial prompt
 * @param config - Configuration with dependencies
 * @param runtime - Optional trace runtime
 * @returns Generated prompt, title, and optionally lyrics
 */
export async function generateInitial(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  // Direct Mode: Use sunoStyles as-is (bypasses deterministic genre logic)
  if (options.sunoStyles && options.sunoStyles.length > 0) {
    return generateDirectMode(options, config, runtime);
  }

  // Lyrics OFF: Hybrid LLM + deterministic path
  if (!config.isLyricsMode()) {
    return generateWithoutLyrics(options, config, runtime);
  }

  // Lyrics ON + Offline: Use Ollama local LLM
  if (config.isUseLocalLLM()) {
    return generateWithOfflineLyrics(options, config, runtime);
  }

  // Lyrics ON + Cloud: Use cloud LLM
  return generateWithLyrics(options, config, false, runtime);
}

// Re-export types for convenience
export type { GenerateInitialOptions } from './types';
