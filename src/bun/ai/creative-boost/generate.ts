/**
 * Generation logic for Creative Boost Engine
 *
 * Contains functions for generating creative boost prompts,
 * including direct mode and deterministic generation paths.
 *
 * @module ai/creative-boost/generate
 */

import {
  generateLyricsForCreativeBoost,
  resolveGenreForCreativeBoost,
  buildCreativeBoostStyle,
  generateCreativeBoostTitle,
  generateCreativeBoostLyrics,
} from '@bun/ai/creative-boost/helpers';
import { isDirectMode, generateDirectModeWithLyrics } from '@bun/ai/direct-mode';
import { createLogger } from '@bun/logger';
import { selectGenreForLevel, mapSliderToLevel, selectMoodForLevel } from '@bun/prompt/creative-boost';
import { ValidationError } from '@shared/errors';


import type { GenerateCreativeBoostOptions, CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('CreativeBoostGenerate');

type TraceRuntime = {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
};

/**
 * Direct Mode generation - Suno V5 styles preserved as-is, prompt enriched
 * Styles are preserved exactly, but instruments, moods, production are added
 */
export async function generateDirectMode(
  sunoStyles: string[],
  lyricsTopic: string,
  description: string,
  withLyrics: boolean,
  maxMode: boolean,
  config: CreativeBoostEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  log.info('generateDirectMode:start', { stylesCount: sunoStyles.length, withLyrics, maxMode });

  const ollamaEndpoint = config.getOllamaEndpoint?.();

  const result = await generateDirectModeWithLyrics(
    {
      sunoStyles,
      description,
      lyricsTopic,
      maxMode,
      withLyrics,
      generateLyrics: (styleResult, topic, desc) =>
        generateLyricsForCreativeBoost(
          styleResult,
          topic,
          desc,
          false,
          true,
          config.getModel,
          config.getUseSunoTags?.() ?? false,
          ollamaEndpoint,
          runtime
        ),
    },
    config,
    runtime
  );

  log.info('generateDirectMode:complete', {
    styleLength: result.text.length,
    hasLyrics: !!result.lyrics,
  });

  return result;
}

/**
 * Generates a creative boost prompt based on creativity level and configuration.
 *
 * Uses deterministic generation for style prompts, with optional LLM-based
 * lyrics and title generation when lyrics mode is enabled.
 */
export async function generateCreativeBoost(
  options: GenerateCreativeBoostOptions,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { creativityLevel, seedGenres, sunoStyles, description, lyricsTopic, withWordlessVocals, maxMode, withLyrics, config } = options;
  const rng = runtime?.rng ?? Math.random;

  // Validate input (styles limit + mutual exclusivity)
  if (sunoStyles.length > 4) {
    throw new ValidationError('Maximum 4 Suno V5 styles allowed', 'sunoStyles');
  }
  if (seedGenres.length > 0 && sunoStyles.length > 0) {
    throw new ValidationError('Cannot use both Seed Genres and Suno V5 Styles. Please choose one approach.', 'seedGenres');
  }

  // Direct Mode: styles preserved as-is, prompt enriched
  if (isDirectMode(sunoStyles)) {
    return generateDirectMode(sunoStyles, lyricsTopic, description, withLyrics, maxMode, config, runtime);
  }

  log.info('generateCreativeBoost:deterministic', { creativityLevel, seedGenres, maxMode, withWordlessVocals, withLyrics });

  const ollamaEndpoint = config.getOllamaEndpoint?.();

  // 1. Resolve genre (detect from lyrics topic if needed)
  const { genres: resolvedGenres } = await resolveGenreForCreativeBoost(
    seedGenres, lyricsTopic, withLyrics, config.getModel, ollamaEndpoint, runtime
  );

  // 2. Select genre and mood based on creativity level
  const level = mapSliderToLevel(creativityLevel);
  const selectedGenre = selectGenreForLevel(level, resolvedGenres, rng);
  const selectedMood = selectMoodForLevel(level, rng);

  // 3. Build style prompt
  const styleResult = buildCreativeBoostStyle(selectedGenre, maxMode, withWordlessVocals, runtime);

  // 4. Generate title (use LLM when available for more creative titles)
  const { title } = await generateCreativeBoostTitle(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, config.getModel, ollamaEndpoint, runtime, config.isLLMAvailable?.()
  );

  // 5. Generate lyrics if requested
  const { lyrics } = await generateCreativeBoostLyrics(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, maxMode, config.getModel, config.getUseSunoTags?.() ?? false, ollamaEndpoint, runtime
  );

  return { text: styleResult, title, lyrics, debugTrace: undefined };
}
