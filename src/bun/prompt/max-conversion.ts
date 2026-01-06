// Max Mode Format Conversion Service
// Converts non-max format prompts to Max Mode format

import { generateText } from 'ai';

import { inferBpm, enhanceInstruments, resolveGenre } from '@bun/prompt/conversion-utils';
import { injectVocalStyleIntoInstrumentsCsv } from '@bun/prompt/instruments-injection';
import { APP_CONSTANTS } from '@shared/constants';
import { isMaxFormat, MAX_MODE_HEADER } from '@shared/max-format';
import { cleanJsonResponse } from '@shared/prompt-utils';
import { nowISO } from '@shared/utils';

import type { ConversionOptions, DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

// Re-exports for backwards compatibility
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
  debugInfo?: Partial<DebugInfo>;
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
  debugInfo?: Partial<DebugInfo>;
}

// Re-export shared utilities for backwards compatibility with existing consumers
export { 
  DEFAULT_BPM, 
  DEFAULT_GENRE, 
  DEFAULT_INSTRUMENTS_FALLBACK,
  GENRE_ALIASES,
  normalizeGenre,
  inferBpm,
  enhanceInstruments,
  resolveGenre,
} from '@bun/prompt/conversion-utils';

// ============================================================================
// Task 1.2: Non-Max Prompt Parser
// ============================================================================

/** Parse comma-separated values from a regex match group */
function parseCommaSeparated(match: RegExpMatchArray | null): string[] {
  if (!match?.[1]) return [];
  return match[1].split(',').map(v => v.trim()).filter(Boolean);
}

interface ExtractedFields {
  genre: string | null;
  moods: string[];
  instruments: string[];
  processedIndices: Set<number>;
}

/** Extract structured fields (genre, moods, instruments) from lines */
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

/** Find description: first non-empty line that's not a field or section tag */
function findDescription(lines: string[], processedIndices: Set<number>): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || processedIndices.has(i) || line.match(/^\[[\w\s]+\]/)) continue;
    return line;
  }
  return '';
}

/** Extract sections with their content from text */
function extractSections(text: string): SectionContent[] {
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

/**
 * Parse a non-max format prompt into structured data
 */
export function parseNonMaxPrompt(text: string): ParsedPrompt {
  const lines = text.split('\n').map(l => l.trim());
  const { genre, moods, instruments, processedIndices } = extractFields(lines);
  const description = findDescription(lines, processedIndices);
  const sections = extractSections(text);

  return { description, genre, moods, instruments, sections };
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
  const cleaned = cleanJsonResponse(text);

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

  const result = parseAIEnhancementResponse(text);
  return {
    ...result,
    debugInfo: {
      systemPrompt,
      userPrompt,
      timestamp: nowISO(),
    },
  };
}

// ============================================================================
// Task 1.5: Build Max Format Output
// ============================================================================

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

// Re-export for backwards compatibility
export type { ConversionOptions } from '@shared/types';

/**
 * Convert a non-max format prompt to Max Mode format
 * Returns unchanged if already in max format
 * 
 * Genre priority:
 * 1. sunoStyles (if provided) - inject directly as-is, comma-separated (no transformation)
 * 2. seedGenres (if provided) - format using display names
 * 3. Detected from text (fallback)
 */
export async function convertToMaxFormat(
  text: string,
  getModel: () => LanguageModel,
  options: ConversionOptions = {}
): Promise<MaxConversionResult> {
  const { seedGenres, sunoStyles, performanceInstruments, performanceVocalStyle, chordProgression } = options;
  // Check if already in max format
  if (isMaxFormat(text)) {
    return { convertedPrompt: text, wasConverted: false };
  }

  // Parse the input
  const parsed = parseNonMaxPrompt(text);

  // Resolve effective genre using shared utility
  const genre = resolveGenre(parsed.genre, seedGenres, sunoStyles);

  // Infer BPM from lookup genre
  const bpm = inferBpm(genre.forLookup);

  // Enhance with AI (generate style tags and recording)
  const aiResult = await enhanceWithAI(parsed, getModel);

  // Build instruments string with articulations (genre-aware defaults)
  const baseInstruments = enhanceInstruments(parsed.instruments, genre.forLookup, undefined, performanceInstruments);

  // Append chord progression harmony if provided
  const instrumentsWithProgression = chordProgression
    ? `${baseInstruments}, ${chordProgression} harmony`
    : baseInstruments;

  const instruments = injectVocalStyleIntoInstrumentsCsv(instrumentsWithProgression, performanceVocalStyle);

  // Assemble final prompt with formatted genre labels
  const convertedPrompt = buildMaxFormatPrompt({
    genre: genre.forOutput,
    bpm,
    instruments,
    styleTags: aiResult.styleTags,
    recording: aiResult.recording,
  });

  return { 
    convertedPrompt, 
    wasConverted: true,
    debugInfo: aiResult.debugInfo,
  };
}
