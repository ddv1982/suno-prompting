/**
 * Non-Max Format Conversion Service
 *
 * Converts Creative Boost style descriptions to proper non-max Suno format.
 *
 * @module prompt/conversion/non-max
 */

import { callLLM } from '@bun/ai/llm-utils';
import {
  extractFirstGenre,
  inferBpm,
  enhanceInstruments,
  resolveGenre,
} from '@bun/prompt/conversion-utils';
import { injectVocalStyleIntoInstrumentsCsv } from '@bun/prompt/instruments-injection';
import { cleanJsonResponse } from '@shared/prompt-utils';

import { parseStyleDescription } from './parser';

import type {
  ParsedStyleDescription,
  NonMaxSectionContent,
  NonMaxFormatFields,
  NonMaxConversionResult,
} from './types';
import type { ConversionOptions } from '@shared/types';
import type { LanguageModel } from 'ai';

// Re-export shared utilities for backwards compatibility
export {
  DEFAULT_BPM,
  DEFAULT_GENRE,
  extractFirstGenre,
  inferBpm,
  enhanceInstruments,
  resolveGenre,
} from '@bun/prompt/conversion-utils';

// Re-export types for backwards compatibility
export type {
  ParsedStyleDescription,
  NonMaxSectionContent as SectionContent,
  NonMaxFormatFields,
  NonMaxConversionResult,
} from './types';

// Re-export parsing functions for backwards compatibility
export { parseStyleDescription } from './parser';

// Re-export for backwards compatibility
export type { ConversionOptions } from '@shared/types';

// =============================================================================
// AI Enhancement
// =============================================================================

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
function parseNonMaxAIResponse(text: string): NonMaxSectionContent {
  const cleaned = cleanJsonResponse(text);

  try {
    const parsed = JSON.parse(cleaned) as Partial<NonMaxSectionContent>;
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
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<{ sections: NonMaxSectionContent }> {
  const systemPrompt = buildNonMaxConversionSystemPrompt();
  const userPrompt = buildNonMaxConversionUserPrompt(parsed);

  const text = await callLLM({
    getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'non-max section content',
    ollamaEndpoint,
  });

  const sections = parseNonMaxAIResponse(text);
  return {
    sections,
  };
}

// =============================================================================
// Format Building
// =============================================================================

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

// =============================================================================
// Main Conversion Function
// =============================================================================

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
  options: ConversionOptions = {}
): Promise<NonMaxConversionResult> {
  const {
    seedGenres,
    sunoStyles,
    performanceInstruments,
    performanceVocalStyle,
    chordProgression,
    bpmRange,
    ollamaEndpoint,
  } = options;
  // Parse the style description
  const parsed = parseStyleDescription(styleDescription);

  // Resolve effective genre using shared utility
  const genre = resolveGenre(parsed.detectedGenre, seedGenres, sunoStyles);

  // Use provided bpmRange if available, otherwise infer from genre
  const bpm = bpmRange ?? inferBpm(genre.forLookup);

  // Generate section content using AI
  const { sections } = await generateSectionContent(parsed, getModel, ollamaEndpoint);

  // Build instruments string with articulations (with non-max fallback)
  const baseInstruments = enhanceInstruments(
    parsed.detectedInstruments,
    genre.forLookup,
    'ambient textures, subtle pads',
    performanceInstruments
  );

  // Append chord progression harmony if provided
  const instrumentsWithProgression = chordProgression
    ? `${baseInstruments}, ${chordProgression} harmony`
    : baseInstruments;

  const instruments = injectVocalStyleIntoInstrumentsCsv(
    instrumentsWithProgression,
    performanceVocalStyle
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
  };
}
