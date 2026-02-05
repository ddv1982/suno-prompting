/**
 * Thematic Context Extraction Helper
 *
 * Handles LLM-based extraction of themes, moods, and scene from descriptions.
 * Falls back gracefully when LLM is unavailable or extraction fails,
 * using keyword-based deterministic extraction as a fallback.
 *
 * @module ai/generation/helpers/thematic-context
 */

import { THEMATIC_EXTRACTION_TIMEOUT_MS } from '@bun/ai/generation/constants';
import { extractThematicContext } from '@bun/ai/thematic-context';
import { extractAllKeywords, hasKeywords } from '@bun/keywords';
import { createLogger } from '@bun/logger';
import { traceDecision } from '@bun/trace';
import { getErrorMessage } from '@shared/errors';

import type { GenerationConfig } from '@bun/ai/types';
import type { KeywordExtractionResult } from '@bun/keywords';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

const log = createLogger('Generation');

/** Maximum length for scene phrase in fallback */
const MAX_SCENE_LENGTH = 50;

/**
 * Extract themes from keyword extraction result.
 *
 * @param extraction - Result from extractAllKeywords
 * @returns Array of exactly 3 theme strings
 */
function getThemesFromExtraction(extraction: KeywordExtractionResult): [string, string, string] {
  const themes = extraction.themes.slice(0, 3);

  // Return with graceful defaults
  const theme1 = themes[0] ?? 'evocative';
  const theme2 = themes[1] ?? 'expressive';
  const theme3 = themes[2] ?? 'atmospheric';

  return [theme1, theme2, theme3];
}

/**
 * Extract moods from keyword extraction result.
 *
 * @param extraction - Result from extractAllKeywords
 * @returns Array of 2 mood strings
 */
function getMoodsFromExtraction(extraction: KeywordExtractionResult): [string, string] {
  const moods = extraction.moods.slice(0, 2);

  // Default moods if none found
  const mood1 = moods[0] ?? 'expressive';
  const mood2 = moods[1] ?? 'dynamic';

  return [mood1, mood2];
}

/**
 * Create a minimal scene from the description.
 * Takes the first portion of the description as a scene phrase.
 *
 * @param description - User's song description
 * @returns Scene string (10-50 chars)
 */
function createMinimalScene(description: string): string {
  const trimmed = description.trim();

  if (trimmed.length <= MAX_SCENE_LENGTH) {
    // Pad short descriptions to meet minimum 10 chars
    return trimmed.length >= 10 ? trimmed : `${trimmed} music scene`;
  }

  // Truncate at word boundary
  const truncated = trimmed.slice(0, MAX_SCENE_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 20) {
    return truncated.slice(0, lastSpace);
  }

  return truncated;
}

/**
 * Build a fallback ThematicContext using unified keyword extraction.
 * Performs a single extraction pass and uses all results.
 *
 * @param description - User's song description
 * @param trace - Optional trace collector
 * @returns ThematicContext with fallback enrichment
 */
function buildFallbackThematicContext(
  description: string,
  trace?: TraceCollector
): ThematicContext {
  // Single extraction pass - no duplicate calls!
  const extraction = extractAllKeywords(description);

  const themes = getThemesFromExtraction(extraction);
  const moods = getMoodsFromExtraction(extraction);
  const scene = createMinimalScene(description);

  // Build enrichment summary for tracing
  const enrichmentParts: string[] = [];
  if (extraction.era) enrichmentParts.push(`era=${extraction.era}`);
  if (extraction.tempo)
    enrichmentParts.push(
      `tempo=${extraction.tempo.adjustment > 0 ? '+' : ''}${extraction.tempo.adjustment}`
    );
  if (extraction.intent) enrichmentParts.push(`intent=${extraction.intent}`);

  traceDecision(trace, {
    domain: 'other',
    key: 'generation.thematic.fallback',
    branchTaken: 'keyword-fallback',
    why: `Using keyword-based fallback: ${enrichmentParts.join(', ') || 'no keywords matched'}`,
  });

  log.info('buildFallbackThematicContext:result', {
    themes,
    era: extraction.era,
    intent: extraction.intent,
  });

  // Note: intent extraction is included in enrichment results
  return {
    themes,
    moods,
    scene,
    ...(extraction.era && { era: extraction.era }),
    ...(extraction.tempo && { tempo: extraction.tempo }),
  };
}

/** Extract optional thematic field values for summary */
function getOptionalFieldValues(ctx: ThematicContext): string[] {
  type FieldExtractor = () => string | undefined;
  const extractors: FieldExtractor[] = [
    () => (ctx.era ? `era=${ctx.era}` : undefined),
    () => (ctx.intent ? `intent=${ctx.intent}` : undefined),
    () => (ctx.spatialHint?.space ? `spatial=${ctx.spatialHint.space}` : undefined),
    () => (ctx.energyLevel ? `energy=${ctx.energyLevel}` : undefined),
    () => (ctx.vocalCharacter?.style ? `vocal=${ctx.vocalCharacter.style}` : undefined),
    () => (ctx.narrativeArc?.length ? `arc=${ctx.narrativeArc.length.toString()}pts` : undefined),
    () =>
      ctx.musicalReference?.style?.length
        ? `refStyle=${ctx.musicalReference.style.join(',')}`
        : undefined,
    () => (ctx.culturalContext?.region ? `culture=${ctx.culturalContext.region}` : undefined),
    () =>
      ctx.tempo?.adjustment
        ? `tempo=${ctx.tempo.adjustment > 0 ? '+' : ''}${ctx.tempo.adjustment.toString()}`
        : undefined,
  ];
  return extractors.map((fn) => fn()).filter((v): v is string => Boolean(v));
}

