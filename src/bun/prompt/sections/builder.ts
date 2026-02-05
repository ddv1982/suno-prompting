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
  selectSectionInstrumentsWithDynamics,
  interpolateTemplate,
  getRandomDescriptor,
  getDescriptorForDynamics,
} from './variations';

import type {
  SectionType,
  SectionTemplate,
  SectionContext,
  SectionContextWithContrast,
  SectionResult,
  AllSectionsResult,
  SchemaSectionType,
  Dynamics,
} from './types';

// =============================================================================
// Main Functions
// =============================================================================

// =============================================================================
// Section Type Mapping
// =============================================================================

/**
 * Map schema section types (lowercase) to builder section types (uppercase).
 * Used to translate contrast section types to the builder's format.
 */
const SCHEMA_TO_BUILDER_SECTION_MAP: Record<SchemaSectionType, SectionType | null> = {
  intro: 'INTRO',
  verse: 'VERSE',
  'pre-chorus': 'VERSE', // Map pre-chorus to VERSE (closest equivalent)
  chorus: 'CHORUS',
  bridge: 'BRIDGE',
  breakdown: 'BRIDGE', // Map breakdown to BRIDGE (similar structural role)
  outro: 'OUTRO',
};

/**
 * Convert schema section type to builder section type.
 *
 * @param schemaType - Section type from ThematicContext schema (lowercase)
 * @returns Builder section type (uppercase) or null if no mapping exists
 */
function mapSchemaToBuilderSection(schemaType: SchemaSectionType): SectionType | null {
  return SCHEMA_TO_BUILDER_SECTION_MAP[schemaType];
}

// =============================================================================
// Core Section Building
// =============================================================================

/**
 * Build a single section with interpolated instruments and moods.
 *
 * When sectionOverride is provided via context, the mood and descriptor
 * selection are influenced by the contrast detection data:
 * - Mood override replaces genre-derived mood
 * - Dynamics level influences descriptor selection and articulation
 *
 * @param sectionType - Type of section to build
 * @param context - Context containing genre, RNG, and optional section overrides
 * @returns SectionResult with formatted text and metadata
 *
 * @example
 * // Basic usage without contrast
 * const result = buildSection('INTRO', {
 *   genre: 'jazz',
 *   rng: Math.random,
 * });
 * // result.text: "[INTRO] Sparse Walking Rhodes setting a smooth scene"
 *
 * @example
 * // With contrast override
 * const result = buildSection('CHORUS', {
 *   genre: 'jazz',
 *   rng: Math.random,
 *   sectionOverride: { mood: 'euphoric', dynamics: 'explosive' },
 * });
 * // result.text uses 'euphoric' mood and explosive descriptor
 */
export function buildSection(sectionType: SectionType, context: SectionContext): SectionResult {
  const { genre, rng, trackInstruments = [], sectionOverride } = context;
  const template = SECTION_TEMPLATES[sectionType];

  // Select a random template variation
  const templateString = selectOne(template.templates, rng);

  // Select instruments for this section
  // When dynamics override is provided, influence articulation selection
  const instruments = sectionOverride?.dynamics
    ? selectSectionInstrumentsWithDynamics(
        genre,
        template.instrumentCount,
        trackInstruments,
        rng,
        sectionOverride.dynamics
      )
    : selectSectionInstruments(genre, template.instrumentCount, trackInstruments, rng);

  // Get moods - use override if provided, otherwise genre-derived
  let selectedMoods: string[];
  let mood: string;

  if (sectionOverride?.mood) {
    // Use contrast-provided mood as primary
    mood = sectionOverride.mood;
    // Still get genre moods for secondary mood
    const allMoods = getMoodsForGenre(genre);
    const genreMoods = selectRandom(allMoods, 1, rng);
    selectedMoods = [mood, ...genreMoods];
  } else {
    // Standard behavior: genre-derived moods
    const allMoods = getMoodsForGenre(genre);
    selectedMoods = selectRandom(allMoods, 2, rng);
    mood = selectedMoods[0] ?? 'expressive';
  }

  // Get a descriptor - use dynamics-appropriate descriptor if override provided
  const descriptor = sectionOverride?.dynamics
    ? getDescriptorForDynamics(sectionOverride.dynamics, rng)
    : getRandomDescriptor(rng);

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
  const sectionOrder: readonly SectionType[] = ['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUTRO'];

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

// =============================================================================
// Contrast-Aware Section Building
// =============================================================================

/**
 * Build section overrides map from contrast data.
 *
 * Maps contrast section types to builder section types and extracts
 * mood and dynamics overrides for each section.
 *
 * @param contrast - Contrast data from ThematicContext
 * @returns Map of section type to override settings
 */
function buildOverridesFromContrast(
  contrast: SectionContextWithContrast['contrast']
): Map<SectionType, { mood: string; dynamics: Dynamics }> {
  const overrides = new Map<SectionType, { mood: string; dynamics: Dynamics }>();

  if (!contrast?.sections) {
    return overrides;
  }

  for (const section of contrast.sections) {
    const builderType = mapSchemaToBuilderSection(section.type);
    if (builderType) {
      // Later sections override earlier ones if there are duplicates
      overrides.set(builderType, {
        mood: section.mood,
        dynamics: section.dynamics,
      });
    }
  }

  return overrides;
}

/**
 * Build all sections with contrast-based mood and dynamics overrides.
 *
 * When contrast data is provided from ThematicContext, this function applies:
 * - Mood overrides per section (from contrast.sections[].mood)
 * - Dynamics levels per section (affecting articulation and descriptors)
 *
 * Falls back to standard buildAllSections behavior when no contrast is provided.
 *
 * @param context - Context containing genre, RNG, and optional contrast data
 * @returns AllSectionsResult with all sections and combined text
 *
 * @example
 * // Without contrast - behaves like buildAllSections
 * const result = buildSectionsWithContrast({
 *   genre: 'jazz',
 *   rng: Math.random,
 * });
 *
 * @example
 * // With contrast - applies mood/dynamics overrides
 * const result = buildSectionsWithContrast({
 *   genre: 'rock',
 *   rng: Math.random,
 *   contrast: {
 *     sections: [
 *       { type: 'intro', mood: 'mysterious', dynamics: 'soft' },
 *       { type: 'verse', mood: 'tense', dynamics: 'building' },
 *       { type: 'chorus', mood: 'euphoric', dynamics: 'explosive' },
 *       { type: 'bridge', mood: 'reflective', dynamics: 'soft' },
 *       { type: 'outro', mood: 'triumphant', dynamics: 'powerful' },
 *     ],
 *   },
 * });
 * // Sections will use contrast-provided moods and dynamics-influenced articulations
 */
export function buildSectionsWithContrast(context: SectionContextWithContrast): AllSectionsResult {
  const { genre, rng, trackInstruments, contrast } = context;

  // Fallback to existing behavior when no contrast provided
  if (!contrast?.sections || contrast.sections.length === 0) {
    return buildAllSections({ genre, rng, trackInstruments });
  }

  // Build overrides map from contrast data
  const overrides = buildOverridesFromContrast(contrast);

  const sectionOrder: readonly SectionType[] = ['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUTRO'];

  const sections: SectionResult[] = [];
  const usedInstruments: string[] = [];
  const allInstruments: string[] = [];

  for (const sectionType of sectionOrder) {
    // Get override for this section type if available
    const sectionOverride = overrides.get(sectionType);

    const result = buildSection(sectionType, {
      genre,
      rng,
      trackInstruments: usedInstruments,
      sectionOverride,
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
