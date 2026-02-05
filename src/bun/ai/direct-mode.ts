/**
 * Direct Mode utilities for bypassing LLM style generation.
 * When Suno V5 Styles are selected, styles are preserved exactly as-is
 * but the prompt is enriched with instruments, moods, and production.
 */

import {
  enrichSunoStyles,
  buildMaxModeEnrichedLines,
  buildStandardModeEnrichedLines,
} from '@bun/prompt/enrichment';

import { generateDirectModeTitle } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { Rng } from '@bun/instruments/services/random';
import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';

export type DirectModeConfig = EngineConfig;

export interface DirectModeTraceRuntime {
  readonly trace?: TraceCollector;
  readonly rng?: Rng;
  readonly moodCategory?: MoodCategory | null;
}

/**
 * Build enriched prompt for Direct Mode (styles preserved as-is).
 * Shared by Full Prompt, Creative Boost, and Quick Vibes.
 *
 * @returns Enriched prompt text and enrichment metadata
 */
export function buildDirectModePrompt(
  sunoStyles: string[],
  maxMode: boolean
): {
  text: string;
  enriched: ReturnType<typeof enrichSunoStyles>;
} {
  const enriched = enrichSunoStyles(sunoStyles);
  const lines = maxMode
    ? buildMaxModeEnrichedLines(sunoStyles, enriched.enrichment)
    : buildStandardModeEnrichedLines(sunoStyles, enriched.enrichment);

  return {
    text: lines.join('\n'),
    enriched,
  };
}

/**
 * Build enriched prompt for Direct Mode (styles preserved as-is) with optional trace/rng.
 */
export function buildDirectModePromptWithRuntime(
  sunoStyles: string[],
  maxMode: boolean,
  runtime?: DirectModeTraceRuntime
): {
  text: string;
  enriched: ReturnType<typeof enrichSunoStyles>;
} {
  const enriched = enrichSunoStyles(sunoStyles, {
    rng: runtime?.rng,
    trace: runtime?.trace,
    moodCategory: runtime?.moodCategory ?? undefined,
  });
  const lines = maxMode
    ? buildMaxModeEnrichedLines(sunoStyles, enriched.enrichment)
    : buildStandardModeEnrichedLines(sunoStyles, enriched.enrichment);

  return {
    text: lines.join('\n'),
    enriched,
  };
}

export interface DirectModeGenerateOptions {
  sunoStyles: string[];
  description?: string;
  debugLabel?: string;
  maxMode?: boolean;
}

/**
 * Generate a Direct Mode result.
 * Styles are preserved as-is, prompt is enriched, title generated via LLM.
 */
export async function generateDirectModeResult(
  options: DirectModeGenerateOptions,
  config: DirectModeConfig,
  runtime?: DirectModeTraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, description, maxMode } = options;
  const title = await generateDirectModeTitle(
    description || '',
    sunoStyles,
    config.getModel,
    config.getOllamaEndpoint?.(),
    {
      trace: runtime?.trace,
      traceLabel: 'title.generate',
    }
  );

  const { text } = buildDirectModePromptWithRuntime(sunoStyles, maxMode ?? false, runtime);

  return {
    text,
    title,
    debugTrace: undefined,
  };
}

export type DirectModeWithLyricsOptions = DirectModeGenerateOptions & {
  lyricsTopic: string;
  withLyrics: boolean;
  generateLyrics: (
    styleResult: string,
    lyricsTopic: string,
    description: string
  ) => Promise<{ lyrics: string | undefined }>;
};

/**
 * Generate a Direct Mode result with optional lyrics.
 * Styles are preserved as-is, prompt is enriched with instruments, moods, production.
 * Used by Creative Boost Direct Mode.
 */
export async function generateDirectModeWithLyrics(
  options: DirectModeWithLyricsOptions,
  config: DirectModeConfig,
  runtime?: DirectModeTraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, description, lyricsTopic, maxMode, withLyrics, generateLyrics } = options;

  const { text: enrichedPrompt } = buildDirectModePromptWithRuntime(
    sunoStyles,
    maxMode ?? false,
    runtime
  );

  // Generate title
  const titleContext = description?.trim() || lyricsTopic?.trim() || '';
  const title = await generateDirectModeTitle(
    titleContext,
    sunoStyles,
    config.getModel,
    config.getOllamaEndpoint?.(),
    {
      trace: runtime?.trace,
      traceLabel: 'title.generate',
    }
  );

  // Generate lyrics if requested (pass enriched prompt for context)
  const lyricsResult = withLyrics
    ? await generateLyrics(enrichedPrompt, lyricsTopic, description || '')
    : { lyrics: undefined };

  return {
    text: enrichedPrompt,
    title,
    lyrics: lyricsResult.lyrics,
    debugTrace: undefined,
  };
}

/**
 * Check if Direct Mode should be used (when sunoStyles are selected).
 */
export function isDirectMode(sunoStyles: string[]): boolean {
  return sunoStyles.length > 0;
}
