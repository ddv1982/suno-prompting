/**
 * Generation Path: Without Lyrics
 *
 * Hybrid LLM + deterministic generation when lyrics mode is OFF.
 * Uses LLM for thematic context extraction when available, falls back to pure deterministic.
 * Supports Story Mode for narrative prose output.
 *
 * Performance budget: ~550ms total (500ms LLM + 40ms deterministic + 5ms merge)
 * Fallback latency: ~40ms (no regression from pure deterministic)
 * Story Mode: +8s max for narrative generation
 *
 * @module ai/generation/paths/without-lyrics
 */

import { generateTitle } from '@bun/ai/content-generator';
import { extractThematicContextIfAvailable } from '@bun/ai/generation/helpers';
import { extractStructuredDataForStory, tryStoryMode } from '@bun/ai/story-generator';
import { cleanTitle } from '@bun/ai/utils';
import { createLogger } from '@bun/logger';
import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
  extractGenreFromPrompt,
  extractMoodFromPrompt,
} from '@bun/prompt/deterministic';
import { injectLockedPhrase } from '@bun/prompt/postprocess';
import { generateDeterministicTitle } from '@bun/prompt/title';
import { traceDecision } from '@bun/trace';


import type { GenerateInitialOptions, TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';

const log = createLogger('Generation');

/**
 * Generation path for lyrics mode OFF.
 *
 * Uses hybrid LLM + deterministic architecture:
 * - Thematic context extraction runs in parallel with deterministic prompt building
 * - If LLM available, extracts themes/moods/scene to enrich deterministic output
 * - Falls back to pure deterministic when LLM unavailable or extraction fails
 */
export async function generateWithoutLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { description, lockedPhrase, genreOverride } = options;
  const rng = runtime?.rng ?? Math.random;
  const trace = runtime?.trace;

  // 1. Run thematic extraction and deterministic prompt building in parallel
  //    Thematic extraction returns null if LLM unavailable or fails (graceful fallback)
  const [thematicContext, deterministicBaseResult] = await Promise.all([
    extractThematicContextIfAvailable(description, config, trace),
    Promise.resolve(
      config.isMaxMode()
        ? buildDeterministicMaxPrompt({ description, genreOverride, rng, trace })
        : buildDeterministicStandardPrompt({ description, genreOverride, rng, trace })
    ),
  ]);

  // 2. If thematic context available, rebuild with merged context
  //    Otherwise use pure deterministic result
  let deterministicResult = deterministicBaseResult;
  if (thematicContext) {
    log.info('generateWithoutLyrics:hybridMerge', {
      themes: thematicContext.themes.length,
      moods: thematicContext.moods.length,
      hasScene: !!thematicContext.scene,
    });

    traceDecision(trace, {
      domain: 'other',
      key: 'generation.hybrid.merge',
      branchTaken: 'thematic-merge',
      why: `Merging thematic context: moods=${thematicContext.moods.join(',')}; themes=${thematicContext.themes.slice(0, 2).join(',')}`,
    });

    // Rebuild with thematic context for merge
    deterministicResult = config.isMaxMode()
      ? buildDeterministicMaxPrompt({ description, genreOverride, rng, trace, thematicContext })
      : buildDeterministicStandardPrompt({ description, genreOverride, rng, trace, thematicContext });
  } else {
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.hybrid.merge',
      branchTaken: 'pure-deterministic',
      why: 'No thematic context available; using pure deterministic output',
    });
  }

  let promptText = deterministicResult.text;

  // 3. Inject locked phrase if provided
  if (lockedPhrase) {
    promptText = injectLockedPhrase(promptText, lockedPhrase);
  }

  // 4. Extract genre/mood for title generation
  const genre = extractGenreFromPrompt(promptText);
  const mood = extractMoodFromPrompt(promptText);

  // 5. Generate title - use LLM when available for more creative titles
  let title: string;
  if (config.isLLMAvailable()) {
    log.info('generateWithoutLyrics:llmTitle', { genre, mood, hasDescription: !!description, useLocalLLM: config.isUseLocalLLM() });
    const titleResult = await generateTitle({
      description: description || `${mood} ${genre} song`,
      genre,
      mood,
      getModel: config.getModel,
      ollamaEndpoint: config.getOllamaEndpointIfLocal(),
      trace,
      traceLabel: 'title.generate',
    });
    title = titleResult.title;
  } else {
    title = generateDeterministicTitle(genre, mood, rng, description);
  }

  // 6. Story Mode: Transform to narrative prose if enabled and LLM available
  const storyInput = extractStructuredDataForStory(promptText, thematicContext, {
    description,
    sunoStyles: options.sunoStyles,
  });
  const storyModeResult = await tryStoryMode({
    input: storyInput,
    title: cleanTitle(title),
    fallbackText: promptText,
    config,
    trace,
    tracePrefix: 'generation.storyMode',
    logLabel: 'generateWithoutLyrics',
  });

  if (storyModeResult) {
    return storyModeResult;
  }

  return {
    text: promptText,
    title: cleanTitle(title),
    debugTrace: undefined,
  };
}
