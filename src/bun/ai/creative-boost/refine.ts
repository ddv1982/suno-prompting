/**
 * Refinement logic for Creative Boost Engine
 *
 * Contains functions for refining creative boost prompts based on
 * user feedback, including direct mode refinement.
 *
 * @module ai/creative-boost/refine
 */

import { isDirectMode, buildDirectModePrompt } from '@bun/ai/direct-mode';
import { generateDirectModeTitle } from '@bun/ai/llm-utils';
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
// Lyrics Helper
// =============================================================================

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
 * Attempt to regenerate title for Direct Mode refinement.
 * Returns original title if generation fails.
 */
async function tryRefineDirectModeTitle(
  currentTitle: string,
  context: string,
  sunoStyles: string[],
  config: CreativeBoostEngineConfig
): Promise<string> {
  try {
    return await generateDirectModeTitle(context, sunoStyles, config.getModel);
  } catch (error: unknown) {
    log.warn('refineDirectMode:title:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return currentTitle;
  }
}

/**
 * Attempt to generate lyrics for Direct Mode refinement.
 * Returns undefined if generation fails.
 */
async function tryRefineDirectModeLyrics(
  enrichedPrompt: string,
  lyricsTopic: string,
  description: string,
  feedback: string,
  config: CreativeBoostEngineConfig
): Promise<string | undefined> {
  try {
    return await generateLyricsForDirectMode(
      enrichedPrompt,
      lyricsTopic,
      description,
      feedback,
      config.getModel,
      config.getUseSunoTags?.() ?? false,
      config.getOllamaEndpoint?.()
    );
  } catch (error: unknown) {
    log.warn('refineDirectMode:lyrics:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return undefined;
  }
}

/**
 * Direct Mode refinement - uses shared enrichment and optionally generates lyrics.
 * 
 * Uses buildDirectModePrompt for enriched prompt (DRY - same as generation).
 * Title only regenerated when feedback is provided (preserves original otherwise).
 * Lyrics only generated when feedback is provided and withLyrics is true.
 */
async function refineDirectMode(
  options: RefineDirectModeOptions,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  const { currentTitle, currentLyrics, feedback, lyricsTopic, description, sunoStyles, withLyrics, maxMode } = options;
  const hasFeedback = Boolean(feedback?.trim());

  log.info('refineDirectMode:start', { stylesCount: sunoStyles.length, hasFeedback, withLyrics, maxMode });

  const { text: enrichedPrompt } = buildDirectModePrompt(sunoStyles, maxMode);

  const title = hasFeedback
    ? await tryRefineDirectModeTitle(currentTitle, description || lyricsTopic || feedback, sunoStyles, config)
    : currentTitle;

  // Lyrics bootstrap:
  // - If lyrics are missing, generate them even when feedback is empty.
  // - If lyrics exist, only regenerate/refine when feedback is provided.
  const shouldGenerateLyrics = withLyrics && (!currentLyrics || hasFeedback);
  const lyricsFeedback = hasFeedback ? feedback : '';
  const lyrics = shouldGenerateLyrics
    ? await tryRefineDirectModeLyrics(enrichedPrompt, lyricsTopic, description, lyricsFeedback, config)
    : currentLyrics;

  log.info('refineDirectMode:complete', {
    promptLength: enrichedPrompt.length,
    titleChanged: title !== currentTitle,
    hasLyrics: Boolean(lyrics),
  });

  return {
    text: enrichedPrompt,
    title,
    lyrics,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(
          `DIRECT_MODE_REFINE${hasFeedback ? ' (with feedback)' : ''}`,
          `Styles: ${sunoStyles.join(', ')}\nFeedback: ${feedback || '(none)'}`,
          enrichedPrompt
        )
      : undefined,
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
    currentLyrics,
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

  // Direct Mode: Use shared enrichment and optionally generate lyrics
  // Skip genre count enforcement for Direct Mode (sunoStyles selected)
  if (isDirectMode(sunoStyles)) {
    return refineDirectMode({
      currentTitle,
      currentLyrics,
      feedback,
      lyricsTopic,
      description,
      sunoStyles,
      withLyrics,
      maxMode,
    }, config);
  }

  const cleanPrompt = stripMaxModeHeader(currentPrompt);

  // Build performance context once - used for both LLM prompt and post-processing
  const perfCtx = buildPerformanceContext(seedGenres);

  const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals, targetGenreCount);
  const userPrompt = buildCreativeBoostRefineUserPrompt(
    cleanPrompt, currentTitle, feedback, lyricsTopic, seedGenres, perfCtx.performanceInstruments, perfCtx.guidance
  );

  // Get Ollama endpoint for local LLM mode (bypasses Bun fetch bug)
  const ollamaEndpoint = config.getOllamaEndpoint?.();

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine Creative Boost',
    ollamaEndpoint,
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
