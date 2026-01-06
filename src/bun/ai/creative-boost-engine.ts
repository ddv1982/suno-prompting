import { generateText } from 'ai';

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { condense } from '@bun/ai/llm-rewriter';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import { formatBpmRange, getBlendedBpmRange } from '@bun/prompt/bpm';
import { buildProgressionShort } from '@bun/prompt/chord-progressions';
import {
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { selectGenreForLevel, mapSliderToLevel, selectMoodForLevel } from '@bun/prompt/creative-boost-templates';
import { buildDeterministicMaxPrompt, buildDeterministicStandardPrompt } from '@bun/prompt/deterministic-builder';
import { buildPerformanceGuidance } from '@bun/prompt/genre-parser';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { convertToNonMaxFormat } from '@bun/prompt/non-max-conversion';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { stripMaxModeHeader } from '@bun/prompt/quick-vibes-builder';
import { generateDeterministicTitle } from '@bun/prompt/title-generator';
import { APP_CONSTANTS } from '@shared/constants';

import { isDirectMode, generateDirectModeWithLyrics } from './direct-mode';
import { callLLM } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { ConversionOptions, DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostEngine');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Default fallback topic when no lyrics topic or description is provided.
 * "Creative expression" is intentionally generic to give the LLM freedom
 * to generate thematically open lyrics.
 */
const DEFAULT_LYRICS_TOPIC = 'creative expression';

export type CreativeBoostEngineConfig = EngineConfig;

/**
 * Options for generating a creative boost prompt
 */
export interface GenerateCreativeBoostOptions {
  creativityLevel: number;
  seedGenres: string[];
  sunoStyles: string[];
  description: string;
  lyricsTopic: string;
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  config: CreativeBoostEngineConfig;
}

/**
 * Options for refining a creative boost prompt
 */
export interface RefineCreativeBoostOptions {
  currentPrompt: string;
  currentTitle: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  seedGenres: string[];
  sunoStyles: string[];
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  config: CreativeBoostEngineConfig;
}

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

/**
 * Inject wordless vocals into the instruments line of a prompt.
 * Handles both MAX mode (instruments: "...") and standard mode (Instruments: ...) formats.
 */
function injectWordlessVocals(prompt: string): string {
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
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
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
