/**
 * Generation Path: With Lyrics
 *
 * LLM-assisted generation when lyrics mode is ON.
 * Uses LLM for thematic context extraction, genre detection, title, and lyrics generation.
 * Prompt building remains deterministic but enriched with thematic context.
 * Supports Story Mode to generate narrative prose instead of structured prompts.
 *
 * @module ai/generation/paths/with-lyrics
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { extractStructuredDataForStory, tryStoryMode } from '@bun/ai/story-generator';
import { cleanLyrics, cleanTitle } from '@bun/ai/utils';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';

import {
  extractThematicContextIfAvailable,
  resolveGenreStrategy,
  logGenreResolution,
  logThematicContext,
  buildPromptForMode,
} from '../helpers';

import type { GenerateInitialOptions, TraceRuntime } from '../types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/** Run genre detection from topic if needed */
async function runGenreDetection(
  willDetectFromTopic: boolean,
  lyricsTopic: string | undefined,
  getModelFn: () => import('ai').LanguageModel,
  ollamaEndpoint: string | undefined,
  trace: TraceCollector | undefined
): Promise<Awaited<ReturnType<typeof detectGenreFromTopic>> | null> {
  if (!willDetectFromTopic || !lyricsTopic) {
    return null;
  }
  return detectGenreFromTopic(lyricsTopic.trim(), getModelFn, undefined, ollamaEndpoint, {
    trace,
    traceLabel: 'genre.detectFromTopic',
  });
}

/**
 * LLM-assisted generation path (lyrics mode ON).
 *
 * Uses LLM for thematic context extraction, genre detection (when no override),
 * title generation (to match lyrics theme), and lyrics generation.
 * Prompt building remains deterministic but enriched with thematic context.
 */
export async function generateWithLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  useOffline = false,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { description, lockedPhrase, lyricsTopic, genreOverride } = options;
  const rng = runtime?.rng ?? Math.random;
  const trace = runtime?.trace;
  const getModelFn = config.getModel;
  const ollamaEndpoint = useOffline ? config.getOllamaEndpoint() : undefined;

  // 1. Determine genre detection strategy (prioritizes description keywords over LLM topic detection)
  const { descriptionGenre, willDetectFromTopic } = resolveGenreStrategy(genreOverride, description, lyricsTopic, trace);

  // 2. Run thematic extraction and genre detection in parallel
  const [thematicContext, genreResult] = await Promise.all([
    extractThematicContextIfAvailable(description, config, trace),
    runGenreDetection(willDetectFromTopic, lyricsTopic, getModelFn, ollamaEndpoint, trace),
  ]);

  // Use genre in priority order: override > description keywords > LLM topic detection
  const resolvedGenreOverride = genreOverride ?? descriptionGenre ?? genreResult?.genre;
  logGenreResolution(descriptionGenre, genreResult?.genre, description, lyricsTopic, useOffline);
  logThematicContext(thematicContext);

  // 3. Build prompt deterministically with thematic context
  const promptText = buildPromptForMode(description, resolvedGenreOverride, lockedPhrase, config, rng, trace, thematicContext);
  const genre = extractGenreFromPrompt(promptText);
  const mood = extractMoodFromPrompt(promptText);

  // 4. Generate title and lyrics via LLM (parallel for performance)
  // Using Promise.all intentionally: if either fails, we want the whole operation to fail
  // since both title and lyrics are required for a complete generation result
  const topic = lyricsTopic?.trim() || description;
  const [titleResult, lyricsResult] = await Promise.all([
    generateTitle({
      description: topic,
      genre,
      mood,
      getModel: getModelFn,
      ollamaEndpoint,
      trace,
      traceLabel: 'title.generate',
    }),
    generateLyrics(topic, genre, mood, config.isMaxMode(), getModelFn, config.getUseSunoTags(), undefined, ollamaEndpoint, { trace, traceLabel: 'lyrics.generate' }),
  ]);

  const title = cleanTitle(titleResult.title);
  const lyrics = cleanLyrics(lyricsResult.lyrics);

  // 5. Try Story Mode if enabled (generates narrative prose instead of structured prompt)
  const storyInput = extractStructuredDataForStory(promptText, thematicContext, { description });
  const storyModeResult = await tryStoryMode({
    input: storyInput,
    title,
    lyrics: lyrics ?? '',
    fallbackText: promptText,
    config,
    trace,
    tracePrefix: 'generation.storyMode.withLyrics',
    logLabel: 'generateWithLyrics',
  });

  if (storyModeResult) {
    return storyModeResult;
  }

  // 6. Return deterministic prompt with lyrics (Story Mode disabled or unavailable)
  return {
    text: promptText,
    title,
    lyrics,
    debugTrace: undefined,
  };
}
