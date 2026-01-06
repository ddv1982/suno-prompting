/**
 * Deterministic Prompt Builder
 *
 * Generates Suno prompts deterministically without LLM calls.
 * Uses existing data sources (genres, instruments, chord progressions, etc.)
 * to create high-quality prompts in <50ms.
 *
 * @module prompt/deterministic-builder
 */

import { GENRE_REGISTRY, selectInstrumentsForGenre } from '@bun/instruments';
import { detectGenre } from '@bun/instruments/detection';
import { createLogger } from '@bun/logger';
import { articulateInstrument } from '@bun/prompt/articulations';
import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { getRandomProgressionForGenre } from '@bun/prompt/chord-progressions';
import {
  parseGenreComponents,
  selectInstrumentsForMultiGenre,
  buildBlendedProductionDescriptor,
} from '@bun/prompt/genre-parser';
import { buildProductionDescriptor } from '@bun/prompt/production-elements';
import {
  selectRealismTags,
  selectElectronicTags,
  isElectronicGenre,
  selectGenericTags,
  RECORDING_DESCRIPTORS,
} from '@bun/prompt/realism-tags';
import { buildAllSections } from '@bun/prompt/section-templates';
import { getVocalSuggestionsForGenre } from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';
import { MAX_MODE_HEADER } from '@shared/max-format';

const log = createLogger('DeterministicBuilder');

import type { GenreType } from '@bun/instruments/genres';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Options for deterministic prompt generation.
 */
export type DeterministicOptions = {
  /** User's song description/concept */
  readonly description: string;
  /** Genre override from Advanced Mode selector */
  readonly genreOverride?: string;
  /** Random number generator for deterministic testing */
  readonly rng?: () => number;
};

/**
 * Result from deterministic prompt generation.
 */
export type DeterministicResult = {
  /** The generated prompt text */
  readonly text: string;
  /** Detected or selected primary genre (first component for multi-genre) */
  readonly genre: GenreType | null;
  /** Debug metadata (when debug mode enabled) */
  readonly metadata?: {
    readonly detectedGenre: GenreType | null;
    /** Full genre string (can be compound like "jazz rock") */
    readonly usedGenre: string;
    readonly instruments: readonly string[];
    readonly chordProgression: string;
    readonly vocalStyle: string;
    readonly styleTags: readonly string[];
    readonly recordingContext: string;
  };
};

// =============================================================================
// Constants
// =============================================================================

/** All genre keys for random selection */
const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as GenreType[];

/** Maximum character limit for prompts */
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/** Fallback BPM range when genre has no defined BPM */
const DEFAULT_BPM_RANGE = 'between 90 and 140';

/** Musical keys for STANDARD MODE */
const MUSICAL_KEYS: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Musical modes for STANDARD MODE */
const MUSICAL_MODES: readonly string[] = [
  'major',
  'minor',
  'dorian',
  'mixolydian',
  'lydian',
  'phrygian',
];

// =============================================================================
// Helper Functions: Truncation
// =============================================================================

/**
 * Truncate a prompt to fit within the MAX_CHARS limit.
 * Truncates from the end to preserve the header and primary fields.
 *
 * @param prompt - The prompt text to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated prompt (if needed) or original prompt
 *
 * @example
 * truncatePrompt('very long prompt...', 100) // returns first 100 chars
 */
function truncatePrompt(prompt: string, maxLength: number = MAX_CHARS): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Truncate and try to end at a clean boundary (quote, comma, or newline)
  let truncated = prompt.slice(0, maxLength);

  // Try to find a clean break point (last quote or newline)
  const lastQuote = truncated.lastIndexOf('"');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakPoint = Math.max(lastQuote, lastNewline);

  if (breakPoint > maxLength * 0.8) {
    truncated = truncated.slice(0, breakPoint + 1);
  }

  return truncated;
}

// =============================================================================
// Helper Functions: Genre Detection and Fallback
// =============================================================================

/**
 * Detect genre from description using keyword matching only.
 * No LLM spelling correction - silently ignores unrecognized words.
 *
 * @param description - User's song description
 * @returns Detected GenreType or null if no keywords match
 *
 * @example
 * detectGenreKeywordsOnly('smooth jazz night') // returns 'jazz'
 * detectGenreKeywordsOnly('something cool') // returns null
 */
function detectGenreKeywordsOnly(description: string): GenreType | null {
  if (!description || typeof description !== 'string') {
    return null;
  }
  return detectGenre(description);
}

