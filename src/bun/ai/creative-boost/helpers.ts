/**
 * Helper utilities for Creative Boost Engine
 *
 * Contains conversion, length enforcement, and vocal injection helpers
 * used across generation and refinement operations.
 *
 * @module ai/creative-boost/helpers
 */

import { generateLyrics } from '@bun/ai/content-generator';
import { condense } from '@bun/ai/llm-rewriter';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import { convertToMaxFormat, convertToNonMaxFormat } from '@bun/prompt/conversion';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { APP_CONSTANTS } from '@shared/constants';

import type { GenerationResult } from '../types';
import type { PostProcessParams } from './types';
import type { DebugInfo, ConversionOptions } from '@shared/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostHelpers');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Default fallback topic when no lyrics topic or description is provided.
 * "Creative expression" is intentionally generic to give the LLM freedom
 * to generate thematically open lyrics.
 */
export const DEFAULT_LYRICS_TOPIC = 'creative expression';

/**
 * Applies max or non-max mode conversion to style output.
 */
export async function applyMaxModeConversion(
  style: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  options: ConversionOptions = {}
): Promise<{ styleResult: string; debugInfo?: DebugInfo['maxConversion'] }> {
  if (maxMode) {
    const result = await convertToMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  } else {
    const result = await convertToNonMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  }
}

/**
 * Enforces max character limit on prompt text.
 * Condenses text using LLM if it exceeds the limit.
 */
export async function enforceMaxLength(
  text: string,
  getModel: () => LanguageModel
): Promise<string> {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  log.info('enforceMaxLength:processing', { originalLength: text.length, maxChars: MAX_CHARS });
  const result = await enforceLengthLimit(text, MAX_CHARS, (t) => condense(t, getModel));
  if (result.length < text.length) {
    log.info('enforceMaxLength:reduced', { newLength: result.length });
  }
  return result;
}

/**
 * Inject wordless vocals into the instruments line of a prompt.
 * Handles both MAX mode (instruments: "...") and standard mode (Instruments: ...) formats.
 */
export function injectWordlessVocals(prompt: string): string {
  // Match instruments line in both formats
  const maxModePattern = /(instruments:\s*"[^"]+)/i;
  const standardModePattern = /(Instruments:\s*[^\n]+)/i;

  // Try MAX mode format first
  if (maxModePattern.test(prompt)) {
    return prompt.replace(maxModePattern, '$1, wordless vocals');
  }

  // Try standard mode format
  if (standardModePattern.test(prompt)) {
    return prompt.replace(standardModePattern, '$1, wordless vocals');
  }

  // If no instruments line found, return unchanged
  return prompt;
}

/**
 * Generates lyrics for creative boost prompts.
 */
export async function generateLyricsForCreativeBoost(
  styleResult: string,
  lyricsTopic: string,
  description: string,
  maxMode: boolean,
  withLyrics: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags);

  return {
    lyrics: result.lyrics,
    debugInfo: result.debugInfo,
  };
}

/**
 * Post-process a parsed creative boost response.
 */
export async function postProcessCreativeBoostResponse(
  parsed: { style: string; title: string },
  params: PostProcessParams
): Promise<GenerationResult> {
  const { maxMode, seedGenres, sunoStyles, lyricsTopic, description, withLyrics, config, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange } = params;

  const { styleResult, debugInfo: maxConversionDebugInfo } = await applyMaxModeConversion(
    parsed.style, maxMode, config.getModel, { seedGenres, sunoStyles, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange }
  );

  const processedStyle = await enforceMaxLength(styleResult, config.getModel);

  const lyricsResult = await generateLyricsForCreativeBoost(
    processedStyle,
    lyricsTopic,
    description,
    maxMode,
    withLyrics,
    config.getModel,
    config.getUseSunoTags?.() ?? false
  );

  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(params.systemPrompt, params.userPrompt, params.rawResponse);
    if (maxConversionDebugInfo) {
      debugInfo.maxConversion = maxConversionDebugInfo;
    }
    if (lyricsResult.debugInfo) {
      debugInfo.lyricsGeneration = lyricsResult.debugInfo;
    }
  }

  return {
    text: processedStyle,
    title: parsed.title,
    lyrics: lyricsResult.lyrics,
    debugInfo,
  };
}
