/**
 * Direct Mode utilities for bypassing LLM style generation.
 * When Suno V5 Styles are selected, styles are preserved exactly as-is
 * but the prompt is enriched with instruments, moods, and production.
 */

import { enrichSunoStyles, buildMaxModeEnrichedLines, buildStandardModeEnrichedLines } from '@bun/prompt/enrichment';

import { generateDirectModeTitle } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { DebugInfo } from '@shared/types';

export type DirectModeConfig = EngineConfig;

export type DirectModeBuildOptions = {
  maxMode?: boolean;
};

/**
 * Build a Direct Mode result where styles are preserved as-is but
 * the prompt is enriched with instruments, moods, and production.
 * Title is generated via LLM based on the description and styles.
 */
export function buildDirectModeResult(
  sunoStyles: string[],
  title: string,
  description: string | undefined,
  debugLabel: string,
  config: DirectModeConfig,
  options: DirectModeBuildOptions = {}
): GenerationResult {
  const { maxMode = false } = options;

  // Enrich the prompt while preserving styles exactly as-is
  const enriched = enrichSunoStyles(sunoStyles);
  const lines = maxMode
    ? buildMaxModeEnrichedLines(sunoStyles, enriched.enrichment)
    : buildStandardModeEnrichedLines(sunoStyles, enriched.enrichment);

  const enrichedPrompt = lines.join('\n');

  return {
    text: enrichedPrompt,
    title,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(
          debugLabel,
          `Suno V5 Styles: ${sunoStyles.join(', ')}\nExtracted Genres: ${enriched.extractedGenres.join(', ') || '(none)'}\nDescription: ${description || '(none)'}`,
          enrichedPrompt
        )
      : undefined,
  };
}

export type DirectModeGenerateOptions = {
  sunoStyles: string[];
  description?: string;
  debugLabel?: string;
  maxMode?: boolean;
};

/**
 * Generate a Direct Mode result.
 * Styles are preserved as-is, prompt is enriched, title generated via LLM.
 */
export async function generateDirectModeResult(
  options: DirectModeGenerateOptions,
  config: DirectModeConfig
): Promise<GenerationResult> {
  const { sunoStyles, description, maxMode, debugLabel = 'DIRECT_MODE: Styles preserved, prompt enriched.' } = options;
  const title = await generateDirectModeTitle(description || '', sunoStyles, config.getModel);
  return buildDirectModeResult(sunoStyles, title, description, debugLabel, config, { maxMode });
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
 * Styles are preserved as-is, prompt is enriched with instruments, moods, production.
 * Used by Creative Boost Direct Mode.
 */
export async function generateDirectModeWithLyrics(
  options: DirectModeWithLyricsOptions,
  config: DirectModeConfig
): Promise<GenerationResult> {
  const { sunoStyles, description, lyricsTopic, maxMode, withLyrics, generateLyrics, debugLabel = 'DIRECT_MODE' } = options;

  // Enrich the prompt while preserving styles exactly as-is
  const enriched = enrichSunoStyles(sunoStyles);
  const lines = maxMode
    ? buildMaxModeEnrichedLines(sunoStyles, enriched.enrichment)
    : buildStandardModeEnrichedLines(sunoStyles, enriched.enrichment);

  const enrichedPrompt = lines.join('\n');

  // Generate title
  const titleContext = description?.trim() || lyricsTopic?.trim() || '';
  const title = await generateDirectModeTitle(titleContext, sunoStyles, config.getModel);

  // Generate lyrics if requested (pass enriched prompt for context)
  const lyricsResult = withLyrics
    ? await generateLyrics(enrichedPrompt, lyricsTopic, description || '')
    : { lyrics: undefined };

  // Build debug info
  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(
      `${debugLabel}: Styles preserved, prompt enriched`,
      `Suno V5 Styles: ${sunoStyles.join(', ')}\nExtracted Genres: ${enriched.extractedGenres.join(', ') || '(none)'}`,
      enrichedPrompt
    );
    if (lyricsResult.debugInfo) {
      debugInfo.lyricsGeneration = lyricsResult.debugInfo;
    }
  }

  return {
    text: enrichedPrompt,
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
