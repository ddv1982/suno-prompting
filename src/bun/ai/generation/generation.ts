/**
 * Initial Prompt Generation Module
 *
 * Handles initial prompt generation with three distinct paths:
 * - Lyrics OFF path: Deterministic prompt, LLM title when available (fallback to deterministic)
 * - Lyrics ON (cloud): Genre detection, title, and lyrics via cloud LLM
 * - Lyrics ON (offline): Same as cloud but using local Ollama
 *
 * Direct Mode (Suno V5 styles) is handled by direct-mode-generation.ts
 *
 * @module ai/generation/generation
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { extractThematicContext } from '@bun/ai/thematic-context';
import { cleanLyrics, cleanTitle } from '@bun/ai/utils';
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
import { APP_CONSTANTS } from '@shared/constants';
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import { generateDirectMode } from './direct-mode-generation';

import type { GenerateInitialOptions } from './types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

const log = createLogger('Generation');

interface TraceRuntime {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
}

/** Maximum time to wait for thematic extraction before falling back to deterministic */
const THEMATIC_EXTRACTION_TIMEOUT_MS = APP_CONSTANTS.AI.THEMATIC_EXTRACTION_TIMEOUT_MS;

/**
 * Attempts to extract thematic context from description using LLM.
 * Returns null if LLM unavailable or extraction fails (graceful fallback).
 *
 * Uses AbortController for proper timeout cancellation - when timeout fires,
 * the LLM request is actually aborted (not just ignored) to save resources.
 */
async function extractThematicContextIfAvailable(
  description: string | undefined,
  config: GenerationConfig,
  trace?: TraceCollector
): Promise<ThematicContext | null> {
  // Skip if no LLM available or no description
  if (!config.isLLMAvailable() || !description?.trim()) {
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.thematic.skip',
      branchTaken: !config.isLLMAvailable() ? 'llm-unavailable' : 'no-description',
      why: !config.isLLMAvailable()
        ? 'LLM unavailable; skipping thematic extraction'
        : 'No description provided; skipping thematic extraction',
    });
    return null;
  }

  // Use AbortController for proper timeout cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, THEMATIC_EXTRACTION_TIMEOUT_MS);

  try {
    const thematicContext = await extractThematicContext({
      description,
      getModel: config.getModel,
      ollamaEndpoint: config.getOllamaEndpointIfLocal(),
      trace,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (thematicContext) {
      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.result',
        branchTaken: 'extracted',
        why: `Thematic context extracted: ${thematicContext.themes.length} themes, ${thematicContext.moods.length} moods`,
        selection: {
          method: 'index',
          chosenIndex: 0,
          candidates: thematicContext.themes,
        },
      });
    }

    return thematicContext;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Log but don't throw - graceful fallback to deterministic
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAbort = error instanceof Error && error.name === 'AbortError';

    if (isAbort) {
      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.fallback',
        branchTaken: 'timeout',
        why: `Thematic extraction timed out after ${THEMATIC_EXTRACTION_TIMEOUT_MS}ms; using pure deterministic`,
      });
    } else {
      log.warn('extractThematicContextIfAvailable:failed', { error: message });

      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.fallback',
        branchTaken: 'extraction-error',
        why: `Thematic extraction failed: ${message}; using pure deterministic`,
      });
    }

    return null;
  }
}

/**
 * Generation path for lyrics mode OFF.
 *
 * Uses hybrid LLM + deterministic architecture:
 * - Thematic context extraction runs in parallel with deterministic prompt building
 * - If LLM available, extracts themes/moods/scene to enrich deterministic output
 * - Falls back to pure deterministic when LLM unavailable or extraction fails
 *
 * Performance budget: ~550ms total (500ms LLM + 40ms deterministic + 5ms merge)
 * Fallback latency: ~40ms (no regression from pure deterministic)
 */
