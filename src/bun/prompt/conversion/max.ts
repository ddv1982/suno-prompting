/**
 * Max Mode Format Conversion Service
 *
 * Converts non-max format prompts to Max Mode format.
 *
 * @module prompt/conversion/max
 */

import { callLLM } from '@bun/ai/llm-utils';
import { inferBpm, enhanceInstruments, resolveGenre } from '@bun/prompt/conversion-utils';
import { injectVocalStyleIntoInstrumentsCsv } from '@bun/prompt/instruments-injection';
import { isMaxFormat, MAX_MODE_HEADER } from '@shared/max-format';
import { cleanJsonResponse } from '@shared/prompt-utils';
import { nowISO } from '@shared/utils';

import { parseNonMaxPrompt } from './parser';

import type { ParsedMaxPrompt, AIEnhancementResult, MaxFormatFields, MaxConversionResult } from './types';
import type { ConversionOptions } from '@shared/types';
import type { LanguageModel } from 'ai';

// Re-exports for backwards compatibility
export { isMaxFormat } from '@shared/max-format';

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

// Re-export types for backwards compatibility
export type { 
  SectionContent,
  ParsedMaxPrompt as ParsedPrompt,
  AIEnhancementResult,
  MaxFormatFields,
  MaxConversionResult,
} from './types';

// Re-export parsing functions for backwards compatibility
export { parseNonMaxPrompt } from './parser';

// Re-export for backwards compatibility
export type { ConversionOptions } from '@shared/types';

// =============================================================================
// AI Enhancement
// =============================================================================

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
function buildMaxConversionUserPrompt(parsed: ParsedMaxPrompt): string {
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
  parsed: ParsedMaxPrompt,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<AIEnhancementResult> {
  const systemPrompt = buildMaxConversionSystemPrompt();
  const userPrompt = buildMaxConversionUserPrompt(parsed);

  const text = await callLLM({
    getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'max mode conversion',
    ollamaEndpoint,
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

// =============================================================================
// Format Building
// =============================================================================

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

// =============================================================================
// Main Conversion Function
// =============================================================================

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
  const { seedGenres, sunoStyles, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange, ollamaEndpoint } = options;
  // Check if already in max format
  if (isMaxFormat(text)) {
    return { convertedPrompt: text, wasConverted: false };
  }

  // Parse the input
  const parsed = parseNonMaxPrompt(text);

  // Resolve effective genre using shared utility
  const genre = resolveGenre(parsed.genre, seedGenres, sunoStyles);

  // Use provided bpmRange if available, otherwise infer from genre
  const bpm = bpmRange ?? inferBpm(genre.forLookup);

  // Enhance with AI (generate style tags and recording)
  const aiResult = await enhanceWithAI(parsed, getModel, ollamaEndpoint);

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
