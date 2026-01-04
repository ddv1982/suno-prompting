/**
 * Direct Mode utilities for bypassing LLM style generation.
 * When Suno V5 Styles are selected, they are output exactly as-is.
 */

import { generateDirectModeTitle } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { DebugInfo } from '@shared/types';

export type DirectModeConfig = EngineConfig;

/**
 * Build a Direct Mode result where styles are passed through as-is.
 * Title is generated via LLM based on the description and styles.
 */
export function buildDirectModeResult(
  sunoStyles: string[],
  title: string,
  description: string | undefined,
  debugLabel: string,
  config: DirectModeConfig
): GenerationResult {
  const styleResult = sunoStyles.join(', ');
  return {
    text: styleResult,
    title,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(debugLabel, `Styles: ${styleResult}\nDescription: ${description || '(none)'}`, styleResult)
      : undefined,
  };
}

export type DirectModeGenerateOptions = {
  sunoStyles: string[];
  description?: string;
  debugLabel?: string;
};

/**
 * Generate a Direct Mode result.
 * Styles are output exactly as selected, title generated via LLM.
 */
export async function generateDirectModeResult(
  options: DirectModeGenerateOptions,
  config: DirectModeConfig
): Promise<GenerationResult> {
  const { sunoStyles, description, debugLabel = 'DIRECT_MODE: Styles passed through, title generated.' } = options;
  const title = await generateDirectModeTitle(description || '', sunoStyles, config.getModel);
  return buildDirectModeResult(sunoStyles, title, description, debugLabel, config);
}

export type DirectModeWithLyricsOptions = DirectModeGenerateOptions & {
  lyricsTopic: string;
  withLyrics: boolean;
  generateLyrics: (
    styleResult: string,
    lyricsTopic: string,
    description: string
  ) => Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }>;
};

/**
 * Generate a Direct Mode result with optional lyrics.
 * Used by Creative Boost Direct Mode.
 */
export async function generateDirectModeWithLyrics(
  options: DirectModeWithLyricsOptions,
  config: DirectModeConfig
): Promise<GenerationResult> {
  const { sunoStyles, description, lyricsTopic, withLyrics, generateLyrics, debugLabel = 'DIRECT_MODE' } = options;
  const styleResult = sunoStyles.join(', ');
  
  // Generate title
  const titleContext = description?.trim() || lyricsTopic?.trim() || '';
  const title = await generateDirectModeTitle(titleContext, sunoStyles, config.getModel);
  
  // Generate lyrics if requested
  const lyricsResult = withLyrics
    ? await generateLyrics(styleResult, lyricsTopic, description || '')
    : { lyrics: undefined };
  
  // Build debug info
  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(
      `${debugLabel}: No system prompt - styles passed through as-is`,
      `Suno V5 Styles: ${sunoStyles.join(', ')}`,
      styleResult
    );
    if (lyricsResult.debugInfo) {
      debugInfo.lyricsGeneration = lyricsResult.debugInfo;
    }
  }
  
  return {
    text: styleResult,
    title,
    lyrics: lyricsResult.lyrics,
    debugInfo,
  };
}

/**
 * Check if Direct Mode should be used (when sunoStyles are selected).
 */
export function isDirectMode(sunoStyles: string[]): boolean {
  return sunoStyles.length > 0;
}
