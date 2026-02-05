/**
 * Shared helper functions for prompt builders
 * @module prompt/builders/shared
 */

import {
  detectRhythmic,
  getRhythmicGuidance,
  extractInstruments,
  buildGuidanceFromSelection,
  getMultiGenreNuanceGuidance,
} from '@bun/instruments';
import { buildPerformanceGuidance, parseGenreComponents } from '@bun/prompt/genre-parser';

import type { ModeSelection } from '@bun/instruments/selection';

type RhythmicInfo = ReturnType<typeof detectRhythmic>;
type PerformanceGuidanceType = NonNullable<ReturnType<typeof buildPerformanceGuidance>>;

/**
 * Builds song concept parts for LLM prompts.
 * Includes user description and optional lyrics topic section.
 */
export function buildSongConceptParts(
  header: string,
  description: string,
  lyricsTopic?: string
): string[] {
  const trimmedTopic = lyricsTopic?.trim();

  const parts = [header, description];

  if (trimmedTopic) {
    parts.push(
      '',
      `LYRICS TOPIC (use this topic for lyrics content, NOT the musical style above):`,
      trimmedTopic
    );
  }

  return parts;
}

/**
 * Early exit check - skips guidance assembly when no mode/genre/rhythm
 * is selected, avoiding unnecessary string building.
 */
export function hasAnyGuidance(selection: ModeSelection, rhythmic: RhythmicInfo): boolean {
  return !!(
    selection.genre ||
    selection.combination ||
    selection.singleMode ||
    selection.polyrhythmCombination ||
    selection.timeSignature ||
    selection.timeSignatureJourney ||
    rhythmic
  );
}

/**
 * Build performance guidance section for a genre.
 * Extracts and formats vocal/production/instrument guidance from genre registry.
 * Adds multi-genre blending hints when compound genres are detected.
 */
export function buildPerformanceGuidanceSection(
  genre: string,
  performanceGuidance: PerformanceGuidanceType | null | undefined
): string[] {
  const parts: string[] = [];
  const guidance = performanceGuidance ?? buildPerformanceGuidance(genre);

  if (guidance) {
    parts.push('', 'PERFORMANCE GUIDANCE:');
    parts.push(`Vocal style: ${guidance.vocal}`);
    parts.push(`Production: ${guidance.production}`);
    if (guidance.instruments.length > 0) {
      parts.push(`Suggested instruments: ${guidance.instruments.join(', ')}`);
    }
  }

  // Add multi-genre nuance guidance for compound genres (2+ components)
  const genreComponents = parseGenreComponents(genre);
  if (genreComponents.length > 1) {
    const nuanceGuidance = getMultiGenreNuanceGuidance(genre, Math.random);
    if (nuanceGuidance) {
      parts.push(nuanceGuidance);
    }
  }

  return parts;
}

/**
 * Build contextual prompt helpers for guidance assembly
 */
export function buildContextualGuidance(
  selection: ModeSelection,
  description: string,
  performanceGuidance?: PerformanceGuidanceType | null
): string[] {
  const parts: string[] = [];
  const rhythmic = detectRhythmic(description);
  const { found: userInstruments } = extractInstruments(description);

  if (!hasAnyGuidance(selection, rhythmic)) {
    return parts;
  }

  parts.push('', 'TECHNICAL GUIDANCE (use as creative inspiration, blend naturally):');

  const modeGuidance = buildGuidanceFromSelection(selection, { userInstruments });
  if (modeGuidance) parts.push(modeGuidance);

  if (rhythmic) parts.push(getRhythmicGuidance(rhythmic));

  if (selection.genre) {
    parts.push(...buildPerformanceGuidanceSection(selection.genre, performanceGuidance));
  }

  return parts;
}
