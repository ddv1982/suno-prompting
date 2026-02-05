/**
 * Section Builder with Narrative Arc Support
 *
 * Provides functions to map narrative arc emotions to section progression,
 * enabling dynamic mood transitions across song sections based on the
 * emotional journey extracted from ThematicContext.
 *
 * @module prompt/sections/section-builder
 */

import { buildSectionsWithContrast } from './builder';

import type {
  SectionType,
  SectionContextWithContrast,
  AllSectionsResult,
  Dynamics,
  SchemaSectionType,
} from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { Contrast, ContrastSection } from '@shared/schemas/thematic-context';

// =============================================================================
// Types
// =============================================================================

/**
 * Context for building sections with narrative arc support.
 * Extends contrast context with optional narrative arc data.
 */
export interface SectionContextWithNarrativeArc {
  /** Target genre for instrument and mood selection */
  readonly genre: GenreType;
  /** Random number generator for deterministic output */
  readonly rng: () => number;
  /** Pre-selected instruments for the track (to ensure variety) */
  readonly trackInstruments?: readonly string[];
  /** Optional contrast data from ThematicContext */
  readonly contrast?: Contrast;
  /** Optional narrative arc emotions from ThematicContext */
  readonly narrativeArc?: readonly string[];
}

// =============================================================================
// Narrative Arc Mapping
// =============================================================================

/**
 * Section position in the arc mapping.
 * Used to determine which arc element maps to which section.
 */
type ArcPosition = 'start' | 'middle' | 'end';

/**
 * Map section types to their position in the narrative arc.
 *
 * - start: intro, verse1 - use first arc element
 * - middle: pre-chorus, chorus, bridge - use middle arc elements
 * - end: outro, climax - use final arc element
 */
const SECTION_ARC_POSITION: Record<SectionType, ArcPosition> = {
  INTRO: 'start',
  VERSE: 'start',
  CHORUS: 'middle',
  BRIDGE: 'middle',
  OUTRO: 'end',
};

/**
 * Default dynamics for arc positions.
 * Maps narrative arc positions to appropriate dynamics levels.
 */
const ARC_POSITION_DYNAMICS: Record<ArcPosition, Dynamics> = {
  start: 'building',
  middle: 'powerful',
  end: 'explosive',
};

/**
 * Get the arc element for a specific position in the narrative arc.
 *
 * @param arc - Narrative arc array of emotions
 * @param position - Position in the arc (start, middle, end)
 * @returns The emotion string for that position
 *
 * @example
 * getArcElement(['isolation', 'hope', 'triumph'], 'start')
 * // 'isolation'
 *
 * @example
 * getArcElement(['isolation', 'hope', 'triumph'], 'middle')
 * // 'hope'
 *
 * @example
 * getArcElement(['isolation', 'hope', 'triumph'], 'end')
 * // 'triumph'
 */
function getArcElement(arc: readonly string[], position: ArcPosition): string | undefined {
  if (arc.length === 0) {
    return undefined;
  }

  const firstElement = arc[0];
  const lastElement = arc[arc.length - 1];

  switch (position) {
    case 'start':
      return firstElement;
    case 'middle': {
      // For middle, use the middle element(s)
      // If arc has 3+ elements, use the middle one
      // If arc has 2 elements, use the first (as it transitions to second)
      // If arc has 1 element, use that element
      if (arc.length >= 3) {
        const middleIndex = Math.floor(arc.length / 2);
        return arc[middleIndex];
      }
      return firstElement;
    }
    case 'end':
      return lastElement;
  }
}

/**
 * Convert narrative arc to contrast sections for section building.
 *
 * Maps the emotional journey from narrativeArc to contrast section
 * definitions that can be used by buildSectionsWithContrast.
 *
 * Arc mapping:
 * - First arc element → intro/verse1 mood
 * - Middle elements → chorus/bridge mood
 * - Final element → outro/climax mood
 *
 * @param narrativeArc - Array of emotions representing the emotional journey
 * @returns Contrast object with section definitions, or undefined if no arc provided
 *
 * @example
 * narrativeArcToContrast(['isolation', 'hope', 'triumph'])
 * // {
 * //   sections: [
 * //     { type: 'intro', mood: 'isolation', dynamics: 'building' },
 * //     { type: 'verse', mood: 'isolation', dynamics: 'building' },
 * //     { type: 'chorus', mood: 'hope', dynamics: 'powerful' },
 * //     { type: 'bridge', mood: 'hope', dynamics: 'powerful' },
 * //     { type: 'outro', mood: 'triumph', dynamics: 'explosive' },
 * //   ]
 * // }
 */
export function narrativeArcToContrast(
  narrativeArc: readonly string[] | undefined
): Contrast | undefined {
  if (!narrativeArc || narrativeArc.length === 0) {
    return undefined;
  }

  // Define the section order and their arc positions
  const sectionMapping: { type: SchemaSectionType; builderType: SectionType }[] = [
    { type: 'intro', builderType: 'INTRO' },
    { type: 'verse', builderType: 'VERSE' },
    { type: 'chorus', builderType: 'CHORUS' },
    { type: 'bridge', builderType: 'BRIDGE' },
    { type: 'outro', builderType: 'OUTRO' },
  ];

  const sections: ContrastSection[] = [];

  for (const { type, builderType } of sectionMapping) {
    const position = SECTION_ARC_POSITION[builderType];
    const mood = getArcElement(narrativeArc, position);

    if (mood) {
      sections.push({
        type,
        mood,
        dynamics: ARC_POSITION_DYNAMICS[position],
      });
    }
  }

  return sections.length > 0 ? { sections } : undefined;
}

