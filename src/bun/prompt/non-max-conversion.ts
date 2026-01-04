// Non-Max Format Conversion Service
// Converts Creative Boost style descriptions to proper non-max Suno format

import { generateText } from 'ai';

import { extractFirstGenre, inferBpm, enhanceInstruments, resolveGenre } from '@bun/prompt/conversion-utils';
import { APP_CONSTANTS } from '@shared/constants';
import { cleanJsonResponse } from '@shared/prompt-utils';
import { nowISO } from '@shared/utils';

import type { DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

// ============================================================================
// Types
// ============================================================================

export interface ParsedStyleDescription {
  description: string;
  detectedGenre: string | null;
  detectedMoods: string[];
  detectedInstruments: string[];
}

export interface SectionContent {
  intro: string;
  verse: string;
  chorus: string;
  bridge?: string;
  outro: string;
}

export interface NonMaxFormatFields {
  genre: string;
  bpm: number;
  mood: string;
  instruments: string;
  sections: SectionContent;
}

export interface NonMaxConversionResult {
  convertedPrompt: string;
  wasConverted: boolean;
  debugInfo?: Partial<DebugInfo>;
}

// Re-export shared utilities for backwards compatibility
export { 
  DEFAULT_BPM, 
  DEFAULT_GENRE, 
  extractFirstGenre,
  inferBpm,
  enhanceInstruments,
  resolveGenre,
} from '@bun/prompt/conversion-utils';

// ============================================================================
// Constants
// ============================================================================

// Genre keywords for detection
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

// Mood keywords for detection
const MOOD_KEYWORDS: string[] = [
  'warm', 'cold', 'dark', 'bright', 'melancholic', 'uplifting', 'energetic',
  'calm', 'intense', 'playful', 'serious', 'nostalgic', 'dreamy', 'aggressive',
  'peaceful', 'chaotic', 'romantic', 'mysterious', 'triumphant', 'somber',
  'groovy', 'mellow', 'haunting', 'euphoric', 'introspective', 'rebellious',
];

// Instrument keywords for detection
const INSTRUMENT_KEYWORDS: string[] = [
  'piano', 'guitar', 'bass', 'drums', 'violin', 'cello', 'saxophone', 'trumpet',
  'synthesizer', 'synth', 'organ', 'rhodes', 'wurlitzer', 'flute', 'clarinet',
  'harp', 'strings', 'brass', 'woodwinds', 'percussion', 'vocals', 'voice',
  'pad', 'keys', 'horns', 'bells', 'vibes', 'marimba', 'accordion',
];

// ============================================================================
// Parsing Functions
// ============================================================================

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

// ============================================================================
// AI Enhancement
// ============================================================================

/**
 * Build the system prompt for non-max conversion
 */
function buildNonMaxConversionSystemPrompt(): string {
  return `You are a music prompt conversion assistant. Given a style description, generate section content for a Suno V5 prompt.

OUTPUT FORMAT (JSON only, no markdown):
{
  "intro": "Short phrase describing the intro (sparse instrumentation setting the scene)",
  "verse": "Short phrase for verse (weave instruments into narrative)",
  "chorus": "Short phrase for chorus (peak energy, full arrangement)",
  "outro": "Short phrase for outro (resolution and fade)"
}

RULES:
1. Each section should be a flowing phrase, not a list
2. Keep each section under 50 characters
3. Reference the instruments and mood naturally
4. Create a cohesive musical journey
5. Do NOT include section tags like [INTRO] - just the content`;
}

/**
 * Build the user prompt for non-max conversion
 */
function buildNonMaxConversionUserPrompt(parsed: ParsedStyleDescription): string {
  const parts: string[] = [];

  parts.push(`Style description: ${parsed.description}`);
  
  if (parsed.detectedGenre) {
    parts.push(`Detected genre: ${parsed.detectedGenre}`);
  }
  if (parsed.detectedMoods.length > 0) {
    parts.push(`Detected moods: ${parsed.detectedMoods.join(', ')}`);
  }
  if (parsed.detectedInstruments.length > 0) {
    parts.push(`Detected instruments: ${parsed.detectedInstruments.join(', ')}`);
  }

  parts.push('\nGenerate the section content:');
  return parts.join('\n');
}

/**
 * Parse the AI response for section content
 */
function parseNonMaxAIResponse(text: string): SectionContent {
  const cleaned = cleanJsonResponse(text);

  try {
    const parsed = JSON.parse(cleaned) as Partial<SectionContent>;
    return {
      intro: parsed.intro || 'Gentle introduction',
      verse: parsed.verse || 'Building atmosphere',
      chorus: parsed.chorus || 'Full emotional peak',
      bridge: parsed.bridge,
      outro: parsed.outro || 'Fading resolution',
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      intro: 'Gentle introduction sets the mood',
      verse: 'Instruments weave together naturally',
      chorus: 'Full arrangement reaches emotional peak',
      outro: 'Peaceful resolution and fade',
    };
  }
}

/**
 * Generate section content using AI
 */
async function generateSectionContent(
  parsed: ParsedStyleDescription,
  getModel: () => LanguageModel
): Promise<{ sections: SectionContent; debugInfo?: Partial<DebugInfo> }> {
  const systemPrompt = buildNonMaxConversionSystemPrompt();
  const userPrompt = buildNonMaxConversionUserPrompt(parsed);

  const { text } = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
  });

  const sections = parseNonMaxAIResponse(text);
  return {
    sections,
    debugInfo: {
      systemPrompt,
      userPrompt,
      timestamp: nowISO(),
    },
  };
}

