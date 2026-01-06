/**
 * Context Preservation Module
 *
 * Provides deterministic pre-formatting of prompt output fields to ensure
 * detected context (BPM, vocal style, chord progression) is preserved
 * through LLM enhancement.
 */

import { z } from 'zod';

import { selectInstrumentsForGenre } from '@bun/instruments/services/select';
import { articulateInstrument } from '@bun/prompt/articulations';
import { formatBpmRange, getBlendedBpmRange } from '@bun/prompt/bpm';
import { buildProgressionDescriptor } from '@bun/prompt/chord-progressions';
import { buildPerformanceGuidance, parseGenreComponents } from '@bun/prompt/genre-parser';
import { injectVocalStyleIntoInstrumentsCsv } from '@bun/prompt/instruments-injection';
import { APP_CONSTANTS, DEFAULT_GENRE } from '@shared/constants';
import { MAX_MODE_HEADER } from '@shared/max-format';

import type { GenreType } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';

/**
 * Context for pre-formatting prompt output.
 */
export interface PreFormatContext {
  /** Detected genre string (single or compound) */
  readonly detectedGenre: string;
  /** User-specified instruments to include */
  readonly userInstruments: string[];
  /** Pre-computed performance guidance (vocal, production, instruments) */
  readonly performanceGuidance?: {
    readonly vocal: string;
    readonly production: string;
    readonly instruments: string[];
  } | null;
  /** Random number generator for articulation */
  readonly rng?: Rng;
}

/**
 * Pre-formatted output for Max Mode prompts.
 */
export interface PreFormattedMaxOutput {
  /** Genre string (exact as detected or DEFAULT_GENRE fallback) */
  readonly genre: string;
  /** BPM range in format "between X and Y" */
  readonly bpm: string;
  /** Instruments CSV with vocal style and chord progression */
  readonly instruments: string;
  /** Full chord progression descriptor */
  readonly chordProgression: string;
}

/**
 * Pre-formatted output for Standard Mode prompts.
 */
export interface PreFormattedStandardOutput {
  /** Genre string (exact as detected or DEFAULT_GENRE fallback) */
  readonly genre: string;
  /** BPM range in format "between X and Y" */
  readonly bpm: string;
  /** Mood keywords (up to 3, comma-separated) */
  readonly mood: string;
  /** Instruments CSV with vocal style and chord progression */
  readonly instruments: string;
}

const DEFAULT_BPM_RANGE = 'between 90 and 130';
const DEFAULT_MOOD = 'evocative, dynamic';

/**
 * Build pre-formatted Max Mode output with deterministic context preservation.
 * Returns structured fields that MUST be preserved in final output.
 */
export function buildPreFormattedMaxOutput(context: PreFormatContext): PreFormattedMaxOutput {
  const { detectedGenre, userInstruments, performanceGuidance, rng = Math.random } = context;

  // 1. Genre: exact as detected, fallback to 'acoustic'
  const genre = detectedGenre || DEFAULT_GENRE;

  // 2. BPM: exact range format
  const bpmRange = getBlendedBpmRange(genre);
  const bpm = bpmRange ? formatBpmRange(bpmRange) : DEFAULT_BPM_RANGE;

  // 3. Chord progression: name + description
  const chordProgression = buildProgressionDescriptor(genre, rng);

  // 4. Instruments with vocal style injected
  const guidance = performanceGuidance ?? buildPerformanceGuidance(genre, rng);
  const instrumentsList = buildInstrumentsList(genre, userInstruments, chordProgression, guidance, rng);

  // Inject vocal style
  const vocalStyle = guidance?.vocal;
  const instruments = injectVocalStyleIntoInstrumentsCsv(instrumentsList, vocalStyle);

  return {
    genre,
    bpm,
    instruments,
    chordProgression,
  };
}

/**
 * Build pre-formatted Standard Mode output with deterministic context preservation.
 */
