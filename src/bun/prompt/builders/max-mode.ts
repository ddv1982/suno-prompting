/**
 * Max Mode prompt builders
 * @module prompt/builders/max-mode
 */

import { selectInstrumentsForGenre, extractInstruments, getMultiGenreNuanceGuidance } from '@bun/instruments';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildProgressionDescriptor } from '@bun/prompt/chord-progressions';
import { buildPerformanceGuidance, parseGenreComponents } from '@bun/prompt/genre-parser';
import { CONTEXT_INTEGRATION_INSTRUCTIONS, JSON_OUTPUT_FORMAT_RULES } from '@bun/prompt/shared-instructions';
import { MAX_MODE_HEADER } from '@bun/prompt/tags';
import { APP_CONSTANTS, DEFAULT_GENRE } from '@shared/constants';

import { buildSongConceptParts } from './shared';

import type { ModeSelection } from '@bun/instruments/selection';
import type { PreFormattedMaxOutput } from '@bun/prompt/context-preservation';

/**
 * Build Max Mode system prompt - uses metadata-style formatting for higher quality
 */
export function buildMaxModeSystemPrompt(
  maxChars: number,
  preFormattedOutput?: PreFormattedMaxOutput
): string {
  // When pre-formatted output is provided, LLM only generates styleTags and recording
  if (preFormattedOutput) {
    return `You are a music prompt writer for Suno V5 MAX MODE. You are enhancing a pre-formatted prompt.

PRE-FORMATTED OUTPUT (these fields are ALREADY SET - do NOT modify):
- genre: "${preFormattedOutput.genre}"
- bpm: "${preFormattedOutput.bpm}"
- instruments: "${preFormattedOutput.instruments}"

YOUR TASK: Generate ONLY these two fields:
1. styleTags: Blend the detected mood, production style, and chord feel naturally
2. recording: A session description reflecting the production style and mood

OUTPUT FORMAT - Return valid JSON:
{
  "styleTags": "<mood + production + chord feel blended naturally>",
  "recording": "<session description reflecting production style and mood>"
}

STYLE TAGS GUIDANCE:
- Blend detected mood keywords, chord progression feel, production style, and texture
- Formula: "<mood keywords>, <chord progression feel>, <production style>, <texture descriptors>"
- Example: "smooth, laid back, bossa nova harmony, organic feel, studio reverb, natural dynamics"

RULES:
- Do NOT include genre, bpm, or instruments in your output - they are pre-set
- Focus on creative, evocative style tags and recording descriptions
- Style tags should feel cohesive and natural, not a list
- Output ONLY the JSON object - no explanations

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters

${JSON_OUTPUT_FORMAT_RULES}`;
  }

  return `You are a music prompt writer for Suno V5 MAX MODE. Generate prompts using the specific metadata format that triggers maximum quality output.

OUTPUT FORMAT (follow EXACTLY - this format is critical):

${MAX_MODE_HEADER}

genre: "<exact genre(s) from user input, comma separated>"
bpm: "<tempo RANGE from detected context, e.g., 'between 80 and 160'>"
instruments: "<instruments from suggested list with character adjectives>"
style tags: "<MUST include: mood keywords + production style + chord progression feel + texture>"
recording: "<session description reflecting production style and mood>"

${CONTEXT_INTEGRATION_INSTRUCTIONS}

MAX MODE STYLE TAGS:
- Style tags MUST blend detected mood, production style, chord feel, AND recording texture
- Formula: "<mood keywords>, <chord progression feel>, <production style>, <texture descriptors>"
- Example: "smooth, laid back, bossa nova harmony, organic feel, studio reverb, natural dynamics"

CRITICAL RULES:
1. ALWAYS start with the exact MAX MODE header tags shown above
2. Use metadata-style formatting with quoted values after colons
3. NO section tags like [VERSE] or [CHORUS] - these cause lyric bleed-through in max mode
4. Keep each field on its own line

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters
- Output ONLY the formatted prompt - no explanations
- Every line must follow the format shown above`;
}

/**
 * @internal
 * Used for refinement context - not part of public API
 */
export function buildMaxModeContextualPrompt(
  description: string,
  selection: ModeSelection,
  lyricsTopic?: string,
  performanceGuidance?: NonNullable<ReturnType<typeof buildPerformanceGuidance>> | null
): string {
  const { found: userInstruments } = extractInstruments(description);
  const detectedGenre = selection.genre || DEFAULT_GENRE;

  const parts = buildSongConceptParts(`USER'S SONG CONCEPT:`, description, lyricsTopic);

  parts.push(
    '',
    'DETECTED CONTEXT:',
    `Genre: ${detectedGenre}`,
  );

  // Add enhanced guidance if genre is detected
  if (selection.genre) {
    // Parse components once to check for multi-genre
    const genreComponents = parseGenreComponents(selection.genre);
    const isMultiGenre = genreComponents.length > 1;

    const genreDef = GENRE_REGISTRY[selection.genre];
    const guidance = performanceGuidance ?? buildPerformanceGuidance(selection.genre);
    
    // BPM
    if (genreDef?.bpm) {
      parts.push(`Tempo: ${genreDef.bpm.typical} BPM (range: ${genreDef.bpm.min}-${genreDef.bpm.max})`);
    }
    
    // Moods
    if (genreDef?.moods && genreDef.moods.length > 0) {
      const selectedMoods = [...genreDef.moods].sort(() => Math.random() - 0.5).slice(0, 3);
      parts.push(`Mood suggestions: ${selectedMoods.join(', ')}`);
    }
    
    if (guidance) {
      parts.push(`Vocal style: ${guidance.vocal}`);
      parts.push(`Production: ${guidance.production}`);
    }
    
    // Chord progression
    parts.push(`Chord progression: ${buildProgressionDescriptor(selection.genre)}`);
    
    // Suggested instruments with articulations
    const instruments = selectInstrumentsForGenre(selection.genre, { userInstruments });
    const articulatedInstruments = instruments.map(i => articulateInstrument(i, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE));
    if (articulatedInstruments.length > 0) {
      parts.push('');
      parts.push('Suggested instruments:');
      parts.push(...articulatedInstruments.map(i => `- ${i}`));
    }

    // Add multi-genre nuance guidance for compound genres (2+ components)
    if (isMultiGenre) {
      const nuanceGuidance = getMultiGenreNuanceGuidance(selection.genre, Math.random);
      if (nuanceGuidance) {
        parts.push(nuanceGuidance);
      }
    }
  }

  if (userInstruments.length > 0) {
    parts.push('');
    parts.push(`User mentioned instruments: ${userInstruments.join(', ')}`);
  }

  return parts.join('\n');
}
