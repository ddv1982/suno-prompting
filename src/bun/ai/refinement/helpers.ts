/**
 * Refinement Helper Utilities
 *
 * Pure utility functions used by refinement strategies and routing logic.
 * These are small, focused functions with no side effects beyond their return values.
 *
 * @module ai/refinement/helpers
 */

import { isDirectMode } from '@bun/ai/direct-mode';
import { extractStructuredDataForStory, tryStoryMode } from '@bun/ai/story-generator';

import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult, RefinementConfig } from '@bun/ai/types';

/**
 * Apply Story Mode transformation to refinement result if enabled.
 * Returns transformed result with narrative prose, or null to use original result.
 */
export async function applyStoryModeIfEnabled(
  result: GenerationResult,
  config: RefinementConfig,
  runtime?: TraceRuntime,
  description?: string
): Promise<GenerationResult | null> {
  // Story Mode methods may not exist on older config mocks - safely check
  const storyMode = config.isStoryMode?.() ?? false;
  const llmAvailable = config.isLLMAvailable?.() ?? false;

  if (!storyMode || !llmAvailable) {
    return null;
  }

  const storyInput = extractStructuredDataForStory(result.text, null, { description });

  return tryStoryMode({
    input: storyInput,
    title: result.title ?? 'Untitled',
    lyrics: result.lyrics,
    fallbackText: result.text,
    config,
    trace: runtime?.trace,
    tracePrefix: 'refinement.storyMode',
    logLabel: 'refinePrompt',
  });
}

export type LyricsAction = 'none' | 'refineExisting' | 'bootstrap';

export function getLyricsAction(isLyricsMode: boolean, currentLyrics?: string): LyricsAction {
  if (!isLyricsMode) return 'none';
  return currentLyrics ? 'refineExisting' : 'bootstrap';
}

export function getLyricsSeedInput(lyricsTopic: string | undefined, feedback: string): string {
  return lyricsTopic?.trim() || feedback.trim() || 'Untitled';
}

export function getOptionalLyricsTopic(lyricsTopic: string | undefined): string | undefined {
  const topic = lyricsTopic?.trim();
  return topic ? topic : undefined;
}

export function isDirectModeRefinement(sunoStyles: string[] | undefined): sunoStyles is string[] {
  if (!sunoStyles || sunoStyles.length === 0) return false;
  return isDirectMode(sunoStyles);
}