/**
 * Select a random genre from the registry.
 * Used as fallback when no genre is detected.
 *
 * @param rng - Random number generator
 * @returns Random GenreType from GENRE_REGISTRY
 *
 * @example
 * selectRandomGenre(Math.random) // returns e.g. 'jazz'
 */
function selectRandomGenre(rng: () => number = Math.random): GenreType {
  const idx = Math.floor(rng() * ALL_GENRE_KEYS.length);
  return ALL_GENRE_KEYS[idx] ?? 'pop';
}

/**
 * Result type for genre resolution supporting both single and multi-genre.
 */
type ResolvedGenre = {
  /** Detected genre from description (null if override used or random fallback) */
  detected: GenreType | null;
  /** Display string - full genre string for prompt output (e.g., "jazz rock") */
  displayGenre: string;
  /** Primary genre for single-genre lookups (first component) */
  primaryGenre: GenreType;
  /** All valid genre components for multi-genre blending */
  components: GenreType[];
};

/**
 * Resolve the effective genre from description and optional override.
 * Supports compound genre strings like "jazz rock" or "jazz, metal".
 * Priority: genreOverride > detected genre > random fallback
 *
 * @param description - User's song description
 * @param genreOverride - Optional genre override (can be compound like "jazz rock")
 * @param rng - Random number generator
 * @returns Resolved genre with display string and components for blending
 *
 * @example
 * resolveGenre('smooth jazz night', undefined, Math.random)
 * // { detected: 'jazz', displayGenre: 'jazz', primaryGenre: 'jazz', components: ['jazz'] }
 *
 * @example
 * resolveGenre('random words', 'jazz rock', Math.random)
 * // { detected: null, displayGenre: 'jazz rock', primaryGenre: 'jazz', components: ['jazz', 'rock'] }
 */
function resolveGenre(
  description: string,
  genreOverride: string | undefined,
  rng: () => number
): ResolvedGenre {
  // 1. Try genre override - supports both single and compound genres
  if (genreOverride) {
    const components = parseGenreComponents(genreOverride);
    if (components.length > 0) {
      // Valid genre(s) found - use original string for display, components for lookups
      // Pop fallback is genre-neutral and produces broadly appealing selections
      const primaryGenre = components[0] ?? 'pop';
      return {
        detected: null,
        displayGenre: genreOverride.toLowerCase().trim(),
        primaryGenre,
        components,
      };
    }
    // No valid genres in override - log warning and fall through
    log.warn('invalid_genre_override', { genreOverride });
  }

  // 2. Try keyword detection from description
  const detected = detectGenreKeywordsOnly(description);
  if (detected) {
    return {
      detected,
      displayGenre: detected,
      primaryGenre: detected,
      components: [detected],
    };
  }

  // 3. Fallback to random genre
  const randomGenre = selectRandomGenre(rng);
  return {
    detected: null,
    displayGenre: randomGenre,
    primaryGenre: randomGenre,
    components: [randomGenre],
  };
}

/**
 * Parse multi-genre strings (comma-separated).
 * Returns the first detected genre from the string.
 *
 * @param description - Description that may contain multiple genres
 * @returns First detected genre or null
 *
 * @example
 * parseMultiGenre('jazz, rock fusion') // returns 'jazz'
 */
function parseMultiGenre(description: string): GenreType | null {
  if (!description) return null;

  // Split by comma and try each part
  const parts = description.split(',').map((p) => p.trim());
  for (const part of parts) {
    const detected = detectGenreKeywordsOnly(part);
    if (detected) return detected;
  }

  // Try the whole string as well
  return detectGenreKeywordsOnly(description);
}

// =============================================================================
// Helper Functions: Instrument Assembly
// =============================================================================

/**
 * Assemble instruments string with articulations, chord progression, and vocals.
 * Supports multi-genre blending when multiple components are provided.
 *
 * @param components - Array of genre components (supports single or multi-genre)
 * @param rng - Random number generator
 * @returns Formatted instruments string for prompt
 *
 * @example
 * assembleInstruments(['jazz'], Math.random)
 * // "Arpeggiated Rhodes, breathy tenor sax, walking upright bass, The 2-5-1 (ii-V-I) harmony, Tenor vocals, Smooth delivery"
 *
 * @example
 * assembleInstruments(['jazz', 'rock'], Math.random)
 * // Blends instruments from both jazz and rock pools
 */
