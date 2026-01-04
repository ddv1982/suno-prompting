import { generateText } from 'ai';

import { generateLyrics } from '@bun/ai/content-generator';
import { condense } from '@bun/ai/llm-rewriter';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import {
  buildCreativeBoostSystemPrompt,
  buildCreativeBoostUserPrompt,
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { convertToNonMaxFormat } from '@bun/prompt/non-max-conversion';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { stripMaxModeHeader } from '@bun/prompt/quick-vibes-builder';
import { APP_CONSTANTS } from '@shared/constants';


import { callLLM, generateDirectModeTitle } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostEngine');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export type CreativeBoostEngineConfig = EngineConfig;

async function applyMaxModeConversion(
  style: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  seedGenres?: string[],
  sunoStyles?: string[]
): Promise<{ styleResult: string; debugInfo?: DebugInfo['maxConversion'] }> {
  if (maxMode) {
    const result = await convertToMaxFormat(style, getModel, seedGenres, sunoStyles);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  } else {
    const result = await convertToNonMaxFormat(style, getModel, seedGenres, sunoStyles);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  }
}

async function enforceMaxLength(text: string, getModel: () => LanguageModel): Promise<string> {
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

async function generateLyricsForCreativeBoost(
  styleResult: string,
  lyricsTopic: string,
  description: string,
  maxMode: boolean,
  withLyrics: boolean,
  getModel: () => LanguageModel
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel);

  return {
    lyrics: result.lyrics,
    debugInfo: result.debugInfo,
  };
}

type PostProcessParams = {
  rawStyle: string;
  maxMode: boolean;
  seedGenres: string[];
  sunoStyles: string[];
  lyricsTopic: string;
  description: string;
  withLyrics: boolean;
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
  config: CreativeBoostEngineConfig;
};

async function postProcessCreativeBoostResponse(
  parsed: { style: string; title: string },
  params: PostProcessParams
): Promise<GenerationResult> {
  const { maxMode, seedGenres, sunoStyles, lyricsTopic, description, withLyrics, config } = params;

  const { styleResult, debugInfo: maxConversionDebugInfo } = await applyMaxModeConversion(
    parsed.style, maxMode, config.getModel, seedGenres, sunoStyles
  );

  const processedStyle = await enforceMaxLength(styleResult, config.getModel);

  const lyricsResult = await generateLyricsForCreativeBoost(
    processedStyle, lyricsTopic, description, maxMode, withLyrics, config.getModel
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

/**
 * Direct Mode generation - bypasses LLM for styles
 * Styles are returned exactly as selected, title generated via LLM
 */
async function generateDirectMode(
  sunoStyles: string[],
  lyricsTopic: string,
  description: string,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  const styleResult = sunoStyles.join(', ');
  log.info('generateDirectMode:start', { stylesCount: sunoStyles.length, withLyrics });

  // Use lyricsTopic as fallback context for title generation
  const titleContext = description?.trim() || lyricsTopic?.trim() || '';
  const title = await generateDirectModeTitle(titleContext, sunoStyles, config.getModel);

  // Generate lyrics without max mode header (maxMode: false always in direct mode)
  const lyricsResult = await generateLyricsForCreativeBoost(
    styleResult,
    lyricsTopic,
    description,
    false, // maxMode = false (always, for direct mode)
    withLyrics,
    config.getModel
  );

  // Build debug info if enabled
  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(
      'DIRECT_MODE: No system prompt - styles passed through as-is',
      `Suno V5 Styles: ${sunoStyles.join(', ')}`,
      styleResult
    );
    if (lyricsResult.debugInfo) {
      debugInfo.lyricsGeneration = lyricsResult.debugInfo;
    }
  }

  log.info('generateDirectMode:complete', {
    styleLength: styleResult.length,
    hasLyrics: !!lyricsResult.lyrics,
  });

  return {
    text: styleResult,
    title,
    lyrics: lyricsResult.lyrics,
    debugInfo,
  };
}

/** Options for Direct Mode refinement */
interface RefineDirectModeOptions {
  currentTitle: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  sunoStyles: string[];
  withLyrics: boolean;
}

/**
 * Direct Mode refinement - applies new styles and optionally refines title/lyrics.
 * 
 * Per requirements:
 * - Styles are always updated from sunoStyles array
 * - Title/lyrics only change when feedback is provided
 */
async function refineDirectMode(
  options: RefineDirectModeOptions,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  const { currentTitle, feedback, lyricsTopic, description, sunoStyles, withLyrics } = options;
  const hasFeedback = Boolean(feedback?.trim());
  
  // Apply new styles
  const styleResult = sunoStyles.join(', ');

  log.info('refineDirectMode:start', {
    stylesCount: sunoStyles.length,
    hasFeedback,
    withLyrics,
  });

  // Per requirements: Title/lyrics only regenerate when feedback is provided
  let newTitle = currentTitle;
  let lyrics: string | undefined;

  // Only refine title if feedback provided
  if (hasFeedback) {
    try {
      const titleSystemPrompt = `You are refining a song title based on user input.
Current title: "${currentTitle}"
Musical style: ${styleResult}
${lyricsTopic?.trim() ? `Topic/Theme: ${lyricsTopic}` : ''}

User feedback: ${feedback}

Generate a new title that addresses the feedback while maintaining relevance to the style.
Output ONLY the new title, nothing else. Do not include quotes around the title.`;

      const { text: refinedTitle } = await generateText({
        model: config.getModel(),
        system: titleSystemPrompt,
        prompt: feedback,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      newTitle = refinedTitle.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      log.warn('refineDirectMode:title:failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Only generate lyrics if feedback provided AND withLyrics enabled
  if (hasFeedback && withLyrics) {
    try {
      const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
      const lyricsResult = await generateLyricsForCreativeBoost(
        styleResult,
        topicForLyrics,
        feedback,
        false, // maxMode = false for direct mode
        true,
        config.getModel
      );
      lyrics = lyricsResult.lyrics;
    } catch (error) {
      log.warn('refineDirectMode:lyrics:failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Build debug info if enabled
  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(
      `DIRECT_MODE_REFINE${hasFeedback ? ' (with feedback)' : ''}`,
      `Feedback: ${feedback || '(none)'}\nStyles: ${styleResult}`,
      styleResult
    );
  }

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

export async function generateCreativeBoost(
  creativityLevel: number,
  seedGenres: string[],
  sunoStyles: string[],
  description: string,
  lyricsTopic: string,
  withWordlessVocals: boolean,
  maxMode: boolean,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  // ============ DIRECT MODE BYPASS ============
  // When Suno V5 Styles are selected, bypass all LLM style generation
  // Output is exactly the selected styles, no transformation
  if (sunoStyles.length > 0) {
    return generateDirectMode(
      sunoStyles,
      lyricsTopic,
      description,
      withLyrics,
      config
    );
  }
  // ============ END DIRECT MODE BYPASS ============

  const systemPrompt = buildCreativeBoostSystemPrompt(creativityLevel, withWordlessVocals);
  const userPrompt = buildCreativeBoostUserPrompt(creativityLevel, seedGenres, description);

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'generate Creative Boost',
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
  });
}

export async function refineCreativeBoost(
  currentPrompt: string,
  currentTitle: string,
  feedback: string,
  lyricsTopic: string,
  description: string,
  seedGenres: string[],
  sunoStyles: string[],
  withWordlessVocals: boolean,
  maxMode: boolean,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  // Direct Mode: Apply new styles and optionally refine title/lyrics
  if (sunoStyles.length > 0) {
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
  const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals);
  const userPrompt = buildCreativeBoostRefineUserPrompt(cleanPrompt, currentTitle, feedback);

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
  });
}
