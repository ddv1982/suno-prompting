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
import type { DebugInfo } from '@shared/types';


/**
 * Post-process a parsed creative boost response.
 */
export async function postProcessCreativeBoostResponse(
  parsed: { style: string; title: string },
  params: PostProcessParams
): Promise<GenerationResult> {
  const { maxMode, seedGenres, sunoStyles, lyricsTopic, description, withLyrics, config, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange } = params;

  const ollamaEndpoint = config.getOllamaEndpoint?.();
  const { styleResult, debugInfo: maxConversionDebugInfo } = await applyMaxModeConversion(
    parsed.style, maxMode, config.getModel, { seedGenres, sunoStyles, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange, ollamaEndpoint }
  );

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
