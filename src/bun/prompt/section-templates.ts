/**
 * Section Templates for Deterministic Standard Mode
 *
 * Generates section-specific prompts (INTRO, VERSE, CHORUS, BRIDGE, OUTRO)
 * with genre-appropriate instrumentation and mood descriptors.
 *
 * @module prompt/section-templates
 */

import { GENRE_REGISTRY, selectInstrumentsForGenre } from '@bun/instruments';
import { articulateInstrument } from '@bun/prompt/articulations';

import type { GenreType } from '@bun/instruments/genres';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Section types available for prompt generation.
 */
export type SectionType = 'INTRO' | 'VERSE' | 'CHORUS' | 'BRIDGE' | 'OUTRO';

/**
 * Template definition for a single section.
 * Contains multiple template variations for variety.
 */
export type SectionTemplate = {
  /** Section type identifier */
  readonly type: SectionType;
  /** Array of template strings with placeholders */
  readonly templates: readonly string[];
  /** Number of instruments to select for this section */
  readonly instrumentCount: number;
  /** Energy level of the section (affects instrument selection) */
  readonly energy: 'low' | 'medium' | 'high';
};

/**
 * Context for building sections, containing genre-specific data.
 */
export type SectionContext = {
  /** Target genre for instrument and mood selection */
  readonly genre: GenreType;
  /** Random number generator for deterministic output */
  readonly rng: () => number;
  /** Pre-selected instruments for the track (to ensure variety) */
  readonly trackInstruments?: readonly string[];
};

/**
 * Result from building a single section.
 */
export type SectionResult = {
  /** The section type */
  readonly type: SectionType;
  /** Formatted section string ready for prompt */
  readonly text: string;
  /** Instruments used in this section */
  readonly instruments: readonly string[];
  /** Mood descriptors used */
  readonly moods: readonly string[];
};

/**
 * Result from building all sections.
 */
export type AllSectionsResult = {
  /** Array of all section results */
  readonly sections: readonly SectionResult[];
  /** Combined formatted text for all sections */
  readonly text: string;
  /** All instruments used across sections */
  readonly allInstruments: readonly string[];
};

// =============================================================================
// Template Definitions
// =============================================================================

/**
 * INTRO templates - sparse instrumentation setting the scene.
 * Placeholders: {instrument1}, {mood}, {descriptor}
 */
const INTRO_TEMPLATES: readonly string[] = [
  'Sparse {instrument1} setting a {mood} scene',
  '{descriptor} {instrument1} introduces the {mood} atmosphere',
  'Ambient {instrument1} fades in with {mood} undertones',
  '{mood} {instrument1} opens with {descriptor} tones',
  'Gentle {instrument1} establishes {mood} mood',
  '{instrument1} sets the stage with {descriptor} textures',
];

/**
 * VERSE templates - narrative with instruments and emotion.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const VERSE_TEMPLATES: readonly string[] = [
  '{instrument1} enters as {instrument2} weaves {mood} melodic lines',
  '{descriptor} {instrument1} drives the narrative with {instrument2} support',
  '{mood} groove builds with {instrument1} and {instrument2}',
  '{instrument1} lays the foundation while {instrument2} adds {descriptor} color',
  'Storytelling {instrument1} leads with {mood} {instrument2} phrases',
  '{descriptor} interplay between {instrument1} and {instrument2}',
];

/**
 * CHORUS templates - peak energy, full arrangement.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const CHORUS_TEMPLATES: readonly string[] = [
  'Full arrangement peaks with {descriptor} {instrument1} and {instrument2}',
  '{mood} energy surges as {instrument1} and {instrument2} unite',
  'Layered {instrument1} drives the {mood} hook with {instrument2}',
  'Anthemic {instrument1} soars over {descriptor} {instrument2}',
  '{mood} climax with powerful {instrument1} and {instrument2}',
  '{descriptor} full ensemble featuring {instrument1} and {instrument2}',
];

/**
 * BRIDGE templates - contrasting texture, optional.
 * Placeholders: {instrument1}, {mood}, {descriptor}
 */
const BRIDGE_TEMPLATES: readonly string[] = [
  'Stripped down {instrument1} creates {mood} contrast',
  '{descriptor} {instrument1} solo offers introspection',
  '{mood} breakdown featuring intimate {instrument1}',
  'Contrasting {instrument1} provides {descriptor} texture',
  'Reflective {instrument1} moment with {mood} undertones',
  '{instrument1} break shifts to {descriptor} territory',
];