/**
 * Merge existing contrast with narrative arc-derived contrast.
 *
 * When both contrast and narrativeArc are provided, this function
 * merges them with the following priority:
 * 1. Explicit contrast sections take precedence
 * 2. Narrative arc fills in any missing sections
 *
 * @param existingContrast - Explicitly provided contrast from ThematicContext
 * @param narrativeArc - Narrative arc emotions from ThematicContext
 * @returns Merged contrast with all available section definitions
 *
 * @example
 * // Explicit contrast takes precedence
 * mergeContrastWithNarrativeArc(
 *   { sections: [{ type: 'chorus', mood: 'euphoric', dynamics: 'explosive' }] },
 *   ['sadness', 'hope', 'joy']
 * )
 * // Result: chorus uses 'euphoric' (explicit), other sections use arc
 */
export function mergeContrastWithNarrativeArc(
  existingContrast: Contrast | undefined,
  narrativeArc: readonly string[] | undefined
): Contrast | undefined {
  const arcContrast = narrativeArcToContrast(narrativeArc);

  // If no arc contrast, return existing
  if (!arcContrast) {
    return existingContrast;
  }

  // If no existing contrast, return arc contrast
  if (!existingContrast || existingContrast.sections.length === 0) {
    return arcContrast;
  }

  // Merge: existing contrast sections take precedence
  const existingTypes = new Set(existingContrast.sections.map((s) => s.type));

  // Add arc sections that don't exist in explicit contrast
  const mergedSections = [
    ...existingContrast.sections,
    ...arcContrast.sections.filter((s) => !existingTypes.has(s.type)),
  ];

  return { sections: mergedSections };
}

// =============================================================================
// Section Building with Narrative Arc
// =============================================================================

/**
 * Build all sections with narrative arc support.
 *
 * This function extends buildSectionsWithContrast by automatically
 * converting narrative arc emotions into section mood progressions.
 * It provides a seamless integration between the emotional journey
 * described in the ThematicContext and the generated section templates.
 *
 * Processing order:
 * 1. Convert narrative arc to contrast (if provided)
 * 2. Merge with explicit contrast (explicit takes precedence)
 * 3. Build sections using the merged contrast
 *
 * @param context - Context containing genre, RNG, contrast, and narrative arc
 * @returns AllSectionsResult with all sections and combined text
 *
 * @example
 * // With narrative arc only
 * const result = buildSectionsWithNarrativeArc({
 *   genre: 'rock',
 *   rng: Math.random,
 *   narrativeArc: ['isolation', 'hope', 'triumph'],
 * });
 * // Sections will progress: isolation (intro/verse) → hope (chorus/bridge) → triumph (outro)
 *
 * @example
 * // With both contrast and narrative arc
 * const result = buildSectionsWithNarrativeArc({
 *   genre: 'electronic',
 *   rng: Math.random,
 *   contrast: {
 *     sections: [{ type: 'chorus', mood: 'euphoric', dynamics: 'explosive' }],
 *   },
 *   narrativeArc: ['melancholic', 'hopeful', 'triumphant'],
 * });
 * // Chorus uses explicit 'euphoric', other sections use narrative arc
 */
export function buildSectionsWithNarrativeArc(
  context: SectionContextWithNarrativeArc
): AllSectionsResult {
  const { genre, rng, trackInstruments, contrast, narrativeArc } = context;

  // Merge narrative arc with existing contrast
  const mergedContrast = mergeContrastWithNarrativeArc(contrast, narrativeArc);

  // Build sections using the merged contrast
  const contrastContext: SectionContextWithContrast = {
    genre,
    rng,
    trackInstruments,
    contrast: mergedContrast,
  };

  return buildSectionsWithContrast(contrastContext);
}

/**
 * Infer dynamics progression from narrative arc length and content.
 *
 * Analyzes the narrative arc to suggest appropriate dynamics progression:
 * - Short arcs (1-2 elements): steady progression
 * - Medium arcs (3-4 elements): gradual build
 * - Long arcs (5+ elements): dramatic journey with multiple peaks
 *
 * @param narrativeArc - Array of emotions representing the emotional journey
 * @returns Suggested dynamics progression pattern
 *
 * @example
 * inferDynamicsFromArc(['peace'])
 * // 'steady'
 *
 * @example
 * inferDynamicsFromArc(['sadness', 'hope', 'joy'])
 * // 'building'
 *
 * @example
 * inferDynamicsFromArc(['isolation', 'longing', 'hope', 'love', 'triumph'])
 * // 'dramatic'
 */
export function inferDynamicsFromArc(
  narrativeArc: readonly string[] | undefined
): 'steady' | 'building' | 'dramatic' {
  if (!narrativeArc || narrativeArc.length === 0) {
    return 'steady';
  }

  if (narrativeArc.length <= 2) {
    return 'steady';
  }

  if (narrativeArc.length <= 4) {
    return 'building';
  }

  return 'dramatic';
}
