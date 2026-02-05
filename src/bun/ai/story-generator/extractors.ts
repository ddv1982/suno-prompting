/**
 * Text Parsing & Extraction Functions
 *
 * Extracts structured musical data from deterministic builder output
 * for use in story generation.
 *
 * @module ai/story-generator/extractors
 */

import type { StoryGenerationInput } from './index';
import type { ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Regex pattern to match MAX Mode headers that should be stripped before LLM processing.
 * Matches bracket-style headers like [HEADER_NAME: value](optional suffix)
 */
export const MAX_HEADER_PATTERN = /^\[[A-Z_]+:[^\]]*\](?:\([^)]*\))?\s*/gim;

/**
 * Strip MAX Mode headers from deterministic text.
 * Prevents LLM from incorporating MAX terminology into narrative prose.
 */
export function stripMaxHeaders(text: string): string {
  return text.replace(MAX_HEADER_PATTERN, '').trim();
}

/** Regex patterns for extracting data from deterministic output */
export const EXTRACTION_PATTERNS = {
  genre: /(?:Genre:|genre:)\s*["']?([^"'\n]+)["']?/i,
  bpm: /(?:BPM:|bpm:)\s*["']?([^"'\n]+)["']?/i,
  key: /(?:Key:|key:)\s*["']?([^"'\n,\]]+)["']?/i,
  mood: /(?:Mood:|moods?:)\s*["']?([^"'\n]+)["']?/i,
  instruments: /(?:Instruments:|instruments:)\s*["']?([^"'\n]+)["']?/i,
  styleTags: /(?:Style Tags:|style tags:)\s*["']?([^"'\n]+)["']?/i,
  recording: /(?:Recording:|recording:)\s*["']?([^"'\n]+)["']?/i,
  header: /^\[([^\]]+)\]/,
} as const;

/**
 * Extract a single string value from text using a regex pattern.
 */
export function extractSingleValue(text: string, pattern: RegExp, fallback: string): string {
  const match = pattern.exec(text);
  return match?.[1]?.trim() ?? fallback;
}

/**
 * Extract a comma-separated list from text using a regex pattern.
 */
export function extractListValue(text: string, pattern: RegExp): string[] {
  const match = pattern.exec(text);
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Extract sub-genres from header, filtering out moods and key signatures.
 */
export function extractSubGenres(text: string, moods: string[]): string[] {
  const match = EXTRACTION_PATTERNS.header.exec(text);
  if (!match?.[1]) return [];

  const moodsLower = moods.map((m) => m.toLowerCase());
  return match[1]
    .split(',')
    .map((p) => p.trim())
    .filter(
      (p) =>
        !p.toLowerCase().includes('key') && p.length > 2 && !moodsLower.includes(p.toLowerCase())
    )
    .slice(0, 3);
}

/**
 * Extract structured data for story generation from deterministic result.
 *
 * @param deterministicText - The text output from deterministic builder
 * @param thematicContext - Optional thematic context from LLM extraction
 * @param options - Generation options containing description and sunoStyles
 * @returns StoryGenerationInput ready for LLM
 */
export function extractStructuredDataForStory(
  deterministicText: string,
  thematicContext: ThematicContext | null,
  options: {
    readonly description?: string;
    readonly sunoStyles?: readonly string[];
  }
): StoryGenerationInput {
  // Strip MAX headers to prevent LLM from incorporating MAX terminology into narrative
  const cleanText = stripMaxHeaders(deterministicText);

  // Extract values from cleaned text
  const genre = extractSingleValue(cleanText, EXTRACTION_PATTERNS.genre, 'pop');
  const bpmRange = extractSingleValue(cleanText, EXTRACTION_PATTERNS.bpm, 'natural tempo');
  const key = extractSingleValue(cleanText, EXTRACTION_PATTERNS.key, '');
  const moods = extractListValue(cleanText, EXTRACTION_PATTERNS.mood);
  const instruments = extractListValue(cleanText, EXTRACTION_PATTERNS.instruments);
  const styleTags = extractListValue(cleanText, EXTRACTION_PATTERNS.styleTags);
  const recordingContext = extractSingleValue(cleanText, EXTRACTION_PATTERNS.recording, '');

  // Extract sub-genres from header
  const subGenres = extractSubGenres(cleanText, moods);

  const isDirectMode = (options.sunoStyles?.length ?? 0) > 0;

  return {
    genre,
    subGenres: subGenres.length > 0 ? subGenres : undefined,
    bpmRange,
    key: key || undefined,
    moods,
    instruments,
    styleTags,
    recordingContext: recordingContext || undefined,
    themes: thematicContext?.themes,
    scene: thematicContext?.scene,
    era: thematicContext?.era,
    energyLevel: thematicContext?.energyLevel,
    description: options.description,
    sunoStyles: options.sunoStyles,
    isDirectMode,
  };
}
