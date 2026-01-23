/**
 * Genre Strategy Resolution Helper
 *
 * Handles priority-based genre detection and related logging.
 *
 * @module ai/generation/helpers/genre-strategy
 */

import { createLogger } from '@bun/logger';
import { detectGenreKeywordsOnly } from '@bun/prompt/deterministic';
import { traceDecision } from '@bun/trace';

import { MAX_LOG_DESCRIPTION_LENGTH } from '../constants';

import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

const log = createLogger('Generation');

/** Result of genre strategy resolution */
export interface GenreStrategyResult {
  /** Genre detected from description keywords, or null */
  descriptionGenre: string | null;
  /** Whether to detect genre from lyrics topic via LLM */
  willDetectFromTopic: boolean;
  /** Branch taken for tracing */
  branchTaken: string;
}

/**
 * Determines genre detection strategy with priority:
 * 1. genreOverride (user explicit selection)
 * 2. Description keyword detection (e.g., "rock" in description)
 * 3. LLM detection from lyricsTopic (fallback)
 * 4. Deterministic (no topic provided)
 */
export function resolveGenreStrategy(
  genreOverride: string | undefined,
  description: string,
  lyricsTopic: string | undefined,
  trace: TraceCollector | undefined
): GenreStrategyResult {
  // Priority 1: Explicit genre override
  if (genreOverride) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'generation.genre.source',
      branchTaken: 'override',
      why: `Using provided genre override: "${genreOverride}"`,
    });
    return { descriptionGenre: null, willDetectFromTopic: false, branchTaken: 'override' };
  }

  // Priority 2: Detect genre keywords from description
  const descriptionGenre = detectGenreKeywordsOnly(description);
  if (descriptionGenre) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'generation.genre.source',
      branchTaken: 'description.keywords',
      why: `Detected genre "${descriptionGenre}" from description keywords`,
    });
    return { descriptionGenre, willDetectFromTopic: false, branchTaken: 'description.keywords' };
  }

  // Priority 3: LLM detection from lyrics topic (if available)
  const hasLyricsTopic = !!lyricsTopic?.trim();
  if (hasLyricsTopic) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'generation.genre.source',
      branchTaken: 'llm.detect',
      why: `No genre keywords in description; detecting from lyrics topic via LLM`,
    });
    return { descriptionGenre: null, willDetectFromTopic: true, branchTaken: 'llm.detect' };
  }

  // Priority 4: Deterministic fallback
  traceDecision(trace, {
    domain: 'genre',
    key: 'generation.genre.source',
    branchTaken: 'deterministic',
    why: `No genre override, no keywords in description, no topic; using deterministic genre detection`,
  });
  return { descriptionGenre: null, willDetectFromTopic: false, branchTaken: 'deterministic' };
}

/** Logs genre resolution result */
export function logGenreResolution(
  descriptionGenre: string | null,
  topicGenre: string | undefined,
  description: string,
  lyricsTopic: string | undefined,
  useOffline: boolean
): void {
  if (descriptionGenre) {
    const truncatedDescription = description.length > MAX_LOG_DESCRIPTION_LENGTH
      ? `${description.slice(0, MAX_LOG_DESCRIPTION_LENGTH)}...`
      : description;
    log.info('generateWithLyrics:genreFromDescription', { description: truncatedDescription, detectedGenre: descriptionGenre });
  } else if (topicGenre) {
    log.info('generateWithLyrics:genreFromTopic', { lyricsTopic, detectedGenre: topicGenre, offline: useOffline });
  }
}

/** Logs thematic context if present */
export function logThematicContext(thematicContext: ThematicContext | null): void {
  if (thematicContext) {
    log.info('generateWithLyrics:thematicContext', {
      themes: thematicContext.themes.length,
      moods: thematicContext.moods.length,
      hasScene: !!thematicContext.scene,
    });
  }
}
