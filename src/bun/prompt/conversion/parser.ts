/**
 * Shared parsing utilities for conversion modules
 *
 * Contains common parsing functions used by both max and non-max
 * conversion modules.
 *
 * @module prompt/conversion/parser
 */

import type { SectionContent, ParsedMaxPrompt, ParsedStyleDescription } from './types';

// =============================================================================
// Constants
// =============================================================================

/** Genre keywords for detection in non-max mode */
const GENRE_KEYWORDS: Record<string, string[]> = {
  jazz: ['jazz', 'swing', 'bebop', 'bossa', 'fusion'],
  rock: ['rock', 'guitar-driven', 'distorted'],
  electronic: ['electronic', 'synth', 'digital', 'edm'],
  ambient: ['ambient', 'atmospheric', 'ethereal', 'dreamy'],
  folk: ['folk', 'acoustic', 'singer-songwriter'],
  classical: ['classical', 'orchestral', 'symphonic'],
  hiphop: ['hip-hop', 'hip hop', 'rap', 'beats'],
  rnb: ['r&b', 'rnb', 'soul', 'neo-soul'],
  country: ['country', 'bluegrass', 'americana'],
  metal: ['metal', 'heavy', 'thrash', 'doom'],
  pop: ['pop', 'catchy', 'radio-friendly'],
  blues: ['blues', 'bluesy', 'delta'],
  funk: ['funk', 'funky', 'groovy', 'groove'],
  reggae: ['reggae', 'dub', 'ska'],
  lofi: ['lo-fi', 'lofi', 'lo fi', 'chillhop'],
};

/** Mood keywords for detection */
const MOOD_KEYWORDS: string[] = [
  'warm',
  'cold',
  'dark',
  'bright',
  'melancholic',
  'uplifting',
  'energetic',
  'calm',
  'intense',
  'playful',
  'serious',
  'nostalgic',
  'dreamy',
  'aggressive',
  'peaceful',
  'chaotic',
  'romantic',
  'mysterious',
  'triumphant',
  'somber',
  'groovy',
  'mellow',
  'haunting',
  'euphoric',
  'introspective',
  'rebellious',
];

/** Instrument keywords for detection */
const INSTRUMENT_KEYWORDS: string[] = [
  'piano',
  'guitar',
  'bass',
  'drums',
  'violin',
  'cello',
  'saxophone',
  'trumpet',
  'synthesizer',
  'synth',
  'organ',
  'rhodes',
  'wurlitzer',
  'flute',
  'clarinet',
  'harp',
  'strings',
  'brass',
  'woodwinds',
  'percussion',
  'vocals',
  'voice',
  'pad',
  'keys',
  'horns',
  'bells',
  'vibes',
  'marimba',
  'accordion',
];

// =============================================================================
// Common Parsing Functions
// =============================================================================

/**
 * Parse comma-separated values from a regex match group
 */
export function parseCommaSeparated(match: RegExpMatchArray | null): string[] {
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Extract sections with their content from text
 */
export function extractSections(text: string): SectionContent[] {
  const sections: SectionContent[] = [];
  const pattern = /\[([^\]]+)\]\s*\n?([\s\S]*?)(?=\[[^\]]+\]|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const tag = match[1]?.trim().toUpperCase();
    const content = match[2]?.trim();
    if (tag && content) {
      sections.push({ tag, content });
    }
  }
  return sections;
}

// =============================================================================
// Max Mode Parsing
// =============================================================================

interface ExtractedFields {
  genre: string | null;
  moods: string[];
  instruments: string[];
  styleTags?: string;
  recording?: string;
  bpm?: string;
  processedIndices: Set<number>;
}

/**
 * Extract structured fields from lines.
 * Supports both simple prompts and full standard mode format with Style Tags, Recording, BPM.
 */