async function generateInitialWithoutLyrics(
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
    log.info('generateInitialWithoutLyrics:hybridMerge', {
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
    promptText = injectLockedPhrase(promptText, lockedPhrase, config.isMaxMode());
  }

  // 4. Extract genre/mood for title generation
  const genre = extractGenreFromPrompt(promptText);
  const mood = extractMoodFromPrompt(promptText);

  // 5. Generate title - use LLM when available for more creative titles
  let title: string;
  if (config.isLLMAvailable()) {
    log.info('generateInitialWithoutLyrics:llmTitle', { genre, mood, hasDescription: !!description, useLocalLLM: config.isUseLocalLLM() });
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

  return {
    text: promptText,
    title: cleanTitle(title),
    debugTrace: undefined,
  };
}

/** Determines genre detection strategy and traces the decision */
function resolveGenreStrategy(
  genreOverride: string | undefined,
  lyricsTopic: string | undefined,
  trace: TraceCollector | undefined
): { willDetectGenre: boolean; branchTaken: string } {
  const hasLyricsTopic = !!lyricsTopic?.trim();
  const willDetectGenre = !genreOverride && hasLyricsTopic;
  const branchTaken = genreOverride ? 'override' : (willDetectGenre ? 'llm.detect' : 'deterministic');

  traceDecision(trace, {
    domain: 'genre',
    key: 'generation.genre.source',
    branchTaken,
    why: genreOverride
      ? `Using provided genre override: "${genreOverride}"`
      : (willDetectGenre ? `Detecting genre from lyrics topic via LLM` : `No topic provided, using deterministic genre detection`),
  });

  return { willDetectGenre, branchTaken };
}

/** Builds prompt deterministically based on mode, with optional thematic context */
function buildPromptForMode(
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
    promptText = injectLockedPhrase(promptText, lockedPhrase, config.isMaxMode());
  }
  return promptText;
}

/**
 * LLM-assisted generation path (lyrics mode ON).
 *
 * Uses LLM for thematic context extraction, genre detection (when no override),
 * title generation (to match lyrics theme), and lyrics generation.
 * Prompt building remains deterministic but enriched with thematic context.
 */
async function generateInitialWithLyrics(
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

  // 1. Determine genre detection strategy
  const { willDetectGenre } = resolveGenreStrategy(genreOverride, lyricsTopic, trace);

  // 2. Run thematic extraction and genre detection in parallel
  const [thematicContext, genreResult] = await Promise.all([
    extractThematicContextIfAvailable(description, config, trace),
    willDetectGenre && lyricsTopic
      ? detectGenreFromTopic(lyricsTopic.trim(), getModelFn, undefined, ollamaEndpoint, {
          trace,
          traceLabel: 'genre.detectFromTopic',
        })
      : Promise.resolve(null),
  ]);

  // Use detected genre or override
  const resolvedGenreOverride = genreResult?.genre ?? genreOverride;
  if (genreResult?.genre) {
    log.info('generateInitialWithLyrics:genreFromTopic', { lyricsTopic, detectedGenre: genreResult.genre, offline: useOffline });
  }

  // Log thematic context if extracted
  if (thematicContext) {
    log.info('generateInitialWithLyrics:thematicContext', {
      themes: thematicContext.themes.length,
      moods: thematicContext.moods.length,
      hasScene: !!thematicContext.scene,
    });
  }

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

  return {
    text: promptText,
    title: cleanTitle(titleResult.title),
    lyrics: cleanLyrics(lyricsResult.lyrics),
    debugTrace: undefined,
  };
}

/**
 * Offline generation path using Ollama local LLM.
 *
 * Pre-flight checks Ollama availability before delegating to the
 * standard LLM-assisted generation with the Ollama model.
 *
 * @throws {OllamaUnavailableError} When Ollama server is not running
 * @throws {OllamaModelMissingError} When Gemma 3 4B model is not installed
 */
async function generateInitialWithOfflineLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  // Pre-flight check: Verify Ollama is available
  const endpoint = config.getOllamaEndpoint();
  const status = await checkOllamaAvailable(endpoint);

  if (!status.available) {
    throw new OllamaUnavailableError(endpoint);
  }

  if (!status.hasGemma) {
    throw new OllamaModelMissingError('gemma3:4b');
  }

  log.info('generateInitialWithOfflineLyrics:start', { endpoint });

  // Delegate to standard generation with offline flag
  return generateInitialWithLyrics(options, config, true, runtime);
}

/**
 * Generate initial prompt.
 *
 * Branches based on Direct Mode, lyrics, and offline mode:
 * - Direct Mode (sunoStyles provided): Uses Suno V5 styles as-is with enrichment
 * - Lyrics OFF: Fully deterministic path (<50ms, no LLM calls)
 * - Lyrics ON + Offline: Ollama-assisted path (local Gemma 3 4B)
 * - Lyrics ON + Cloud: LLM-assisted path (genre detection, title, lyrics generation)
 *
 * @param options - Options for generating initial prompt
 * @param config - Configuration with dependencies
 * @returns Generated prompt, title, and optionally lyrics
 */
export async function generateInitial(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  // Direct Mode: Use sunoStyles as-is (bypasses deterministic genre logic)
  if (options.sunoStyles && options.sunoStyles.length > 0) {
    return generateDirectMode(options, config, runtime);
  }

  if (!config.isLyricsMode()) {
    return generateInitialWithoutLyrics(options, config, runtime);
  }

  // Use offline generation with Ollama when offline mode is enabled
  if (config.isUseLocalLLM()) {
    return generateInitialWithOfflineLyrics(options, config, runtime);
  }

  return generateInitialWithLyrics(options, config, false, runtime);
}

// Re-export types for convenience
export type { GenerateInitialOptions } from './types';
