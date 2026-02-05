/**
 * Creative Boost Post-Processing
 *
 * Response post-processing utilities.
 *
 * @module ai/creative-boost/helpers/postprocess
 */

import { generateLyricsForCreativeBoost } from './content';
import { applyMaxModeConversion } from './conversion';
import { enforceMaxLength } from './length';

import type { PostProcessParams } from '@bun/ai/creative-boost/types';
import type { GenerationResult } from '@bun/ai/types';

/**
 * Post-process a parsed creative boost response.
 */
export async function postProcessCreativeBoostResponse(
  parsed: { style: string; title: string },
  params: PostProcessParams
): Promise<GenerationResult> {
  const {
    maxMode,
    seedGenres,
    sunoStyles,
    lyricsTopic,
    description,
    withLyrics,
    config,
    performanceInstruments,
    performanceVocalStyle,
    chordProgression,
    bpmRange,
  } = params;

  const ollamaEndpoint = config.getOllamaEndpoint?.();
  const { styleResult } = await applyMaxModeConversion(parsed.style, maxMode, config.getModel, {
    seedGenres,
    sunoStyles,
    performanceInstruments,
    performanceVocalStyle,
    chordProgression,
    bpmRange,
    ollamaEndpoint,
  });

  const processedStyle = await enforceMaxLength(styleResult, config.getModel, ollamaEndpoint);

  const lyricsResult = await generateLyricsForCreativeBoost(
    processedStyle,
    lyricsTopic,
    description,
    maxMode,
    withLyrics,
    config.getModel,
    config.getUseSunoTags?.() ?? false,
    ollamaEndpoint
  );

  return {
    text: processedStyle,
    title: parsed.title,
    lyrics: lyricsResult.lyrics,
    debugTrace: undefined,
  };
}
