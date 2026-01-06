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
  /** Detected or selected genre */
  readonly genre: GenreType | null;
  /** Debug metadata (when debug mode enabled) */
  readonly metadata?: {
    readonly detectedGenre: GenreType | null;
    readonly usedGenre: GenreType;
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

/** Max Mode header tags for Suno V5 */
const MAX_MODE_TAGS = `::tags realistic music ::
::quality maximum ::
::style suno v5 ::`;

/** All genre keys for random selection */
const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as GenreType[];

/** Maximum character limit for prompts */
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

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
export function detectGenreKeywordsOnly(description: string): GenreType | null {
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
export function selectRandomGenre(rng: () => number = Math.random): GenreType {
  const idx = Math.floor(rng() * ALL_GENRE_KEYS.length);
  return ALL_GENRE_KEYS[idx] ?? 'pop';
}

/**
 * Resolve the effective genre from description and optional override.
 * Priority: genreOverride > detected genre > random fallback
 *
 * @param description - User's song description
 * @param genreOverride - Optional genre override
 * @param rng - Random number generator
 * @returns Resolved genre type
 *
 * @example
 * resolveGenre('smooth jazz night', undefined, Math.random)
 * // { detected: 'jazz', used: 'jazz' }
 *
 * @example
 * resolveGenre('random words', 'rock', Math.random)
 * // { detected: null, used: 'rock' }
 */
function resolveGenre(
  description: string,
  genreOverride: string | undefined,
  rng: () => number
): { detected: GenreType | null; used: GenreType } {
  // 1. Try genre override (validate it exists in registry)
  if (genreOverride) {
    const normalizedOverride = genreOverride.toLowerCase().trim();
    if (normalizedOverride in GENRE_REGISTRY) {
      return { detected: null, used: normalizedOverride as GenreType };
    }
    // Invalid override - log warning and fall through to keyword detection
    log.warn('invalid_genre_override', { genreOverride, normalized: normalizedOverride });
  }

  // 2. Try keyword detection
  const detected = detectGenreKeywordsOnly(description);
  if (detected) {
    return { detected, used: detected };
  }

  // 3. Fallback to random genre
  return { detected: null, used: selectRandomGenre(rng) };
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
export function parseMultiGenre(description: string): GenreType | null {
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
 *
 * @param genre - Target genre
 * @param rng - Random number generator
 * @returns Formatted instruments string for prompt
 *
 * @example
 * assembleInstruments('jazz', Math.random)
 * // "Arpeggiated Rhodes, breathy tenor sax, walking upright bass, The 2-5-1 (ii-V-I) harmony, Tenor vocals, Smooth delivery"
 */
export function assembleInstruments(
  genre: GenreType,
  rng: () => number = Math.random
): { instruments: readonly string[]; formatted: string; chordProgression: string; vocalStyle: string } {
  // Select base instruments for the genre
  const baseInstruments = selectInstrumentsForGenre(genre, {
    maxTags: 4,
    rng,
  });

  // Apply articulations to instruments
  const articulatedInstruments = baseInstruments.map((instrument) =>
    articulateInstrument(instrument, rng)
  );

  // Get chord progression
  const progression = getRandomProgressionForGenre(genre, rng);
  const progressionTag = `${progression.name} (${progression.pattern}) harmony`;

  // Get vocal suggestions
  const vocals = getVocalSuggestionsForGenre(genre, rng);
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
 *
 * @param genre - Target genre
 * @param rng - Random number generator
 * @returns Formatted style tags string and array
 *
 * @example
 * assembleStyleTags('jazz', Math.random)
 * // { tags: ['smooth', 'warm', 'sophisticated', 'natural dynamics', 'analog warmth'], formatted: '...' }
 */
export function assembleStyleTags(
  genre: GenreType,
  rng: () => number = Math.random
): { tags: readonly string[]; formatted: string } {
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

  // 1. Select moods from genre.moods pool (2-3 moods)
  const moods = selectMoodsForGenre(genre, 3, rng);
  for (const mood of moods) {
    addUnique(mood);
  }

  // 2. Select realism or electronic tags based on genre
  let styleTags: string[];
  if (isElectronicGenre(genre)) {
    styleTags = selectElectronicTags(3);
  } else {
    styleTags = selectRealismTags(genre, 3);
  }

  // If no genre-specific tags, fall back to generic tags
  if (styleTags.length === 0) {
    styleTags = selectGenericTags(3);
  }

  for (const tag of styleTags) {
    addUnique(tag);
  }

  // 3. Add production descriptor elements
  const productionDesc = buildProductionDescriptor(genre, rng);
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
export function selectRecordingContext(
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
 * Get formatted BPM range for a genre.
 *
 * @param genre - Target genre
 * @returns Formatted BPM range string or fallback
 */
function getBpmRangeForGenre(genre: GenreType): string {
  const range = getBlendedBpmRange(genre);
  if (range) {
    return formatBpmRange(range);
  }

  // Fallback to genre definition
  const genreDef = GENRE_REGISTRY[genre];
  if (genreDef?.bpm) {
    return `between ${genreDef.bpm.min} and ${genreDef.bpm.max}`;
  }

  // Ultimate fallback
  return 'between 90 and 140';
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
export function selectMusicalKey(rng: () => number = Math.random): string {
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
export function selectMusicalMode(rng: () => number = Math.random): string {
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
export function selectKeyAndMode(rng: () => number = Math.random): string {
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

  // 1. Resolve genre
  const { detected, used: genre } = resolveGenre(description, genreOverride, rng);

  // 2. Assemble instruments
  const instrumentsResult = assembleInstruments(genre, rng);

  // 3. Assemble style tags
  const styleResult = assembleStyleTags(genre, rng);

  // 4. Get recording context
  const recordingContext = selectRecordingContext(rng);

  // 5. Get BPM range
  const bpmRange = getBpmRangeForGenre(genre);

  // 6. Format the prompt
  const rawPrompt = `${MAX_MODE_TAGS}

genre: "${genre}"
bpm: "${bpmRange}"
instruments: "${instrumentsResult.formatted}"
style tags: "${styleResult.formatted}"
recording: "${recordingContext}"`;

  // 7. Enforce MAX_CHARS limit
  const prompt = truncatePrompt(rawPrompt);

  return {
    text: prompt,
    genre: detected ?? genre,
    metadata: {
      detectedGenre: detected,
      usedGenre: genre,
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
 * //
 * // [INTRO] Sparse Rhodes chords with brushed drums
 * // [VERSE] Walking bass enters, saxophone weaves melodic lines
 * // [CHORUS] Full arrangement, layered harmonies, emotional peak
 * // [BRIDGE] Stripped down, intimate piano solo
 * // [OUTRO] Fade with soft saxophone and gentle cymbal swells
 */
export function buildDeterministicStandardPrompt(
  options: DeterministicOptions
): DeterministicResult {
  const { description, genreOverride, rng = Math.random } = options;

  // 1. Resolve genre (priority: override > detected > random)
  const { detected, used: genre } = resolveGenre(description, genreOverride, rng);

  // 2. Assemble instruments (for header display)
  const instrumentsResult = assembleInstruments(genre, rng);

  // 3. Assemble style tags (used for moods)
  const styleResult = assembleStyleTags(genre, rng);

  // 4. Get BPM range
  const bpmRange = getBpmRangeForGenre(genre);

  // 5. Get genre display name
  const genreDef = GENRE_REGISTRY[genre];
  const genreDisplayName = genreDef?.name ?? genre;

  // 6. Select key and mode
  const keyMode = selectKeyAndMode(rng);

  // 7. Build section templates using Phase 3 implementation
  const sectionsResult = buildAllSections({
    genre,
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

  // 10. Format the STANDARD MODE prompt
  const rawPrompt = `[${capitalizedMood}, ${genreDisplayName}, ${keyMode}]

Genre: ${genreDisplayName}
BPM: ${bpmRange}
Mood: ${styleResult.tags.slice(0, 3).join(', ')}
Instruments: ${articulatedForDisplay.join(', ')}

${sectionsResult.text}`;

  // 11. Enforce MAX_CHARS limit
  const prompt = truncatePrompt(rawPrompt);

  return {
    text: prompt,
    genre: detected ?? genre,
    metadata: {
      detectedGenre: detected,
      usedGenre: genre,
      instruments: instrumentsResult.instruments,
      chordProgression: instrumentsResult.chordProgression,
      vocalStyle: instrumentsResult.vocalStyle,
      styleTags: styleResult.tags,
      recordingContext: '',
    },
  };
}
