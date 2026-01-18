/**
 * Thematic Context Extraction Module
 *
 * Extracts themes, moods, and scene phrases from user descriptions using LLM.
 * Part of the hybrid LLM + deterministic architecture for song context preservation.
 *
 * @module ai/thematic-context
 */

import { generateText } from 'ai';

import { generateWithOllama } from '@bun/ai/ollama-client';
import { createLogger } from '@bun/logger';
import { traceDecision, traceError } from '@bun/trace';
import { ThematicContextSchema } from '@shared/schemas/thematic-context';

import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';
import type { LanguageModel } from 'ai';

const log = createLogger('ThematicContext');

/** Minimum description length for extraction (chars) */
const MIN_DESCRIPTION_LENGTH = 10;

/**
 * System prompt for thematic context extraction.
 * Designed to return only valid JSON without markdown formatting.
 */
const THEMATIC_EXTRACTION_SYSTEM_PROMPT = `You extract thematic context from song descriptions for music generation.

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "themes": ["word1", "word2", "word3"],
  "moods": ["mood1", "mood2"],
  "scene": "5-10 word scene phrase..."
}

Rules:
- themes: exactly 3 single words, most distinctive/unique aspects
- moods: 2-3 words describing emotional tone (not genre descriptors)
- scene: short evocative phrase (5-10 words) setting the scene
- No markdown formatting, just raw JSON`;

/**
 * Options for extracting thematic context from a description.
 */
export interface ExtractThematicContextOptions {
  /** User's song description */
  readonly description: string;
  /** Function to get the language model */
  readonly getModel: () => LanguageModel;
  /** Optional Ollama endpoint for offline mode */
  readonly ollamaEndpoint?: string;
  /** Optional trace collector */
  readonly trace?: TraceCollector;
}

/**
 * Builds the user prompt for thematic extraction.
 */
function buildUserPrompt(description: string): string {
  return `Extract thematic context from this song description:\n\n"${description}"`;
}

/**
 * Parses and validates the LLM response as ThematicContext.
 * Returns null if parsing or validation fails.
 */
function parseThematicResponse(rawResponse: string): ThematicContext | null {
  try {
    const parsed: unknown = JSON.parse(rawResponse);
    const validated = ThematicContextSchema.parse(parsed);
    return validated;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    log.warn('parseThematicResponse:failed', { error: message });
    return null;
  }
}

/**
 * Extracts thematic context from a description using Ollama.
 * Note: Ollama client has its own timeout handling.
 */
async function extractWithOllama(
  ollamaEndpoint: string,
  userPrompt: string
): Promise<string> {
  log.info('extractThematicContext:ollama', { endpoint: ollamaEndpoint });
  return generateWithOllama(
    ollamaEndpoint,
    THEMATIC_EXTRACTION_SYSTEM_PROMPT,
    userPrompt
  );
}

/**
 * Extracts thematic context from a description using cloud provider.
 * Timeout is handled by the caller via Promise.race pattern.
 */
async function extractWithCloud(
  getModel: () => LanguageModel,
  userPrompt: string
): Promise<string> {
  log.info('extractThematicContext:cloud');

  const { text } = await generateText({
    model: getModel(),
    system: THEMATIC_EXTRACTION_SYSTEM_PROMPT,
    prompt: userPrompt,
    maxRetries: 0, // No retries - caller handles timeout via Promise.race
  });

  return text;
}

/**
 * Extracts thematic context (themes, moods, scene) from a description using LLM.
 *
 * Returns null if:
 * - Description is empty or too short (<10 chars)
 * - LLM returns invalid/malformed response
 *
 * Note: Timeout is handled by the caller via Promise.race pattern in generation.ts.
 * This function does not have its own timeout - it will complete when the LLM responds.
 *
 * @param options - Extraction options
 * @returns ThematicContext or null if extraction fails
 *
 * @example
 * ```typescript
 * const context = await extractThematicContext({
 *   description: 'exploring an alien jungle with bioluminescent plants',
 *   getModel: () => groq('llama-3.1-8b-instant'),
 * });
 * // Returns: { themes: ['alien', 'bioluminescent', 'discovery'], moods: ['wondrous', 'curious'], scene: 'first steps into an alien jungle...' }
 * ```
 */
export async function extractThematicContext(
  options: ExtractThematicContextOptions
): Promise<ThematicContext | null> {
  const { description, getModel, ollamaEndpoint, trace } = options;

  // Early return for empty or short descriptions
  const trimmed = description?.trim();
  if (!trimmed || trimmed.length < MIN_DESCRIPTION_LENGTH) {
    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.skip',
      branchTaken: 'description-too-short',
      why: `Description length ${trimmed?.length ?? 0} < ${MIN_DESCRIPTION_LENGTH}, skipping extraction`,
    });
    return null;
  }

  const userPrompt = buildUserPrompt(trimmed);

  try {
    let rawResponse: string;

    if (ollamaEndpoint) {
      rawResponse = await extractWithOllama(ollamaEndpoint, userPrompt);
    } else {
      rawResponse = await extractWithCloud(getModel, userPrompt);
    }

    // Parse and validate JSON response
    const validated = parseThematicResponse(rawResponse);

    if (!validated) {
      traceDecision(trace, {
        domain: 'other',
        key: 'thematic.extraction.fallback',
        branchTaken: 'malformed-json',
        why: 'LLM returned malformed JSON, falling back to deterministic',
      });
      return null;
    }

    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.success',
      branchTaken: 'llm-extracted',
      why: `Extracted ${validated.themes.length} themes, ${validated.moods.length} moods`,
      selection: {
        method: 'index',
        chosenIndex: 0,
        candidates: validated.themes,
      },
    });

    log.info('extractThematicContext:success', {
      themes: validated.themes,
      moodsCount: validated.moods.length,
    });

    return validated;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.warn('extractThematicContext:failed', { error: message });

    traceError(trace, error);
    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.fallback',
      branchTaken: 'extraction-failed',
      why: `Extraction failed: ${message}`,
    });

    return null;
  }
}
