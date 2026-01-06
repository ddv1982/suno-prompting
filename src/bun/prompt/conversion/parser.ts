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
  'warm', 'cold', 'dark', 'bright', 'melancholic', 'uplifting', 'energetic',
  'calm', 'intense', 'playful', 'serious', 'nostalgic', 'dreamy', 'aggressive',
  'peaceful', 'chaotic', 'romantic', 'mysterious', 'triumphant', 'somber',
  'groovy', 'mellow', 'haunting', 'euphoric', 'introspective', 'rebellious',
];

/** Instrument keywords for detection */
const INSTRUMENT_KEYWORDS: string[] = [
  'piano', 'guitar', 'bass', 'drums', 'violin', 'cello', 'saxophone', 'trumpet',
  'synthesizer', 'synth', 'organ', 'rhodes', 'wurlitzer', 'flute', 'clarinet',
  'harp', 'strings', 'brass', 'woodwinds', 'percussion', 'vocals', 'voice',
  'pad', 'keys', 'horns', 'bells', 'vibes', 'marimba', 'accordion',
];

// =============================================================================
// Common Parsing Functions
// =============================================================================

/**
 * Parse comma-separated values from a regex match group
 */
export function parseCommaSeparated(match: RegExpMatchArray | null): string[] {
  if (!match?.[1]) return [];
  return match[1].split(',').map(v => v.trim()).filter(Boolean);
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
  processedIndices: Set<number>;
}

/**
 * Extract structured fields (genre, moods, instruments) from lines
 */
function extractFields(lines: string[]): ExtractedFields {
  let genre: string | null = null;
  const moods: string[] = [];
  const instruments: string[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const genreMatch = line.match(/^Genre:\s*(.+)/i);
    if (genreMatch) {
      genre = genreMatch[1]?.trim().toLowerCase() ?? null;
      processedIndices.add(i);
      continue;
    }

    const moodMatch = line.match(/^Moods?:\s*(.+)/i);
    if (moodMatch) {
      moods.push(...parseCommaSeparated(moodMatch));
      processedIndices.add(i);
      continue;
    }

    const instrumentMatch = line.match(/^Instruments?:\s*(.+)/i);
    if (instrumentMatch) {
      instruments.push(...parseCommaSeparated(instrumentMatch));
      processedIndices.add(i);
      continue;
    }

    if (line.match(/^\[[\w\s]+\]$/)) {
      processedIndices.add(i);
    }
  }

  return { genre, moods, instruments, processedIndices };
}

/**
 * Find description: first non-empty line that's not a field or section tag
 */
function findDescription(lines: string[], processedIndices: Set<number>): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || processedIndices.has(i) || line.match(/^\[[\w\s]+\]/)) continue;
    return line;
  }
  return '';
}

/**
 * Parse a non-max format prompt into structured data
 */
export function parseNonMaxPrompt(text: string): ParsedMaxPrompt {
  const lines = text.split('\n').map(l => l.trim());
  const { genre, moods, instruments, processedIndices } = extractFields(lines);
  const description = findDescription(lines, processedIndices);
  const sections = extractSections(text);

  return { description, genre, moods, instruments, sections };
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
    if (keywords.some(kw => lowerText.includes(kw))) {
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