export function buildPreFormattedStandardOutput(
  context: PreFormatContext,
  detectedMoods: string[]
): PreFormattedStandardOutput {
  const { detectedGenre, userInstruments, performanceGuidance, rng = Math.random } = context;

  // 1. Genre: exact as detected, fallback to 'acoustic'
  const genre = detectedGenre || DEFAULT_GENRE;

  // 2. BPM: exact range format
  const bpmRange = getBlendedBpmRange(genre);
  const bpm = bpmRange ? formatBpmRange(bpmRange) : DEFAULT_BPM_RANGE;

  // 3. Mood: first 3 detected moods, or fallback
  const mood =
    detectedMoods.length > 0 ? detectedMoods.slice(0, 3).join(', ') : DEFAULT_MOOD;

  // 4. Instruments with vocal style and chord progression
  const guidance = performanceGuidance ?? buildPerformanceGuidance(genre, rng);
  const chordProgression = buildProgressionDescriptor(genre, rng);
  const instrumentsList = buildInstrumentsList(genre, userInstruments, chordProgression, guidance, rng);

  // Inject vocal style
  const vocalStyle = guidance?.vocal;
  const instruments = injectVocalStyleIntoInstrumentsCsv(instrumentsList, vocalStyle);

  return {
    genre,
    bpm,
    mood,
    instruments,
  };
}

/**
 * Format the pre-built output structure into the Max Mode prompt format.
 */
export function formatPreBuiltMaxOutput(
  preFormatted: PreFormattedMaxOutput,
  styleTags: string,
  recording: string
): string {
  return [
    MAX_MODE_HEADER,
    `genre: "${preFormatted.genre}"`,
    `bpm: "${preFormatted.bpm}"`,
    `instruments: "${preFormatted.instruments}"`,
    `style tags: "${styleTags}"`,
    `recording: "${recording}"`,
  ].join('\n');
}

/**
 * Schema for validating LLM enhancement response.
 * Requires non-empty styleTags and recording fields.
 */
const MaxEnhancementResponseSchema = z.object({
  styleTags: z.string().min(1),
  recording: z.string().min(1),
});

/**
 * Parse LLM response for pre-formatted Max Mode (only styleTags and recording).
 * Uses Zod validation to ensure response has required non-empty fields.
 *
 * @param rawResponse - Raw LLM response text, may include markdown code blocks
 * @returns Parsed styleTags and recording, or null if invalid
 *
 * @example
 * const response = '{"styleTags": "smooth, warm", "recording": "studio session"}';
 * const result = parseMaxEnhancementResponse(response);
 * // { styleTags: "smooth, warm", recording: "studio session" }
 *
 * @example
 * const invalid = '{"styleTags": "", "recording": "studio"}';
 * const result = parseMaxEnhancementResponse(invalid);
 * // null (empty styleTags)
 */
export function parseMaxEnhancementResponse(
  rawResponse: string
): { styleTags: string; recording: string } | null {
  try {
    // Clean markdown code blocks if present
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned) as unknown;
    const validated = MaxEnhancementResponseSchema.parse(parsed);

    return {
      styleTags: validated.styleTags.trim(),
      recording: validated.recording.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Build instruments list with articulation and chord progression.
 */
function buildInstrumentsList(
  genre: string,
  userInstruments: string[],
  chordProgression: string,
  guidance: { instruments: string[] } | null | undefined,
  rng: Rng
): string {
  // Get genre components for instrument selection
  const components = parseGenreComponents(genre);
  const primaryGenre = components[0] as GenreType | undefined;

  // Select instruments: use guidance if available, otherwise select for genre
  let baseInstruments: string[];
  if (guidance?.instruments && guidance.instruments.length > 0) {
    baseInstruments = guidance.instruments;
  } else if (primaryGenre) {
    baseInstruments = selectInstrumentsForGenre(primaryGenre, {
      userInstruments,
      rng,
    });
  } else {
    baseInstruments = userInstruments.length > 0 ? userInstruments : ['piano', 'bass'];
  }

  // Apply articulations
  const articulated = baseInstruments.map((i) =>
    articulateInstrument(i, rng, APP_CONSTANTS.ARTICULATION_CHANCE)
  );

  // Append chord progression harmony
  const instrumentsWithProgression = [...articulated, `${chordProgression} harmony`];

  return instrumentsWithProgression.join(', ');
}
