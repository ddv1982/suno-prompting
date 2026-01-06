/**
 * Refinement logic for Creative Boost Engine
 *
 * Contains functions for refining creative boost prompts based on
 * user feedback, including direct mode refinement.
 *
 * @module ai/creative-boost/refine
 */

import { generateText } from 'ai';

import { isDirectMode } from '@bun/ai/direct-mode';
import { callLLM } from '@bun/ai/llm-utils';
import { createLogger } from '@bun/logger';
import { formatBpmRange, getBlendedBpmRange } from '@bun/prompt/bpm';
import { buildProgressionShort } from '@bun/prompt/chord-progressions';
import {
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { buildPerformanceGuidance } from '@bun/prompt/genre-parser';
import { stripMaxModeHeader } from '@bun/prompt/quick-vibes-builder';
import { APP_CONSTANTS } from '@shared/constants';

import { DEFAULT_LYRICS_TOPIC, generateLyricsForCreativeBoost, postProcessCreativeBoostResponse } from './helpers';

import type { RefineCreativeBoostOptions, RefineDirectModeOptions, CreativeBoostEngineConfig } from './types';
import type { GenerationResult } from '@bun/ai/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostRefine');

/**
 * Refine title based on feedback
 */
async function refineTitleWithFeedback(
  currentTitle: string,
  styleResult: string,
  lyricsTopic: string,
  feedback: string,
  getModel: () => LanguageModel
): Promise<string> {
  const titleSystemPrompt = `You are refining a song title based on user input.
Current title: "${currentTitle}"
Musical style: ${styleResult}
${lyricsTopic?.trim() ? `Topic/Theme: ${lyricsTopic}` : ''}

User feedback: ${feedback}

Generate a new title that addresses the feedback while maintaining relevance to the style.
Output ONLY the new title, nothing else. Do not include quotes around the title.`;

  const { text: refinedTitle } = await generateText({
    model: getModel(),
    system: titleSystemPrompt,
    prompt: feedback,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
  });

  return refinedTitle.trim().replace(/^["']|["']$/g, '');
}

/**
 * Generate lyrics for Direct Mode refinement
 */
async function generateLyricsForDirectMode(
  styleResult: string,
  lyricsTopic: string,
  description: string,
  feedback: string,
  getModel: () => LanguageModel,
  useSunoTags: boolean
): Promise<string | undefined> {
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyricsForCreativeBoost(
    styleResult, topicForLyrics, feedback, false, true, getModel, useSunoTags
  );
  return result.lyrics;
}

/**
 * Direct Mode refinement - applies new styles and optionally refines title/lyrics.
 * Styles always updated; title/lyrics only change when feedback is provided.
 */
async function refineDirectMode(
  options: RefineDirectModeOptions,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  const { currentTitle, feedback, lyricsTopic, description, sunoStyles, withLyrics } = options;
  const hasFeedback = Boolean(feedback?.trim());
  const styleResult = sunoStyles.join(', ');

  log.info('refineDirectMode:start', { stylesCount: sunoStyles.length, hasFeedback, withLyrics });

  let newTitle = currentTitle;
  let lyrics: string | undefined;

  if (hasFeedback) {
    try {
      newTitle = await refineTitleWithFeedback(currentTitle, styleResult, lyricsTopic, feedback, config.getModel);
    } catch (error) {
      log.warn('refineDirectMode:title:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    if (withLyrics) {
      try {
        lyrics = await generateLyricsForDirectMode(styleResult, lyricsTopic, description, feedback, config.getModel, config.getUseSunoTags?.() ?? false);
      } catch (error) {
        log.warn('refineDirectMode:lyrics:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  const debugInfo = config.isDebugMode()
    ? config.buildDebugInfo(`DIRECT_MODE_REFINE${hasFeedback ? ' (with feedback)' : ''}`, `Feedback: ${feedback || '(none)'}\nStyles: ${styleResult}`, styleResult)
    : undefined;

  log.info('refineDirectMode:complete', {
    styleLength: styleResult.length,
    titleChanged: newTitle !== currentTitle,
    hasLyrics: Boolean(lyrics),
  });

  return {
    text: styleResult,
    title: newTitle,
    lyrics,
    debugInfo,
  };
}

/**
 * Refines a creative boost prompt based on user feedback.
 *
 * Handles both Direct Mode (style tags only) and full Creative Boost
 * refinement with LLM assistance.
 */
export async function refineCreativeBoost(
  options: RefineCreativeBoostOptions
): Promise<GenerationResult> {
  const {
    currentPrompt,
    currentTitle,
    feedback,
    lyricsTopic,
    description,
    seedGenres,
    sunoStyles,
    withWordlessVocals,
    maxMode,
    withLyrics,
    config,
  } = options;

  // Direct Mode: Apply new styles and optionally refine title/lyrics
  if (isDirectMode(sunoStyles)) {
    return refineDirectMode({
      currentTitle,
      feedback,
      lyricsTopic,
      description,
      sunoStyles,
      withLyrics,
    }, config);
  }

  const cleanPrompt = stripMaxModeHeader(currentPrompt);

  // Compute performance context ONCE - used for both LLM prompt and conversion
  const primaryGenre = seedGenres[0];
  const genreString = seedGenres.join(' ');
  const guidance = primaryGenre ? buildPerformanceGuidance(primaryGenre) : null;
  const performanceInstruments = guidance?.instruments;
  const performanceVocalStyle = guidance?.vocal;
  const chordProgression = primaryGenre ? buildProgressionShort(primaryGenre) : undefined;
  
  // Compute BPM range from blended genres
  const bpmRangeData = genreString ? getBlendedBpmRange(genreString) : null;
  const bpmRange = bpmRangeData ? formatBpmRange(bpmRangeData) : undefined;

  const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals);
  const userPrompt = buildCreativeBoostRefineUserPrompt(
    cleanPrompt, currentTitle, feedback, lyricsTopic, seedGenres, performanceInstruments, guidance
  );

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine Creative Boost',
  });

  const parsed = parseCreativeBoostResponse(rawResponse);

  return postProcessCreativeBoostResponse(parsed, {
    rawStyle: parsed.style,
    maxMode,
    seedGenres,
    sunoStyles,
    lyricsTopic,
    description,
    withLyrics,
    systemPrompt,
    userPrompt,
    rawResponse,
    config,
    performanceInstruments,
    performanceVocalStyle,
    chordProgression,
    bpmRange,
  });
}
