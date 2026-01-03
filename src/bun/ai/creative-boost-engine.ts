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
import { generateLyrics } from '@bun/ai/content-generator';
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
