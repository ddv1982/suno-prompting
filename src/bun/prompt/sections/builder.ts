/**
 * Section Builder Functions
 *
 * Contains the main functions for building sections with
 * interpolated instruments and moods.
 *
 * @module prompt/sections/builder
 */

import { SECTION_TEMPLATES } from './templates';
import {
  selectRandom,
  selectOne,
  getMoodsForGenre,
  selectSectionInstruments,
  interpolateTemplate,
  getRandomDescriptor,
} from './variations';

import type { SectionType, SectionTemplate, SectionContext, SectionResult, AllSectionsResult } from './types';

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Build a single section with interpolated instruments and moods.
 *
 * @param sectionType - Type of section to build
 * @param context - Context containing genre and RNG
 * @returns SectionResult with formatted text and metadata
 *
 * @example
 * const result = buildSection('INTRO', {
 *   genre: 'jazz',
 *   rng: Math.random,
 * });
 * // result.text: "[INTRO] Sparse Walking Rhodes setting a smooth scene"
 */
export function buildSection(
  sectionType: SectionType,
  context: SectionContext
): SectionResult {
  const { genre, rng, trackInstruments = [] } = context;
  const template = SECTION_TEMPLATES[sectionType];

  // Select a random template variation
  const templateString = selectOne(template.templates, rng);

  // Select instruments for this section
  const instruments = selectSectionInstruments(
    genre,
    template.instrumentCount,
    trackInstruments,
    rng
  );

  // Get moods for this genre
  const allMoods = getMoodsForGenre(genre);
  const selectedMoods = selectRandom(allMoods, 2, rng);
  const mood = selectedMoods[0] ?? 'expressive';

  // Get a descriptor
  const descriptor = getRandomDescriptor(rng);

  // Build interpolation values
  const values: Record<string, string> = {
    instrument1: instruments[0] ?? 'instrumentation',
    instrument2: instruments[1] ?? instruments[0] ?? 'accompaniment',
    mood,
    descriptor,
  };

  // Interpolate the template
  const interpolated = interpolateTemplate(templateString, values);
  const text = `[${sectionType}] ${interpolated}`;

  return {
    type: sectionType,
    text,
    instruments,
    moods: selectedMoods,
  };
}

/**
 * Build all standard sections for a track.
 * Ensures instrument variety across sections.
 *
 * @param context - Context containing genre and RNG
 * @returns AllSectionsResult with all sections and combined text
 *
 * @example
 * const result = buildAllSections({
 *   genre: 'jazz',
 *   rng: Math.random,
 * });
 * // result.text includes [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
 */
export function buildAllSections(context: SectionContext): AllSectionsResult {
  const { genre, rng } = context;
  const sectionOrder: readonly SectionType[] = [
    'INTRO',
    'VERSE',
    'CHORUS',
    'BRIDGE',
    'OUTRO',
  ];

  const sections: SectionResult[] = [];
  const usedInstruments: string[] = [];
  const allInstruments: string[] = [];

  for (const sectionType of sectionOrder) {
    const result = buildSection(sectionType, {
      genre,
      rng,
      trackInstruments: usedInstruments,
    });

    sections.push(result);
    allInstruments.push(...result.instruments);

    // Track used instruments for variety (keep only recent ones to allow reuse)
    usedInstruments.push(...result.instruments);
    if (usedInstruments.length > 4) {
      usedInstruments.splice(0, usedInstruments.length - 4);
    }
  }

  // Combine all section texts
  const text = sections.map((s) => s.text).join('\n');

  return {
    sections,
    text,
    allInstruments,
  };
}

/**
 * Get available section types.
 *
 * @returns Array of all section type identifiers
 */
export function getSectionTypes(): readonly SectionType[] {
  return Object.keys(SECTION_TEMPLATES) as SectionType[];
}

/**
 * Get template definition for a section type.
 *
 * @param sectionType - Section type to retrieve
 * @returns Section template definition
 */
export function getSectionTemplate(sectionType: SectionType): SectionTemplate {
  return SECTION_TEMPLATES[sectionType];
}
