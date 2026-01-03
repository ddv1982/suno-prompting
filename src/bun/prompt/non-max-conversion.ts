// Non-Max Format Conversion Service
// Converts Creative Boost style descriptions to proper non-max Suno format

import { generateText } from 'ai';
import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { selectInstrumentsForGenre } from '@bun/instruments/guidance';
import { articulateInstrument } from '@bun/prompt/articulations';
import { APP_CONSTANTS } from '@shared/constants';
import type { LanguageModel } from 'ai';
import type { DebugInfo } from '@shared/types';

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

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BPM = 90;
const DEFAULT_GENRE = 'ambient';

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

/**
 * Infer BPM from detected genre using GENRE_REGISTRY
 */
export function inferBpm(genre: string | null): number {
  if (!genre) return DEFAULT_BPM;

  const normalizedGenre = genre.toLowerCase().trim();
  
  // Direct registry lookup
  if (normalizedGenre in GENRE_REGISTRY) {
    const genreDef = GENRE_REGISTRY[normalizedGenre as GenreType];
    if (genreDef?.bpm) {
      return genreDef.bpm.typical;
    }
  }

  return DEFAULT_BPM;
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
  const cleaned = text.trim().replace(/```json\n?|\n?```/g, '');

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
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Format Building
// ============================================================================

/**
 * Enhance instruments list with articulations.
 * If no instruments detected, selects genre-appropriate defaults.
 */
function enhanceInstruments(instruments: string[], genre: string | null): string {
  let instrumentList = instruments;
  
  // If no instruments provided, select genre-appropriate defaults
  if (instrumentList.length === 0) {
    const normalizedGenre = genre?.toLowerCase().trim() || null;
    if (normalizedGenre && normalizedGenre in GENRE_REGISTRY) {
      instrumentList = selectInstrumentsForGenre(normalizedGenre as GenreType, { maxTags: 3 });
    } else {
      return 'ambient textures, subtle pads';
    }
  }

  const enhanced = instrumentList.map((instrument) =>
    articulateInstrument(instrument, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE)
  );

  return enhanced.join(', ');
}

/**
 * Build the mood line from detected moods or generate default
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
  
  return genreMoods[genre || ''] || 'evocative, atmospheric, dynamic';
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
 */
export async function convertToNonMaxFormat(
  styleDescription: string,
  getModel: () => LanguageModel
): Promise<NonMaxConversionResult> {
  // Parse the style description
  const parsed = parseStyleDescription(styleDescription);

  // Determine effective genre
  const effectiveGenre = parsed.detectedGenre || DEFAULT_GENRE;

  // Infer BPM from genre
  const bpm = inferBpm(effectiveGenre);

  // Generate section content using AI
  const { sections, debugInfo } = await generateSectionContent(parsed, getModel);

  // Build instruments string with articulations
  const instruments = enhanceInstruments(parsed.detectedInstruments, effectiveGenre);

  // Build mood line
  const mood = buildMoodLine(parsed.detectedMoods, effectiveGenre);

  // Assemble final prompt
  const convertedPrompt = buildNonMaxFormatPrompt({
    genre: effectiveGenre,
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
