/**
 * Prompt Formatters for Enrichment
 *
 * Contains functions for formatting enriched prompts in different modes.
 * Extracted from enrichment.ts for better separation of concerns.
 *
 * @module prompt/enrichment/formatters
 */

import type { EnrichmentResult } from './types';

/**
 * Build max mode prompt lines with enrichment.
 * Suno V5 styles go directly into genre field.
 *
 * @param sunoStyles - Raw Suno V5 styles (preserved exactly)
 * @param enrichment - Enrichment metadata
 * @returns Array of prompt lines for max mode
 */
export function buildMaxModeEnrichedLines(
  sunoStyles: string[],
  enrichment: EnrichmentResult
): string[] {
  const lines: string[] = [];

  // Max mode headers
  lines.push('[Is_MAX_MODE: MAX](MAX)');
  lines.push('[QUALITY: MAX](MAX)');
  lines.push('[REALISM: MAX](MAX)');
  lines.push('[REAL_INSTRUMENTS: MAX](MAX)');

  // Genre field: Suno V5 styles exactly as-is
  lines.push(`genre: "${sunoStyles.join(', ')}"`);

  // Enriched fields
  lines.push(`bpm: "${enrichment.bpmRange}"`);
  lines.push(`instruments: "${enrichment.instrumentsFormatted}"`);
  lines.push(`style tags: "${enrichment.styleTags.join(', ')}"`);
  lines.push(`recording: "${enrichment.production}"`);

  return lines;
}

/**
 * Build standard mode prompt lines with enrichment.
 * Suno V5 styles go directly into genre field.
 *
 * @param sunoStyles - Raw Suno V5 styles (preserved exactly)
 * @param enrichment - Enrichment metadata
 * @returns Array of prompt lines for standard mode
 */
export function buildStandardModeEnrichedLines(
  sunoStyles: string[],
  enrichment: EnrichmentResult
): string[] {
  const lines: string[] = [];
  const topMoods = enrichment.moods.slice(0, 2).join(', ');

  // Header line
  lines.push(`[${topMoods}, ${sunoStyles.join(', ')}]`);
  lines.push('');

  // Metadata
  lines.push(`Genre: ${sunoStyles.join(', ')}`);
  lines.push(`BPM: ${enrichment.bpmRange}`);
  lines.push(`Mood: ${enrichment.moods.join(', ')}`);
  lines.push(`Instruments: ${enrichment.instrumentsFormatted}`);
  lines.push(`Style Tags: ${enrichment.styleTags.join(', ')}`);
  lines.push(`Recording: ${enrichment.production}`);

  return lines;
}

/**
 * Build a complete enriched prompt for Suno V5 styles.
 * Preserves styles as-is in genre field, enriches everything else.
 *
 * @param sunoStyles - Array of Suno V5 style names
 * @param enrichment - Enrichment result
 * @param maxMode - Whether to use max mode format
 * @returns Complete prompt string
 */
export function buildEnrichedPromptString(
  sunoStyles: string[],
  enrichment: EnrichmentResult,
  maxMode: boolean
): string {
  const lines = maxMode
    ? buildMaxModeEnrichedLines(sunoStyles, enrichment)
    : buildStandardModeEnrichedLines(sunoStyles, enrichment);

  return lines.join('\n');
}