function extractFields(lines: string[]): ExtractedFields {
  let genre: string | null = null;
  const moods: string[] = [];
  const instruments: string[] = [];
  let styleTags: string | undefined;
  let recording: string | undefined;
  let bpm: string | undefined;
  const processedIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Genre: Jazz
    const genreMatch = /^Genre:\s*(.+)/i.exec(line);
    if (genreMatch) {
      genre = genreMatch[1]?.trim().toLowerCase() ?? null;
      processedIndices.add(i);
      continue;
    }

    // Mood: smooth, warm, sophisticated
    const moodMatch = /^Moods?:\s*(.+)/i.exec(line);
    if (moodMatch) {
      moods.push(...parseCommaSeparated(moodMatch));
      processedIndices.add(i);
      continue;
    }

    // Instruments: piano, guitar, bass
    const instrumentMatch = /^Instruments?:\s*(.+)/i.exec(line);
    if (instrumentMatch) {
      instruments.push(...parseCommaSeparated(instrumentMatch));
      processedIndices.add(i);
      continue;
    }

    // Style Tags: plate reverb, warm character, wide stereo
    const styleTagsMatch = /^Style Tags?:\s*(.+)/i.exec(line);
    if (styleTagsMatch) {
      styleTags = styleTagsMatch[1]?.trim();
      processedIndices.add(i);
      continue;
    }

    // Recording: intimate jazz club session
    const recordingMatch = /^Recording:\s*(.+)/i.exec(line);
    if (recordingMatch) {
      recording = recordingMatch[1]?.trim();
      processedIndices.add(i);
      continue;
    }

    // BPM: between 80 and 160 (or just "120")
    const bpmMatch = /^BPM:\s*(.+)/i.exec(line);
    if (bpmMatch) {
      bpm = bpmMatch[1]?.trim();
      processedIndices.add(i);
      continue;
    }

    // Mark header lines like [Mood, Genre, Key: X mode] as processed
    if (/^\[[\w\s,:-]+\]$/.exec(line)) {
      processedIndices.add(i);
    }
  }

  return { genre, moods, instruments, styleTags, recording, bpm, processedIndices };
}

/**
 * Find description: first non-empty line that's not a field or section tag
 */
function findDescription(lines: string[], processedIndices: Set<number>): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || processedIndices.has(i) || /^\[[\w\s]+\]/.exec(line)) continue;
    return line;
  }
  return '';
}

/**
 * Parse a non-max format prompt into structured data.
 * Extracts all standard mode fields including Style Tags, Recording, and BPM.
 */
export function parseNonMaxPrompt(text: string): ParsedMaxPrompt {
  const lines = text.split('\n').map((l) => l.trim());
  const { genre, moods, instruments, styleTags, recording, bpm, processedIndices } =
    extractFields(lines);
  const description = findDescription(lines, processedIndices);
  const sections = extractSections(text);

  return { description, genre, moods, instruments, sections, styleTags, recording, bpm };
}

// =============================================================================
// Non-Max Mode Parsing
// =============================================================================

/**
 * Parse a style description to extract genre, mood, and instruments
 */
export function parseStyleDescription(text: string): ParsedStyleDescription {
  const lowerText = text.toLowerCase();

  // Detect genre
  let detectedGenre: string | null = null;
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      detectedGenre = genre;
      break;
    }
  }

  // Detect moods
  const detectedMoods: string[] = [];
  for (const mood of MOOD_KEYWORDS) {
    if (lowerText.includes(mood)) {
      detectedMoods.push(mood);
    }
  }

  // Detect instruments
  const detectedInstruments: string[] = [];
  for (const instrument of INSTRUMENT_KEYWORDS) {
    if (lowerText.includes(instrument)) {
      detectedInstruments.push(instrument);
    }
  }

  return {
    description: text,
    detectedGenre,
    detectedMoods: detectedMoods.slice(0, 3), // Max 3 moods
    detectedInstruments: detectedInstruments.slice(0, 4), // Max 4 instruments
  };
}
