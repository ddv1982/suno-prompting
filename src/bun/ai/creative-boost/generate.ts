/**
 * Generation logic for Creative Boost Engine
 *
 * Contains functions for generating creative boost prompts,
 * including direct mode and deterministic generation paths.
 *
 * @module ai/creative-boost/generate
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { isDirectMode, generateDirectModeWithLyrics } from '@bun/ai/direct-mode';
import { createLogger } from '@bun/logger';
import { selectGenreForLevel, mapSliderToLevel, selectMoodForLevel } from '@bun/prompt/creative-boost-templates';
import { buildDeterministicMaxPrompt, buildDeterministicStandardPrompt } from '@bun/prompt/deterministic';
import { generateDeterministicTitle } from '@bun/prompt/title';

import { DEFAULT_LYRICS_TOPIC, injectWordlessVocals, generateLyricsForCreativeBoost } from './helpers';

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
  const {
    creativityLevel,
    seedGenres,
    sunoStyles,
    description,
    lyricsTopic,
    withWordlessVocals,
    maxMode,
    withLyrics,
    config,
  } = options;

  // Direct Mode: When Suno V5 Styles are selected, output them exactly as-is
  if (isDirectMode(sunoStyles)) {
    return generateDirectMode(
      sunoStyles,
      lyricsTopic,
      description,
      withLyrics,
      config
    );
  }

  log.info('generateCreativeBoost:deterministic', { creativityLevel, seedGenres, maxMode, withWordlessVocals, withLyrics });

  // Map creativity slider to level and select genre deterministically
  const level = mapSliderToLevel(creativityLevel);
  let resolvedSeedGenres = seedGenres;
  let genreDetectionDebugInfo: { systemPrompt: string; userPrompt: string; detectedGenre: string } | undefined;

  // Detect genre from lyrics topic if no seed genres and lyrics mode is ON
  if (withLyrics && seedGenres.length === 0 && lyricsTopic?.trim()) {
    const genreResult = await detectGenreFromTopic(lyricsTopic.trim(), config.getModel);
    resolvedSeedGenres = [genreResult.genre];
    genreDetectionDebugInfo = genreResult.debugInfo;
    log.info('generateCreativeBoost:genreFromTopic', { lyricsTopic, detectedGenre: genreResult.genre });
  }

  const selectedGenre = selectGenreForLevel(level, resolvedSeedGenres, Math.random);
  const selectedMood = selectMoodForLevel(level, Math.random);

  // Build the prompt using the existing deterministic builder
  // Use genre as description since we've already selected it
  let styleResult: string;
  if (maxMode) {
    const result = buildDeterministicMaxPrompt({
      description: selectedGenre,
      genreOverride: selectedGenre,
    });
    styleResult = result.text;
  } else {
    const result = buildDeterministicStandardPrompt({
      description: selectedGenre,
      genreOverride: selectedGenre,
    });
    styleResult = result.text;
  }

  // Inject wordless vocals into instruments line if requested
  if (withWordlessVocals) {
    styleResult = injectWordlessVocals(styleResult);
  }

  // Generate title: LLM when lyrics ON (to match lyrics theme), deterministic otherwise
  let title: string;
  let titleDebugInfo: { systemPrompt: string; userPrompt: string } | undefined;

  if (withLyrics) {
    const topicForTitle = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
    const titleResult = await generateTitle(topicForTitle, selectedGenre, selectedMood, config.getModel);
    title = titleResult.title;
    titleDebugInfo = titleResult.debugInfo;
  } else {
    title = generateDeterministicTitle(selectedGenre, selectedMood);
  }

  // Generate lyrics if requested (still uses LLM)
  let lyrics: string | undefined;
  let lyricsDebugInfo: { systemPrompt: string; userPrompt: string } | undefined;

  if (withLyrics) {
    const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
    const lyricsResult = await generateLyrics(
      topicForLyrics,
      selectedGenre,
      selectedMood,
      maxMode,
      config.getModel,
      config.getUseSunoTags?.() ?? false
    );
    lyrics = lyricsResult.lyrics;
    lyricsDebugInfo = lyricsResult.debugInfo;
  }

  // Build debug info with actual LLM prompts for title and lyrics
  const topicDisplay = lyricsTopic?.trim() || '(none)';
  const baseDebugInfo = config.isDebugMode()
    ? config.buildDebugInfo(
        withLyrics ? 'DETERMINISTIC_PROMPT_LLM_TITLE_LYRICS' : 'FULLY_DETERMINISTIC',
        `Creativity: ${level}, Genre: ${selectedGenre}, Mood: ${selectedMood}, Topic: ${topicDisplay}`,
        styleResult
      )
    : undefined;

  // Attach actual LLM prompts to debug info
  const debugInfo = baseDebugInfo
    ? {
        ...baseDebugInfo,
        genreDetection: genreDetectionDebugInfo,
        titleGeneration: titleDebugInfo,
        lyricsGeneration: lyricsDebugInfo,
      }
    : undefined;

  return {
    text: styleResult,
    title,
    lyrics,
    debugInfo,
  };
}