/**
 * Build detailed summary of extracted thematic fields for tracing.
 */
function buildThematicSummary(ctx: ThematicContext): string {
  const parts: string[] = [
    `themes=${ctx.themes.join(',')}`,
    `moods=${ctx.moods.join(',')}`,
    ...getOptionalFieldValues(ctx),
  ];
  return parts.join('; ');
}

/**
 * Handle successful LLM extraction result.
 */
function handleLLMSuccess(
  thematicContext: ThematicContext,
  trace?: TraceCollector
): ThematicContext {
  const summary = buildThematicSummary(thematicContext);
  traceDecision(trace, {
    domain: 'other',
    key: 'generation.thematic.result',
    branchTaken: 'llm-extracted',
    why: `Extracted: ${summary}`,
    selection: { method: 'index', chosenIndex: 0, candidates: thematicContext.themes },
  });
  return thematicContext;
}

/**
 * Handle LLM returning null - attempt keyword fallback.
 */
function handleLLMNull(description: string, trace?: TraceCollector): ThematicContext | null {
  log.info('extractThematicContextIfAvailable:llmNull', {
    reason: 'LLM returned null, trying keyword fallback',
  });

  if (hasKeywords(description)) {
    return buildFallbackThematicContext(description, trace);
  }

  traceDecision(trace, {
    domain: 'other',
    key: 'generation.thematic.fallback',
    branchTaken: 'no-fallback-keywords',
    why: 'LLM returned null and no fallback keywords found; using pure deterministic',
  });
  return null;
}

/**
 * Handle LLM extraction error - attempt keyword fallback.
 */
function handleLLMError(
  description: string,
  error: unknown,
  trace?: TraceCollector
): ThematicContext | null {
  const message = getErrorMessage(error);
  const isAbort = error instanceof Error && error.name === 'AbortError';

  if (isAbort) {
    log.info('extractThematicContextIfAvailable:timeout', {
      timeoutMs: THEMATIC_EXTRACTION_TIMEOUT_MS,
    });
  } else {
    log.warn('extractThematicContextIfAvailable:failed', { error: message });
  }

  if (hasKeywords(description)) {
    const errorType = isAbort ? 'timeout' : 'extraction-error';
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.thematic.fallback',
      branchTaken: `${errorType}-with-keyword-fallback`,
      why: isAbort
        ? `Thematic extraction timed out after ${THEMATIC_EXTRACTION_TIMEOUT_MS}ms; using keyword fallback`
        : `Thematic extraction failed: ${message}; using keyword fallback`,
    });
    return buildFallbackThematicContext(description, trace);
  }

  traceDecision(trace, {
    domain: 'other',
    key: 'generation.thematic.fallback',
    branchTaken: isAbort ? 'timeout' : 'extraction-error',
    why: isAbort
      ? `Thematic extraction timed out after ${THEMATIC_EXTRACTION_TIMEOUT_MS}ms; no fallback keywords; using pure deterministic`
      : `Thematic extraction failed: ${message}; no fallback keywords; using pure deterministic`,
  });
  return null;
}

/**
 * Attempts to extract thematic context from description using LLM.
 * Falls back to keyword-based extraction if LLM is unavailable or fails.
 *
 * Uses AbortController for proper timeout cancellation - when timeout fires,
 * the LLM request is actually aborted (not just ignored) to save resources.
 *
 * Fallback behavior:
 * - LLM unavailable: Uses keyword fallback if description has keywords
 * - LLM returns null: Uses keyword fallback
 * - LLM times out: Uses keyword fallback
 * - LLM throws: Uses keyword fallback
 *
 * @param description - User's song description
 * @param config - Generation configuration with LLM availability
 * @param trace - Optional trace collector for debugging
 * @returns ThematicContext or null if no context can be extracted
 */
export async function extractThematicContextIfAvailable(
  description: string | undefined,
  config: GenerationConfig,
  trace?: TraceCollector
): Promise<ThematicContext | null> {
  // Skip if no description
  if (!description?.trim()) {
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.thematic.skip',
      branchTaken: 'no-description',
      why: 'No description provided; skipping thematic extraction',
    });
    return null;
  }

  const trimmedDescription = description.trim();

  // If LLM is not available, try keyword fallback immediately
  if (!config.isLLMAvailable()) {
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.thematic.skip',
      branchTaken: 'llm-unavailable',
      why: 'LLM unavailable; attempting keyword-based fallback',
    });
    return hasKeywords(trimmedDescription)
      ? buildFallbackThematicContext(trimmedDescription, trace)
      : null;
  }

  // Use AbortController for proper timeout cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, THEMATIC_EXTRACTION_TIMEOUT_MS);

  try {
    const thematicContext = await extractThematicContext({
      description: trimmedDescription,
      getModel: config.getModel,
      ollamaEndpoint: config.getOllamaEndpointIfLocal(),
      trace,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (thematicContext) {
      return handleLLMSuccess(thematicContext, trace);
    }
    return handleLLMNull(trimmedDescription, trace);
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    return handleLLMError(trimmedDescription, error, trace);
  }
}
