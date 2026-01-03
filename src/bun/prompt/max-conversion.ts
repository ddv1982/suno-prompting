// Max Mode Format Conversion Service
// Converts non-max format prompts to Max Mode format

import { generateText } from 'ai';
import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { articulateInstrument } from '@bun/prompt/articulations';
import { APP_CONSTANTS } from '@shared/constants';
import { isMaxFormat, MAX_MODE_HEADER } from '@shared/max-format';
import type { LanguageModel } from 'ai';

// Re-export isMaxFormat for consumers of this module
export { isMaxFormat } from '@shared/max-format';

// ============================================================================
// Types
// ============================================================================

export interface SectionContent {
  tag: string;
  content: string;
}

export interface ParsedPrompt {
  description: string;
  genre: string | null;
  moods: string[];
  instruments: string[];
  sections: SectionContent[];
}

export interface AIEnhancementResult {
  styleTags: string;
  recording: string;
}

export interface MaxFormatFields {
  genre: string;
  bpm: number;
  instruments: string;
  styleTags: string;
  recording: string;
}

export interface MaxConversionResult {
  convertedPrompt: string;
  wasConverted: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BPM = 90;

// Genre aliases for common variations
const GENRE_ALIASES: Record<string, string> = {
  'hip hop': 'trap',
  'hip-hop': 'trap',
  'hiphop': 'trap',
  'rnb': 'rnb',
  'r&b': 'rnb',
  'r and b': 'rnb',
  'lofi': 'lofi',
  'lo-fi': 'lofi',
  'lo fi': 'lofi',
  'edm': 'electronic',
  'dance': 'house',
  'dnb': 'electronic',
  'drum and bass': 'electronic',
  'orchestral': 'cinematic',
  'film score': 'cinematic',
  'soundtrack': 'cinematic',
  'acoustic': 'folk',
  'singer-songwriter': 'folk',
  'singer songwriter': 'folk',
  'r&b/soul': 'rnb',
  'progressive rock': 'rock',
  'prog rock': 'rock',
  'alternative': 'indie',
  'alt rock': 'indie',
  'hard rock': 'rock',
  'classic rock': 'rock',
  'nu metal': 'metal',
  'heavy metal': 'metal',
  'thrash': 'metal',
  'neo soul': 'soul',
  'neo-soul': 'soul',
  'bossa nova': 'jazz',
  'bossa': 'jazz',
  'smooth jazz': 'jazz',
  'bebop': 'jazz',
  'fusion': 'jazz',
};

// ============================================================================
// Task 1.2: Non-Max Prompt Parser
// ============================================================================

/**
 * Parse a non-max format prompt into structured data
 */
export function parseNonMaxPrompt(text: string): ParsedPrompt {
  const lines = text.split('\n').map((l) => l.trim());

  let description = '';
  let genre: string | null = null;
  const moods: string[] = [];
  const instruments: string[] = [];
  const sections: SectionContent[] = [];

  // Track which lines we've processed as fields
  const processedIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Genre: X
    const genreMatch = line.match(/^Genre:\s*(.+)/i);
    if (genreMatch) {
      genre = genreMatch[1]?.trim().toLowerCase() || null;
      processedIndices.add(i);
      continue;
    }

    // Mood: X, Y, Z or Moods: X, Y, Z
    const moodMatch = line.match(/^Moods?:\s*(.+)/i);
    if (moodMatch) {
      const moodValues = moodMatch[1]
        ?.split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      if (moodValues) moods.push(...moodValues);
      processedIndices.add(i);
      continue;
    }

    // Instrument: X, Y or Instruments: X, Y
    const instrumentMatch = line.match(/^Instruments?:\s*(.+)/i);
    if (instrumentMatch) {
      const instrumentValues = instrumentMatch[1]
        ?.split(',')
        .map((inst) => inst.trim())
        .filter(Boolean);
      if (instrumentValues) instruments.push(...instrumentValues);
      processedIndices.add(i);
      continue;
    }

    // Section tag line (e.g., [INTRO]) - mark but don't skip yet
    if (line.match(/^\[[\w\s]+\]$/)) {
      processedIndices.add(i);
      continue;
    }
  }

  // Get description: first non-empty line that's not a field and not a section tag
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (processedIndices.has(i)) continue;
    if (line.match(/^\[[\w\s]+\]/)) continue; // Skip section tags and content after them

    description = line;
    break;
  }

  // Extract sections with content using regex
  const sectionPattern = /\[([^\]]+)\]\s*\n?([\s\S]*?)(?=\[[^\]]+\]|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(text)) !== null) {
    const tag = match[1]?.trim().toUpperCase();
    const content = match[2]?.trim();
    if (tag && content) {
      sections.push({ tag, content });
    }
  }

  return { description, genre, moods, instruments, sections };
}

// ============================================================================
// Task 1.3: BPM Inference
// ============================================================================

/**
 * Normalize genre string and look up in registry or aliases
 */
function normalizeGenre(genre: string): string | null {
  const normalized = genre.toLowerCase().trim();

  // Direct registry lookup
  if (normalized in GENRE_REGISTRY) {
    return normalized;
  }

  // Check aliases
  if (normalized in GENRE_ALIASES) {
    return GENRE_ALIASES[normalized] || null;
  }

  // Try first word for compound genres like "jazz fusion"
  const firstWord = normalized.split(/[\s,]+/)[0];
  if (firstWord && firstWord in GENRE_REGISTRY) {
    return firstWord;
  }

  return null;
}

