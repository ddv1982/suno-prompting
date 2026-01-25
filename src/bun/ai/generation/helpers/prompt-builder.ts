/**
 * Prompt Builder Helper
 *
 * Mode-aware prompt construction with locked phrase injection.
 *
 * @module ai/generation/helpers/prompt-builder
 */

import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
} from '@bun/prompt/deterministic';
import { injectLockedPhrase } from '@bun/prompt/postprocess';

import type { GenerationConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

/** Builds prompt deterministically based on mode, with optional thematic context */
export function buildPromptForMode(
  description: string,
  genreOverride: string | undefined,
  lockedPhrase: string | undefined,
  config: GenerationConfig,
  rng: () => number,
  trace: TraceCollector | undefined,
  thematicContext?: ThematicContext | null
): string {
  const deterministicResult = config.isMaxMode()
    ? buildDeterministicMaxPrompt({ description, genreOverride, rng, trace, thematicContext: thematicContext ?? undefined })
    : buildDeterministicStandardPrompt({ description, genreOverride, rng, trace, thematicContext: thematicContext ?? undefined });

  let promptText = deterministicResult.text;
  if (lockedPhrase) {
    promptText = injectLockedPhrase(promptText, lockedPhrase);
  }
  return promptText;
}
