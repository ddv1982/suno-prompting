/**
 * AI Engine Utilities
 *
 * Shared utility functions used across AI generation modules.
 * Extracted to avoid duplication and ensure consistent behavior.
 *
 * @module ai/utils
 */

import { condense, condenseWithDedup, rewriteWithoutMeta } from '@bun/ai/llm-rewriter';
import { postProcessPrompt } from '@bun/prompt/postprocess';
import { APP_CONSTANTS } from '@shared/constants';

import type { LanguageModel } from 'ai';

// =============================================================================
// Text Cleaning Utilities
// =============================================================================

/**
 * Clean title by removing quotes and trimming whitespace.
 *
 * WHY: LLMs often wrap titles in quotes ("My Song" or 'My Song').
 * These quotes are formatting artifacts, not part of the actual title.
 * Stripping them ensures consistent display in the UI.
 */
export function cleanTitle(title: string | undefined, fallback = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

/**
 * Clean lyrics by trimming whitespace.
 *
 * WHY: LLMs may include leading/trailing whitespace in lyrics output.
 * Trimming ensures consistent formatting when displaying in the UI.
 * Returns undefined if empty to signal "no lyrics" vs "empty lyrics".
 */
export function cleanLyrics(lyrics: string | undefined): string | undefined {
  return lyrics?.trim() || undefined;
}

// =============================================================================
// Post-Processing
// =============================================================================

/**
 * Post-process generated text (condense, dedupe, remove meta).
 *
 * WHY: LLM output often needs cleanup before use:
 * - May exceed character limits (Suno has 1000 char max)
 * - May contain repeated phrases (LLM hallucination)
 * - May leak meta-instructions ("Here's your prompt:")
 *
 * This function applies all necessary transformations to ensure
 * the output is clean and within constraints.
 *
 * @param text - The raw text to post-process
 * @param getModel - Function to get the language model for LLM-based cleanup
 * @param ollamaEndpoint - Optional Ollama endpoint for local LLM mode
 */
export async function postProcess(
  text: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<string> {
  return postProcessPrompt(text, {
    maxChars: APP_CONSTANTS.MAX_PROMPT_CHARS,
    minChars: APP_CONSTANTS.MIN_PROMPT_CHARS,
    rewriteWithoutMeta: (t) => rewriteWithoutMeta(t, getModel, ollamaEndpoint),
    condense: (t) => condense(t, getModel, ollamaEndpoint),
    condenseWithDedup: (t, repeated) => condenseWithDedup(t, repeated, getModel, ollamaEndpoint),
  });
}
