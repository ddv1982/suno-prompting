/**
 * Creative Boost Debug Helpers
 *
 * Debug info assembly utilities.
 *
 * @module ai/creative-boost/helpers/debug
 */

import type { GenreDetectionDebugInfo, GenerationDebugInfo } from './content';
import type { CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { DebugInfo } from '@shared/types';


/**
 * Build debug info for creative boost generation.
 * Only assembles when debug mode is enabled to avoid overhead in production.
 * Labels indicate generation path (deterministic vs LLM-assisted).
 */
export function buildCreativeBoostDebugInfo(
  config: CreativeBoostEngineConfig,
  context: { withLyrics: boolean; level: string; genre: string; mood: string; topic: string },
  styleResult: string,
  parts: {
    genreDetection?: GenreDetectionDebugInfo;
    titleGeneration?: GenerationDebugInfo;
    lyricsGeneration?: GenerationDebugInfo;
  }
): DebugInfo | undefined {
  if (!config.isDebugMode()) {
    return undefined;
  }

  const label = context.withLyrics ? 'DETERMINISTIC_PROMPT_LLM_TITLE_LYRICS' : 'FULLY_DETERMINISTIC';
  const userPrompt = `Creativity: ${context.level}, Genre: ${context.genre}, Mood: ${context.mood}, Topic: ${context.topic}`;

  const baseDebugInfo = config.buildDebugInfo(label, userPrompt, styleResult);

  return {
    ...baseDebugInfo,
    genreDetection: parts.genreDetection,
    titleGeneration: parts.titleGeneration,
    lyricsGeneration: parts.lyricsGeneration,
  };
}