// ============================================================================
// Format Building
// ============================================================================

/**
 * Build the mood line from detected moods or generate default
 * Handles comma-separated multi-genre strings by using the first genre.
 */
function buildMoodLine(moods: string[], genre: string | null): string {
  if (moods.length > 0) {
    return moods.join(', ');
  }
  
  // Default moods based on genre
  const genreMoods: Record<string, string> = {
    jazz: 'smooth, sophisticated, warm',
    rock: 'energetic, powerful, raw',
    electronic: 'pulsing, futuristic, hypnotic',
    ambient: 'ethereal, dreamy, peaceful',
    folk: 'intimate, heartfelt, organic',
    classical: 'majestic, refined, emotive',
    metal: 'intense, aggressive, powerful',
    pop: 'catchy, uplifting, vibrant',
    blues: 'soulful, raw, emotional',
  };
  
  const firstGenre = genre ? extractFirstGenre(genre) : '';
  return genreMoods[firstGenre] || 'evocative, atmospheric, dynamic';
}

/**
 * Assemble final non-max format prompt from all fields
 */
export function buildNonMaxFormatPrompt(fields: NonMaxFormatFields): string {
  const lines: string[] = [];
  
  // Header line
  lines.push(`[${fields.mood}, ${fields.genre}]`);
  lines.push('');
  
  // Metadata
  lines.push(`Genre: ${fields.genre}`);
  lines.push(`BPM: ${fields.bpm}`);
  lines.push(`Mood: ${fields.mood}`);
  lines.push(`Instruments: ${fields.instruments}`);
  lines.push('');
  
  // Sections
  lines.push(`[INTRO] ${fields.sections.intro}`);
  lines.push(`[VERSE] ${fields.sections.verse}`);
  lines.push(`[CHORUS] ${fields.sections.chorus}`);
  if (fields.sections.bridge) {
    lines.push(`[BRIDGE] ${fields.sections.bridge}`);
  }
  lines.push(`[OUTRO] ${fields.sections.outro}`);

  return lines.join('\n');
}

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * Convert a Creative Boost style description to non-max Suno format
 * 
 * Genre priority:
 * 1. sunoStyles (if provided) - inject directly as-is, comma-separated (no transformation)
 * 2. seedGenres (if provided) - format using display names
 * 3. Detected from text (fallback)
 */
export async function convertToNonMaxFormat(
  styleDescription: string,
  getModel: () => LanguageModel,
  seedGenres?: string[],
  sunoStyles?: string[]
): Promise<NonMaxConversionResult> {
  // Parse the style description
  const parsed = parseStyleDescription(styleDescription);

  // Resolve effective genre using shared utility
  const genre = resolveGenre(parsed.detectedGenre, seedGenres, sunoStyles);

  // Infer BPM from lookup genre
  const bpm = inferBpm(genre.forLookup);

  // Generate section content using AI
  const { sections, debugInfo } = await generateSectionContent(parsed, getModel);

  // Build instruments string with articulations (with non-max fallback)
  const instruments = enhanceInstruments(
    parsed.detectedInstruments, 
    genre.forLookup, 
    'ambient textures, subtle pads'
  );

  // Build mood line
  const mood = buildMoodLine(parsed.detectedMoods, genre.forLookup);

  // Assemble final prompt with formatted genre labels
  const convertedPrompt = buildNonMaxFormatPrompt({
    genre: genre.forOutput,
    bpm,
    mood,
    instruments,
    sections,
  });

  return { 
    convertedPrompt, 
    wasConverted: true,
    debugInfo,
  };
}
