import { generateText } from 'ai';

import { generateLyrics } from '@bun/ai/content-generator';
import { condense } from '@bun/ai/llm-rewriter';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import { formatBpmRange, getBlendedBpmRange } from '@bun/prompt/bpm';
import { buildProgressionShort } from '@bun/prompt/chord-progressions';
import {
  buildCreativeBoostSystemPrompt,
  buildCreativeBoostUserPrompt,
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { buildPerformanceGuidance } from '@bun/prompt/genre-parser';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { convertToNonMaxFormat } from '@bun/prompt/non-max-conversion';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { stripMaxModeHeader } from '@bun/prompt/quick-vibes-builder';
import { APP_CONSTANTS } from '@shared/constants';

import { isDirectMode, generateDirectModeWithLyrics } from './direct-mode';
import { callLLM } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { ConversionOptions, DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostEngine');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export type CreativeBoostEngineConfig = EngineConfig;

/**
 * Applies max or non-max mode conversion to style output.
 */
async function applyMaxModeConversion(
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
  getModel: () => LanguageModel,
  useSunoTags: boolean
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags);

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
  performanceInstruments?: string[];
  performanceVocalStyle?: string;
  chordProgression?: string;
  bpmRange?: string;
};

async function postProcessCreativeBoostResponse(
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

/** Options for Direct Mode refinement */
interface RefineDirectModeOptions {
  currentTitle: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  sunoStyles: string[];
  withLyrics: boolean;
}

/** Refine title based on feedback */
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

/** Generate lyrics for Direct Mode refinement */
async function generateLyricsForDirectMode(
  styleResult: string,
  lyricsTopic: string,
  description: string,
  feedback: string,
  getModel: () => LanguageModel,
  useSunoTags: boolean
): Promise<string | undefined> {
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
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

  const systemPrompt = buildCreativeBoostSystemPrompt(creativityLevel, withWordlessVocals);
  const userPrompt = buildCreativeBoostUserPrompt(
    creativityLevel, seedGenres, description, lyricsTopic, performanceInstruments, guidance
  );

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
    performanceInstruments,
    performanceVocalStyle,
    chordProgression,
    bpmRange,
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