/**
 * OUTRO templates - resolution and fade.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const OUTRO_TEMPLATES: readonly string[] = [
  'Gentle fade with {mood} {instrument1} and {instrument2} swells',
  '{instrument1} resolves as {instrument2} provides {descriptor} closure',
  '{mood} resolution with lingering {instrument1}',
  '{descriptor} {instrument1} fades into {instrument2} echoes',
  'Peaceful {instrument1} brings {mood} conclusion',
  '{instrument1} and {instrument2} create {descriptor} final moments',
];

/**
 * Section template definitions with energy levels.
 */
const SECTION_TEMPLATES: Record<SectionType, SectionTemplate> = {
  INTRO: {
    type: 'INTRO',
    templates: INTRO_TEMPLATES,
    instrumentCount: 1,
    energy: 'low',
  },
  VERSE: {
    type: 'VERSE',
    templates: VERSE_TEMPLATES,
    instrumentCount: 2,
    energy: 'medium',
  },
  CHORUS: {
    type: 'CHORUS',
    templates: CHORUS_TEMPLATES,
    instrumentCount: 2,
    energy: 'high',
  },
  BRIDGE: {
    type: 'BRIDGE',
    templates: BRIDGE_TEMPLATES,
    instrumentCount: 1,
    energy: 'low',
  },
  OUTRO: {
    type: 'OUTRO',
    templates: OUTRO_TEMPLATES,
    instrumentCount: 2,
    energy: 'low',
  },
};

/**
 * Generic mood descriptors used when genre lacks specific moods.
 */
const GENERIC_MOODS: readonly string[] = [
  'expressive',
  'dynamic',
  'emotional',
  'compelling',
  'atmospheric',
  'evocative',
];

/**
 * Generic descriptors for instrument qualities.
 */
const GENERIC_DESCRIPTORS: readonly string[] = [
  'rich',
  'warm',
  'bright',
  'smooth',
  'textured',
  'resonant',
  'subtle',
  'bold',
  'delicate',
  'expansive',
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select random items from an array using provided RNG.
 *
 * @param items - Array to select from
 * @param count - Number of items to select
 * @param rng - Random number generator
 * @returns Selected items
 */
function selectRandom<T>(items: readonly T[], count: number, rng: () => number): T[] {
  if (items.length === 0) return [];
  const shuffled = [...items].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

/**
 * Select a random item from an array using provided RNG.
 *
 * @param items - Array to select from
 * @param rng - Random number generator
 * @returns Single selected item
 */
function selectOne<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  // Safe: All callers pass non-empty constant arrays (templates, moods, descriptors)
  return items[idx] ?? items[0]!;
}

/**
 * Get mood descriptors for a genre.
 *
 * @param genre - Target genre
 * @returns Array of mood strings (lowercase)
 *
 * @example
 * getMoodsForGenre('jazz')
 * // ['smooth', 'warm', 'sophisticated', 'intimate']
 */
function getMoodsForGenre(genre: GenreType): readonly string[] {
  const genreDef = GENRE_REGISTRY[genre];
  if (genreDef?.moods && genreDef.moods.length > 0) {
    return genreDef.moods.map((m) => m.toLowerCase());
  }
  return GENERIC_MOODS;
}

/**
 * Select instruments for a specific section, ensuring variety from track instruments.
 *
 * @param genre - Target genre
 * @param count - Number of instruments needed
 * @param usedInstruments - Already used instruments (to avoid)
 * @param rng - Random number generator
 * @returns Array of selected instruments
 *
 * @example
 * selectSectionInstruments('jazz', 2, ['piano'], Math.random)
 * // ['Arpeggiated Rhodes', 'Breathy tenor sax']
 */
function selectSectionInstruments(
  genre: GenreType,
  count: number,
  usedInstruments: readonly string[],
  rng: () => number
): string[] {
  // Get a larger pool of instruments for variety
  const poolSize = Math.max(count * 3, 6);
  const instrumentPool = selectInstrumentsForGenre(genre, {
    maxTags: poolSize,
    rng,
  });

  // Filter out already used instruments for variety
  const available = instrumentPool.filter((i) => !usedInstruments.includes(i));

  // If not enough available, include some used ones
  const toSelect = available.length >= count ? available : instrumentPool;

  // Select and articulate the instruments
  const selected = selectRandom(toSelect, count, rng);
  return selected.map((instrument) => articulateInstrument(instrument, rng));
}

/**
 * Interpolate placeholders in a template string.
 *
 * @param template - Template string with placeholders
 * @param values - Values to interpolate
 * @returns Interpolated string
 */
function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

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
  const descriptor = selectOne(GENERIC_DESCRIPTORS, rng);

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
