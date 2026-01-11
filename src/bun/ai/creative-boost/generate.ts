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
  buildCreativeBoostDebugInfo,
} from '@bun/ai/creative-boost/helpers';
import { isDirectMode, generateDirectModeWithLyrics } from '@bun/ai/direct-mode';
import { createLogger } from '@bun/logger';
import { selectGenreForLevel, mapSliderToLevel, selectMoodForLevel } from '@bun/prompt/creative-boost-templates';


import type { GenerateCreativeBoostOptions, CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { GenerationResult } from '@bun/ai/types';

const log = createLogger('CreativeBoostGenerate');

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
  config: CreativeBoostEngineConfig
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
          ollamaEndpoint
        ),
    },
    config
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
  options: GenerateCreativeBoostOptions
): Promise<GenerationResult> {
  const { creativityLevel, seedGenres, sunoStyles, description, lyricsTopic, withWordlessVocals, maxMode, withLyrics, config } = options;

  // Direct Mode: styles preserved as-is, prompt enriched
  if (isDirectMode(sunoStyles)) {
    return generateDirectMode(sunoStyles, lyricsTopic, description, withLyrics, maxMode, config);
  }

  log.info('generateCreativeBoost:deterministic', { creativityLevel, seedGenres, maxMode, withWordlessVocals, withLyrics });

  const ollamaEndpoint = config.getOllamaEndpoint?.();

  // 1. Resolve genre (detect from lyrics topic if needed)
  const { genres: resolvedGenres, debugInfo: genreDebugInfo } = await resolveGenreForCreativeBoost(
    seedGenres, lyricsTopic, withLyrics, config.getModel, ollamaEndpoint
  );

  // 2. Select genre and mood based on creativity level
  const level = mapSliderToLevel(creativityLevel);
  const selectedGenre = selectGenreForLevel(level, resolvedGenres, Math.random);
  const selectedMood = selectMoodForLevel(level, Math.random);

  // 3. Build style prompt
  const styleResult = buildCreativeBoostStyle(selectedGenre, maxMode, withWordlessVocals);

  // 4. Generate title
  const { title, debugInfo: titleDebugInfo } = await generateCreativeBoostTitle(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, config.getModel, ollamaEndpoint
  );

  // 5. Generate lyrics if requested
  const { lyrics, debugInfo: lyricsDebugInfo } = await generateCreativeBoostLyrics(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, maxMode, config.getModel, config.getUseSunoTags?.() ?? false, ollamaEndpoint
  );

  // 6. Build debug info
  const debugInfo = buildCreativeBoostDebugInfo(
    config,
    { withLyrics, level, genre: selectedGenre, mood: selectedMood, topic: lyricsTopic?.trim() || '(none)' },
    styleResult,
    { genreDetection: genreDebugInfo, titleGeneration: titleDebugInfo, lyricsGeneration: lyricsDebugInfo }
  );

  return { text: styleResult, title, lyrics, debugInfo };
}
