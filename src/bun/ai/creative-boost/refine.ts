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

import { DEFAULT_LYRICS_TOPIC, enforceGenreCount, generateLyricsForCreativeBoost, postProcessCreativeBoostResponse } from './helpers';

import type { RefineCreativeBoostOptions, RefineDirectModeOptions, CreativeBoostEngineConfig } from './types';
import type { GenerationResult } from '@bun/ai/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostRefine');

// =============================================================================
// Performance Context
// =============================================================================

/**
 * Context for genre-aware max mode conversion.
 *
 * WHY separate type? This context is computed once and used in two places:
 * 1. LLM user prompt (to guide refinement toward appropriate instruments)
 * 2. Post-processing (for max mode conversion with genre-specific elements)
 */
interface PerformanceContext {
  primaryGenre: string | undefined;
  guidance: ReturnType<typeof buildPerformanceGuidance> | null;
  performanceInstruments: string[] | undefined;
  performanceVocalStyle: string | undefined;
  chordProgression: string | undefined;
  bpmRange: string | undefined;
}

/**
 * Build performance context from seed genres.
 *
 * WHY extract this? The same context is needed for:
 * 1. Building LLM prompts (genre-aware guidance)
 * 2. Max mode conversion (instrument/vocal injection)
 *
 * Computing once avoids duplicate logic and ensures consistency.
 */
function buildPerformanceContext(seedGenres: string[]): PerformanceContext {
  const primaryGenre = seedGenres[0];
  const genreString = seedGenres.join(' ');
  const guidance = primaryGenre ? buildPerformanceGuidance(primaryGenre) : null;
  const bpmRangeData = genreString ? getBlendedBpmRange(genreString) : null;

  return {
    primaryGenre,
    guidance,
    performanceInstruments: guidance?.instruments,
    performanceVocalStyle: guidance?.vocal,
    chordProgression: primaryGenre ? buildProgressionShort(primaryGenre) : undefined,
    bpmRange: bpmRangeData ? formatBpmRange(bpmRangeData) : undefined,
  };
}

// =============================================================================
// Title & Lyrics Helpers
// =============================================================================

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
  useSunoTags: boolean,
  ollamaEndpoint?: string
): Promise<string | undefined> {
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyricsForCreativeBoost(
    styleResult, topicForLyrics, feedback, false, true, getModel, useSunoTags, ollamaEndpoint
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
    } catch (error: unknown) {
      log.warn('refineDirectMode:title:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    if (withLyrics) {
      try {
        lyrics = await generateLyricsForDirectMode(styleResult, lyricsTopic, description, feedback, config.getModel, config.getUseSunoTags?.() ?? false, config.getOllamaEndpoint?.());
      } catch (error: unknown) {
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
    targetGenreCount,
  } = options;

  // Direct Mode: Apply new styles and optionally refine title/lyrics
  // Skip genre count enforcement for Direct Mode (sunoStyles selected)
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

  // Build performance context once - used for both LLM prompt and post-processing
  const perfCtx = buildPerformanceContext(seedGenres);

  const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals, targetGenreCount);
  const userPrompt = buildCreativeBoostRefineUserPrompt(
    cleanPrompt, currentTitle, feedback, lyricsTopic, seedGenres, perfCtx.performanceInstruments, perfCtx.guidance
  );

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine Creative Boost',
  });

  const parsed = parseCreativeBoostResponse(rawResponse);

  // Enforce genre count on LLM response when targetGenreCount > 0
  // This post-processes the style to guarantee the exact genre count
  const enforcedStyle = targetGenreCount && targetGenreCount > 0
    ? enforceGenreCount(parsed.style, targetGenreCount)
    : parsed.style;

  return postProcessCreativeBoostResponse({ ...parsed, style: enforcedStyle }, {
    rawStyle: enforcedStyle,
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
    performanceInstruments: perfCtx.performanceInstruments,
    performanceVocalStyle: perfCtx.performanceVocalStyle,
    chordProgression: perfCtx.chordProgression,
    bpmRange: perfCtx.bpmRange,
  });
}