function assembleInstruments(
  components: GenreType[],
  rng: () => number = Math.random
): { instruments: readonly string[]; formatted: string; chordProgression: string; vocalStyle: string } {
  const primaryGenre = components[0] ?? 'pop';

  // Select base instruments - blend from multiple genres if compound
  const baseInstruments =
    components.length > 1
      ? selectInstrumentsForMultiGenre(components, rng, 4)
      : selectInstrumentsForGenre(primaryGenre, { maxTags: 4, rng });

  // Apply articulations to instruments
  const articulatedInstruments = baseInstruments.map((instrument) =>
    articulateInstrument(instrument, rng)
  );

  // Get chord progression from primary genre
  const progression = getRandomProgressionForGenre(primaryGenre, rng);
  const progressionTag = `${progression.name} (${progression.pattern}) harmony`;

  // Get vocal suggestions from primary genre
  const vocals = getVocalSuggestionsForGenre(primaryGenre, rng);
  const vocalTag = `${vocals.range} vocals, ${vocals.delivery} delivery`;

  // Combine all elements
  const allElements = [...articulatedInstruments, progressionTag, vocalTag];

  return {
    instruments: baseInstruments,
    formatted: allElements.join(', '),
    chordProgression: progressionTag,
    vocalStyle: vocalTag,
  };
}

// =============================================================================
// Helper Functions: Style Tags Assembly
// =============================================================================

/**
 * Select random moods from a genre's mood pool.
 *
 * @param genre - Target genre
 * @param count - Number of moods to select
 * @param rng - Random number generator
 * @returns Array of selected moods
 *
 * @example
 * selectMoodsForGenre('jazz', 2, Math.random)
 * // ['smooth', 'warm']
 */
function selectMoodsForGenre(
  genre: GenreType,
  count: number,
  rng: () => number
): string[] {
  const genreDef = GENRE_REGISTRY[genre];
  const moods = genreDef?.moods ?? [];

  if (moods.length === 0) return [];

  // Shuffle and select
  const shuffled = [...moods].sort(() => rng() - 0.5);
  return shuffled.slice(0, count).map((m) => m.toLowerCase());
}

/**
 * Assemble style tags from mood pool, realism/electronic tags, and production.
 * Supports multi-genre blending when multiple components are provided.
 *
 * @param components - Array of genre components (supports single or multi-genre)
 * @param rng - Random number generator
 * @returns Formatted style tags string and array
 *
 * @example
 * assembleStyleTags(['jazz'], Math.random)
 * // { tags: ['smooth', 'warm', 'sophisticated', 'natural dynamics', 'analog warmth'], formatted: '...' }
 *
 * @example
 * assembleStyleTags(['jazz', 'rock'], Math.random)
 * // Blends moods and production from both genres
 */
function assembleStyleTags(
  components: GenreType[],
  rng: () => number = Math.random
): { tags: readonly string[]; formatted: string } {
  const primaryGenre = components[0] ?? 'pop';
  const allTags: string[] = [];
  const seenTags = new Set<string>();

  // Helper to add unique tags (case-insensitive dedup)
  const addUnique = (tag: string): void => {
    const lower = tag.toLowerCase();
    if (!seenTags.has(lower)) {
      seenTags.add(lower);
      allTags.push(lower);
    }
  };

  // 1. Select moods from all genre components' mood pools
  // Blend moods from multiple genres for richer palette
  for (const genre of components) {
    const moods = selectMoodsForGenre(genre, 2, rng);
    for (const mood of moods) {
      addUnique(mood);
    }
  }

  // 2. Select realism or electronic tags based on primary genre
  let styleTags: string[];
  if (isElectronicGenre(primaryGenre)) {
    styleTags = selectElectronicTags(3, rng);
  } else {
    styleTags = selectRealismTags(primaryGenre, 3, rng);
  }

  // If no genre-specific tags, fall back to generic tags
  if (styleTags.length === 0) {
    styleTags = selectGenericTags(3, rng);
  }

  for (const tag of styleTags) {
    addUnique(tag);
  }

  // 3. Add production descriptor elements
  // Use blended production for multi-genre, single for single genre
  const productionDesc =
    components.length > 1
      ? buildBlendedProductionDescriptor(components, rng)
      : buildProductionDescriptor(primaryGenre, rng);
  // Split production descriptor and add individual parts
  const productionParts = productionDesc.split(',').map((p) => p.trim().toLowerCase());
  for (const part of productionParts) {
    if (part) addUnique(part);
  }

  // Limit to reasonable number of tags
  const finalTags = allTags.slice(0, 6);

  return {
    tags: finalTags,
    formatted: finalTags.join(', '),
  };
}

// =============================================================================
// Helper Functions: Recording Context
// =============================================================================

