import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo } from '@shared/types';
import {
  buildCreativeBoostSystemPrompt,
  buildCreativeBoostUserPrompt,
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { stripMaxModeHeader } from '@bun/prompt/quick-vibes-builder';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { convertToNonMaxFormat } from '@bun/prompt/non-max-conversion';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { condense } from '@bun/ai/llm-rewriter';
import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import type { GenerationResult, DebugInfoBuilder } from './types';

const log = createLogger('CreativeBoostEngine');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export type CreativeBoostEngineConfig = {
  getModel: () => LanguageModel;
  isDebugMode: () => boolean;
  buildDebugInfo: DebugInfoBuilder;
};

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
 * Used when Suno V5 Styles are selected
 * Styles are returned exactly as-is (joined with ', ')
 */
async function generateDirectMode(
  sunoStyles: string[],
  lyricsTopic: string,
  description: string,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  // Style is exactly the selected styles, joined with comma
  const styleResult = sunoStyles.join(', ');

  log.info('generateDirectMode:start', {
    stylesCount: sunoStyles.length,
    withLyrics,
  });

  // Generate title based on styles (uses existing title generation)
  let title = 'Untitled';
  try {
    const genre = sunoStyles[0] || 'music'; // Use first style as genre hint
    const mood = extractMoodFromPrompt(styleResult) || 'creative';
    const titleResult = await generateTitle(
      styleResult,
      genre,
      mood,
      config.getModel
    );
    title = titleResult.title;
  } catch (error) {
    log.warn('generateDirectMode:title:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Continue with fallback title
  }

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

/**
 * Direct Mode refinement - only refines title and lyrics
 * Styles remain unchanged (not refinable in direct mode)
 */
async function refineDirectMode(
  currentPrompt: string, // Styles - kept unchanged
  currentTitle: string,
  feedback: string,
  lyricsTopic: string,
  description: string,
  withLyrics: boolean,
  config: CreativeBoostEngineConfig
): Promise<GenerationResult> {
  log.info('refineDirectMode:start', {
    currentPromptLength: currentPrompt.length,
    feedbackLength: feedback.length,
    withLyrics,
  });

  // Refine title based on feedback
  let newTitle = currentTitle;
  try {
    const titleSystemPrompt = `You are refining a song title based on user feedback.
Current title: "${currentTitle}"
Musical style: ${currentPrompt}

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
    // Continue with existing title on error
  }

  // Refine lyrics if enabled (always with maxMode: false for direct mode)
  let lyrics: string | undefined;
  if (withLyrics) {
    try {
      const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
      const lyricsResult = await generateLyricsForCreativeBoost(
        currentPrompt,
        topicForLyrics,
        feedback, // Use feedback as additional context for lyrics
        false, // maxMode = false (always, for direct mode)
        true, // withLyrics = true
        config.getModel
      );
      lyrics = lyricsResult.lyrics;
    } catch (error) {
      log.warn('refineDirectMode:lyrics:failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue without lyrics on error
    }
  }

  // Build debug info if enabled
  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(
      'DIRECT_MODE_REFINE: Styles unchanged, title and lyrics refined',
      `Feedback: ${feedback}`,
      currentPrompt
    );
  }

  log.info('refineDirectMode:complete', {
    styleLength: currentPrompt.length,
    titleChanged: newTitle !== currentTitle,
    hasLyrics: !!lyrics,
  });

  return {
    text: currentPrompt, // Styles unchanged
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

  try {
    const { text: rawResponse } = await generateText({
      model: config.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!rawResponse?.trim()) {
      throw new AIGenerationError('Empty response from AI model (Creative Boost)');
    }

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
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to generate Creative Boost: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
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
  // ============ DIRECT MODE REFINE ============
  // When Suno V5 Styles are selected, only refine title and lyrics
  // Styles remain unchanged (not refinable)
  if (sunoStyles.length > 0) {
    return refineDirectMode(
      currentPrompt, // Keep styles unchanged
      currentTitle,
      feedback,
      lyricsTopic,
      description,
      withLyrics,
      config
    );
  }
  // ============ END DIRECT MODE REFINE ============

  const cleanPrompt = stripMaxModeHeader(currentPrompt);
  const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals);
  const userPrompt = buildCreativeBoostRefineUserPrompt(cleanPrompt, currentTitle, feedback);

  try {
    const { text: rawResponse } = await generateText({
      model: config.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!rawResponse?.trim()) {
      throw new AIGenerationError('Empty response from AI model (Creative Boost refine)');
    }

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
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to refine Creative Boost: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}