/**
 * Infer BPM from detected genre using GENRE_REGISTRY
 */
export function inferBpm(genre: string | null): number {
  if (!genre) return DEFAULT_BPM;

  const normalizedGenre = normalizeGenre(genre);
  if (!normalizedGenre) return DEFAULT_BPM;

  const genreDef = GENRE_REGISTRY[normalizedGenre as GenreType];
  if (genreDef?.bpm) {
    return genreDef.bpm.typical;
  }

  return DEFAULT_BPM;
}

// ============================================================================
// Task 1.4: AI Enhancement
// ============================================================================

/**
 * Build the system prompt for AI enhancement
 */
function buildMaxConversionSystemPrompt(): string {
  return `You are a music prompt conversion assistant. Given a parsed music prompt, generate ONLY two fields for Suno Max Mode format:

1. style tags: Recording character descriptors that describe the sonic texture (NOT genre/style). Examples:
   - "tape recorder, close-up, raw performance texture, narrow mono image"
   - "studio polish, wide stereo, pristine digital, high fidelity"
   - "lo-fi warmth, cassette saturation, room ambience, vintage character"

2. recording: A performance/capture context description. Examples:
   - "live capture in stone chapel with vintage ribbon microphone, analog console"
   - "intimate bedroom recording session, single condenser mic, natural acoustics"
   - "professional studio session, multitrack recording, isolated booth"

RULES:
- Style tags should reflect RECORDING CHARACTER, not musical genre
- Recording should describe a realistic capture scenario
- Both should complement the mood and genre
- Keep each field concise (1 line)

OUTPUT FORMAT (JSON only, no markdown):
{"styleTags": "...", "recording": "..."}`;
}

/**
 * Build the user prompt for AI enhancement
 */
function buildMaxConversionUserPrompt(parsed: ParsedPrompt): string {
  const parts: string[] = [];

  if (parsed.description) {
    parts.push(`Description: ${parsed.description}`);
  }
  if (parsed.genre) {
    parts.push(`Genre: ${parsed.genre}`);
  }
  if (parsed.moods.length > 0) {
    parts.push(`Mood: ${parsed.moods.join(', ')}`);
  }
  if (parsed.instruments.length > 0) {
    parts.push(`Instruments: ${parsed.instruments.join(', ')}`);
  }
  if (parsed.sections.length > 0) {
    parts.push('\nSection content summary:');
    for (const section of parsed.sections) {
      parts.push(`[${section.tag}] ${section.content}`);
    }
  }

  return parts.join('\n');
}

/**
 * Parse the AI response for enhancement result
 */
function parseAIEnhancementResponse(text: string): AIEnhancementResult {
  // Remove markdown code blocks if present
  const cleaned = text.trim().replace(/```json\n?|\n?```/g, '');

  try {
    const parsed = JSON.parse(cleaned) as AIEnhancementResult;
    return {
      styleTags: parsed.styleTags || 'natural dynamics, room tone, organic feel',
      recording: parsed.recording || 'studio session with warm analog character',
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      styleTags: 'natural dynamics, room tone, organic feel, subtle imperfections',
      recording: 'intimate studio session with warm analog character',
    };
  }
}

/**
 * Generate style tags and recording description using AI
 */
export async function enhanceWithAI(
  parsed: ParsedPrompt,
  getModel: () => LanguageModel
): Promise<AIEnhancementResult> {
  const systemPrompt = buildMaxConversionSystemPrompt();
  const userPrompt = buildMaxConversionUserPrompt(parsed);

  const { text } = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
  });

  return parseAIEnhancementResponse(text);
}

// ============================================================================
// Task 1.5: Build Max Format Output
// ============================================================================

/**
 * Enhance instruments list with articulations
 */
function enhanceInstruments(instruments: string[]): string {
  if (instruments.length === 0) {
    return 'ambient pad, subtle textures';
  }

  const enhanced = instruments.map((instrument) =>
    articulateInstrument(instrument, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE)
  );

  return enhanced.join(', ');
}

/**
 * Assemble final max format prompt from all fields
 */
export function buildMaxFormatPrompt(fields: MaxFormatFields): string {
  const lines = [
    MAX_MODE_HEADER,
    `genre: "${fields.genre}"`,
    `bpm: "${fields.bpm}"`,
    `instruments: "${fields.instruments}"`,
    `style tags: "${fields.styleTags}"`,
    `recording: "${fields.recording}"`,
  ];

  return lines.join('\n');
}

// ============================================================================
// Task 1.6: Main Conversion Function
// ============================================================================

/**
 * Convert a non-max format prompt to Max Mode format
 * Returns unchanged if already in max format
 */
export async function convertToMaxFormat(
  text: string,
  getModel: () => LanguageModel
): Promise<MaxConversionResult> {
  // Check if already in max format
  if (isMaxFormat(text)) {
    return { convertedPrompt: text, wasConverted: false };
  }

  // Parse the input
  const parsed = parseNonMaxPrompt(text);

  // Infer BPM from genre
  const bpm = inferBpm(parsed.genre);

  // Enhance with AI (generate style tags and recording)
  const aiResult = await enhanceWithAI(parsed, getModel);

  // Build instruments string with articulations
  const instruments = enhanceInstruments(parsed.instruments);

  // Assemble final prompt
  const convertedPrompt = buildMaxFormatPrompt({
    genre: parsed.genre || 'ambient',
    bpm,
    instruments,
    styleTags: aiResult.styleTags,
    recording: aiResult.recording,
  });

  return { convertedPrompt, wasConverted: true };
}