/**
 * Select recording context descriptor.
 * Uses provided RNG for deterministic shuffling.
 *
 * @param rng - Random number generator
 * @param count - Number of descriptors to select
 * @returns Recording context string
 *
 * @example
 * selectRecordingContext(Math.random)
 * // "late night studio session vibe, analog four-track warmth"
 */
function selectRecordingContext(
  rng: () => number = Math.random,
  count: number = 2
): string {
  // Shuffle using provided rng for determinism
  const shuffled = [...RECORDING_DESCRIPTORS].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected.join(', ');
}

// =============================================================================
// Helper Functions: BPM
// =============================================================================

/**
 * Get formatted BPM range for a genre string.
 * Supports multi-genre strings like "jazz rock" via getBlendedBpmRange.
 *
 * @param genreString - Genre string (single or compound like "jazz rock")
 * @returns Formatted BPM range string or fallback
 */
function getBpmRangeForGenre(genreString: string): string {
  // getBlendedBpmRange supports multi-genre strings
  const range = getBlendedBpmRange(genreString);
  if (range) {
    return formatBpmRange(range);
  }

  return DEFAULT_BPM_RANGE;
}

// =============================================================================
// Helper Functions: Key/Mode Selection
// =============================================================================

/**
 * Select a random musical key.
 *
 * @param rng - Random number generator
 * @returns Musical key (e.g., "C", "D#", "F")
 *
 * @example
 * selectMusicalKey(Math.random) // returns e.g. "D"
 */
function selectMusicalKey(rng: () => number = Math.random): string {
  const idx = Math.floor(rng() * MUSICAL_KEYS.length);
  return MUSICAL_KEYS[idx] ?? 'C';
}

/**
 * Select a random musical mode.
 *
 * @param rng - Random number generator
 * @returns Musical mode (e.g., "major", "minor", "dorian")
 *
 * @example
 * selectMusicalMode(Math.random) // returns e.g. "minor"
 */
function selectMusicalMode(rng: () => number = Math.random): string {
  const idx = Math.floor(rng() * MUSICAL_MODES.length);
  return MUSICAL_MODES[idx] ?? 'major';
}

/**
 * Select a random key and mode combination.
 *
 * @param rng - Random number generator
 * @returns Formatted key/mode string (e.g., "Key: D minor")
 *
 * @example
 * selectKeyAndMode(Math.random) // returns e.g. "Key: D minor"
 */
function selectKeyAndMode(rng: () => number = Math.random): string {
  const key = selectMusicalKey(rng);
  const mode = selectMusicalMode(rng);
  return `Key: ${key} ${mode}`;
}

// =============================================================================
// Main Functions: MAX MODE Prompt Builder
// =============================================================================

/**
 * Build a complete MAX MODE prompt deterministically.
 *
 * @param options - Generation options including description and optional genre override
 * @returns DeterministicResult with formatted MAX MODE prompt
 *
 * @example
 * const result = buildDeterministicMaxPrompt({
 *   description: 'smooth jazz night session',
 *   genreOverride: undefined,
 *   rng: Math.random,
 * });
 * // result.text:
 * // ::tags realistic music ::
 * // ::quality maximum ::
 * // ::style suno v5 ::
 * //
 * // genre: "jazz"
 * // bpm: "between 80 and 160"
 * // instruments: "Rhodes, tenor sax, upright bass, The 2-5-1 (ii-V-I) harmony, Tenor vocals, Smooth delivery"
 * // style tags: "smooth, warm, sophisticated, natural dynamics, analog warmth"
 * // recording: "late night studio session vibe, analog four-track warmth"
 */
export function buildDeterministicMaxPrompt(
  options: DeterministicOptions
): DeterministicResult {
  const { description, genreOverride, rng = Math.random } = options;

  // 1. Resolve genre - supports compound genres like "jazz rock" (up to 4)
  const { detected, displayGenre, primaryGenre, components } = resolveGenre(
    description,
    genreOverride,
    rng
  );

  // 2. Assemble instruments - blends from all genre components
  const instrumentsResult = assembleInstruments(components, rng);

  // 3. Assemble style tags - blends moods from all genre components
  const styleResult = assembleStyleTags(components, rng);

  // 4. Get recording context
  const recordingContext = selectRecordingContext(rng);

  // 5. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenre(displayGenre);

  // 6. Format the prompt using standard MAX_MODE_HEADER for consistency
  const rawPrompt = `${MAX_MODE_HEADER}

genre: "${displayGenre}"
bpm: "${bpmRange}"
instruments: "${instrumentsResult.formatted}"
style tags: "${styleResult.formatted}"
recording: "${recordingContext}"`;

  // 7. Enforce MAX_CHARS limit
  const prompt = truncatePrompt(rawPrompt);

  return {
    text: prompt,
    genre: detected ?? primaryGenre,
    metadata: {
      detectedGenre: detected,
      usedGenre: displayGenre,
      instruments: instrumentsResult.instruments,
      chordProgression: instrumentsResult.chordProgression,
      vocalStyle: instrumentsResult.vocalStyle,
      styleTags: styleResult.tags,
      recordingContext,
    },
  };
}

