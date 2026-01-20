/**
 * Direct Mode Generation for Full Prompt
 *
 * Handles Direct Mode path (Suno V5 styles selected) for full prompt generation.
 * Styles are preserved as-is, prompt is enriched with instruments, moods, production.
 *
 * @module ai/generation/direct-mode-generation
 */

import { generateLyrics } from '@bun/ai/content-generator';
import { buildDirectModePromptWithRuntime } from '@bun/ai/direct-mode';
import { generateDirectModeTitle } from '@bun/ai/llm-utils';
import { cleanLyrics } from '@bun/ai/utils';
import { generateDeterministicTitle } from '@bun/prompt/title';
import { ValidationError } from '@shared/errors';

import type { GenerateInitialOptions } from './types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

interface TraceRuntime {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
}

/**
 * Generate prompt in Direct Mode (Suno V5 styles selected).
 *
 * Bypasses deterministic genre logic - uses selected styles as-is
 * while enriching the prompt with instruments, moods, and production.
 *
 * @param options - Generation options including sunoStyles
 * @param config - Generation configuration
 * @returns Generated result with prompt, title, and optional lyrics
 */
export async function generateDirectMode(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, description, lyricsTopic } = options;

  if (!sunoStyles || sunoStyles.length === 0) {
    throw new ValidationError('generateDirectMode requires non-empty sunoStyles');
  }

  // Use centralized prompt building
  const { text, enriched } = buildDirectModePromptWithRuntime(sunoStyles, config.isMaxMode(), {
    trace: runtime?.trace,
    rng: runtime?.rng,
  });

  // Extract genre/mood for title generation
  const genre = enriched.extractedGenres[0] || 'pop';
  const mood = enriched.enrichment.moods[0] || 'energetic';

  // Generate title and lyrics based on lyrics mode and LLM availability
  let title: string;
  let lyrics: string | undefined;

  if (config.isLyricsMode()) {
    // Lyrics mode: generate both title and lyrics via LLM
    const result = await generateDirectModeTitleAndLyrics(description, lyricsTopic, sunoStyles, genre, mood, config, runtime);
    title = result.title;
    lyrics = result.lyrics;
  } else if (config.isLLMAvailable()) {
    // No lyrics but LLM available: generate title via LLM
    title = await generateDirectModeTitle(description || '', sunoStyles, config.getModel, config.getOllamaEndpointIfLocal(), {
      trace: runtime?.trace,
      traceLabel: 'title.generate',
    });
    lyrics = undefined;
  } else {
    // No lyrics and no LLM: use deterministic title
    title = generateDeterministicTitle(genre, mood, runtime?.rng ?? Math.random, description);
    lyrics = undefined;
  }

  return { text, title, lyrics, debugTrace: undefined };
}

/** Generates title and lyrics via LLM for direct mode */
async function generateDirectModeTitleAndLyrics(
  description: string | undefined,
  lyricsTopic: string | undefined,
  sunoStyles: string[],
  genre: string,
  mood: string,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<{ title: string; lyrics: string }> {
  const ollamaEndpoint = config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined;

  // Parallel execution for performance; both must succeed for valid result
  const topic = lyricsTopic?.trim() || description || '';
  const [title, lyricsResult] = await Promise.all([
    generateDirectModeTitle(description || '', sunoStyles, config.getModel, ollamaEndpoint, {
      trace: runtime?.trace,
      traceLabel: 'title.generate',
    }),
    generateLyrics(topic, genre, mood, config.isMaxMode(), config.getModel, config.getUseSunoTags(), undefined, ollamaEndpoint, {
      trace: runtime?.trace,
      traceLabel: 'lyrics.generate',
    }),
  ]);

  return { title, lyrics: cleanLyrics(lyricsResult.lyrics) ?? '' };
}
