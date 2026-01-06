/**
 * Generation logic for Creative Boost Engine
 *
 * Contains functions for generating creative boost prompts,
 * including direct mode and deterministic generation paths.
 *
 * @module ai/creative-boost/generate
 */

import { isDirectMode, generateDirectModeWithLyrics } from '@bun/ai/direct-mode';
import { createLogger } from '@bun/logger';
import { selectGenreForLevel, mapSliderToLevel, selectMoodForLevel } from '@bun/prompt/creative-boost-templates';

import {
  generateLyricsForCreativeBoost,
  resolveGenreForCreativeBoost,
  buildCreativeBoostStyle,
  generateCreativeBoostTitle,
  generateCreativeBoostLyrics,
  buildCreativeBoostDebugInfo,
} from './helpers';

import type { GenerationResult } from '../types';
import type { GenerateCreativeBoostOptions, CreativeBoostEngineConfig } from './types';

const log = createLogger('CreativeBoostGenerate');

/**
 * Direct Mode generation - bypasses LLM for styles
 * Styles are returned exactly as selected, title generated via LLM
 */
export async function generateDirectMode(
  sunoStyles: string[],
  lyricsTopic: string,
  description: string,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  log.info('generateDirectMode:start', { stylesCount: sunoStyles.length, withLyrics });

  const result = await generateDirectModeWithLyrics(
    {
      sunoStyles,
      description,
      lyricsTopic,
      withLyrics,
      generateLyrics: (styleResult, topic, desc) =>
        generateLyricsForCreativeBoost(
          styleResult,
          topic,
          desc,
          false,
          true,
          config.getModel,
          config.getUseSunoTags?.() ?? false
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

  // Direct Mode: styles passed through as-is
  if (isDirectMode(sunoStyles)) {
    return generateDirectMode(sunoStyles, lyricsTopic, description, withLyrics, config);
  }

  log.info('generateCreativeBoost:deterministic', { creativityLevel, seedGenres, maxMode, withWordlessVocals, withLyrics });

  // 1. Resolve genre (detect from lyrics topic if needed)
  const { genres: resolvedGenres, debugInfo: genreDebugInfo } = await resolveGenreForCreativeBoost(
    seedGenres, lyricsTopic, withLyrics, config.getModel
  );

  // 2. Select genre and mood based on creativity level
  const level = mapSliderToLevel(creativityLevel);
  const selectedGenre = selectGenreForLevel(level, resolvedGenres, Math.random);
  const selectedMood = selectMoodForLevel(level, Math.random);

  // 3. Build style prompt
  const styleResult = buildCreativeBoostStyle(selectedGenre, maxMode, withWordlessVocals);

  // 4. Generate title
  const { title, debugInfo: titleDebugInfo } = await generateCreativeBoostTitle(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, config.getModel
  );

  // 5. Generate lyrics if requested
  const { lyrics, debugInfo: lyricsDebugInfo } = await generateCreativeBoostLyrics(
    withLyrics, lyricsTopic, description, selectedGenre, selectedMood, maxMode, config.getModel, config.getUseSunoTags?.() ?? false
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