// =============================================================================
// Main Functions: STANDARD MODE Prompt Builder
// =============================================================================

/**
 * Build a complete STANDARD MODE prompt deterministically.
 *
 * Uses section templates from Phase 3 to generate structured prompts with
 * mood, genre, key/mode header and full section breakdowns.
 *
 * @param options - Generation options including description and optional genre override
 * @returns DeterministicResult with formatted STANDARD MODE prompt
 *
 * @example
 * const result = buildDeterministicStandardPrompt({
 *   description: 'melancholic jazz ballad',
 *   genreOverride: undefined,
 *   rng: Math.random,
 * });
 * // result.text:
 * // [Melancholic, Jazz, Key: D minor]
 * //
 * // Genre: Jazz
 * // BPM: between 80 and 160
 * // Mood: smooth, warm, sophisticated
 * // Instruments: Arpeggiated Rhodes, breathy tenor sax, walking upright bass
 * // Style Tags: smooth, warm, natural dynamics, analog warmth
 * // Recording: late night studio session vibe
 * //
 * // [INTRO] Sparse Rhodes chords with brushed drums
 * // [VERSE] Walking bass enters, saxophone weaves melodic lines
 * // ...
 */
export function buildDeterministicStandardPrompt(
  options: DeterministicOptions
): DeterministicResult {
  const { description, genreOverride, rng = Math.random } = options;

  // 1. Resolve genre - supports compound genres like "jazz rock" (up to 4)
  const { detected, displayGenre, primaryGenre, components } = resolveGenre(
    description,
    genreOverride,
    rng
  );

  // 2. Assemble instruments - blends from all genre components
  const instrumentsResult = assembleInstruments(components, rng);

  // 3. Assemble style tags - blends moods from all genre components
  const styleResult = assembleStyleTags(components, rng);

  // 4. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenre(displayGenre);

  // 5. Get genre display name - capitalize each component for display
  const genreDisplayName = components
    .map((g) => GENRE_REGISTRY[g]?.name ?? g)
    .join(' ');

  // 6. Select key and mode
  const keyMode = selectKeyAndMode(rng);

  // 7. Build section templates using primary genre
  const sectionsResult = buildAllSections({
    genre: primaryGenre,
    rng,
    trackInstruments: instrumentsResult.instruments,
  });

  // 8. Select primary mood for header (capitalize first letter)
  const primaryMood = styleResult.tags[0] ?? 'Energetic';
  const capitalizedMood = primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1);

  // 9. Articulate instruments for display in header
  const articulatedForDisplay = instrumentsResult.instruments.map((i) =>
    articulateInstrument(i, rng)
  );

  // 10. Get recording context (same as MAX MODE for remix compatibility)
  const recordingContext = selectRecordingContext(rng);

  // 11. Format the STANDARD MODE prompt (with Style Tags and Recording for remix support)
  const rawPrompt = `[${capitalizedMood}, ${genreDisplayName}, ${keyMode}]

Genre: ${genreDisplayName}
BPM: ${bpmRange}
Mood: ${styleResult.tags.slice(0, 3).join(', ')}
Instruments: ${articulatedForDisplay.join(', ')}
Style Tags: ${styleResult.formatted}
Recording: ${recordingContext}

${sectionsResult.text}`;

  // 12. Enforce MAX_CHARS limit
  const prompt = truncatePrompt(rawPrompt);

  return {
    text: prompt,
    genre: detected ?? primaryGenre,
    metadata: {
      detectedGenre: detected,
      usedGenre: displayGenre,
      instruments: instrumentsResult.instruments,
      chordProgression: instrumentsResult.chordProgression,
      vocalStyle: instrumentsResult.vocalStyle,
      styleTags: styleResult.tags,
      recordingContext,
    },
  };
}

// =============================================================================
// Test Helpers Export
// =============================================================================

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 */
export const _testHelpers = {
  detectGenreKeywordsOnly,
  selectRandomGenre,
  parseMultiGenre,
  assembleInstruments,
  assembleStyleTags,
  selectRecordingContext,
  selectMusicalKey,
  selectMusicalMode,
  selectKeyAndMode,
} as const;
