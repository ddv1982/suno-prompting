import {
  detectRhythmic,
  getRhythmicGuidance,
  extractInstruments,
  buildGuidanceFromSelection,
  selectInstrumentsForGenre,
} from '@bun/instruments';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { ModeSelection } from '@bun/instruments/selection';
import { MAX_MODE_HEADER } from '@bun/prompt/realism-tags';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildVocalDescriptor } from '@bun/prompt/vocal-descriptors';
import { buildProductionDescriptor } from '@bun/prompt/production-elements';
import { buildProgressionDescriptor } from '@bun/prompt/chord-progressions';

export const LOCKED_PLACEHOLDER = '{{LOCKED_PHRASE}}';

export function buildSystemPrompt(maxChars: number, useSunoTags: boolean): string {
  const songStructure = useSunoTags ? `
OUTPUT FORMAT (follow this structure exactly):

Line 1 (MANDATORY): [Mood, Genre/Style, Key: key/mode]

Genre: <specific genre name>
BPM: <tempo from guidance>
Mood: <2-3 evocative mood descriptors>
Instruments: <2-4 items with character adjectives>

[INTRO] <sparse instrumentation setting the scene>
[VERSE] <weave instruments into narrative with emotion>
[CHORUS] <peak energy, full arrangement, story climax>
[BRIDGE] <contrasting texture, optional>
[OUTRO] <resolution and fade>

RULES:
1. Line 1 bracket tag is MANDATORY - never omit it
2. Write sections as natural flowing phrases, not word lists
3. Only use instruments from SUGGESTED INSTRUMENTS in technical guidance
4. Performance tags available: (breathy), (belt), (whisper), (ad-lib), (hold)` : '';

  return `You are a creative music prompt writer for Suno V5. Transform user descriptions into evocative, inspiring music prompts.

CRITICAL RULES:
1. PRESERVE the user's narrative, story, and meaning - this is the soul of the song
2. Use technical guidance as creative COLOR, blending it naturally with the story
3. NEVER repeat words or phrases - each significant word should appear only ONCE
4. Create a cohesive, non-redundant prompt that flows naturally
5. If ${LOCKED_PLACEHOLDER} appears in the input, include it EXACTLY ONCE in your output - never modify, omit, or paraphrase it
${songStructure}
STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters.
- Output ONLY the prompt itself - no explanations or extra text.`;
}

export function buildContextualPrompt(
  description: string,
  selection: ModeSelection,
  lockedPhrase?: string
): string {
  const rhythmic = detectRhythmic(description);
  const { found: userInstruments } = extractInstruments(description);

  const descriptionWithLocked = lockedPhrase
    ? `${description}\n\nLOCKED PHRASE (include exactly as-is): ${LOCKED_PLACEHOLDER}`
    : description;

  const parts = [
    `USER'S SONG CONCEPT (preserve this narrative and meaning):`,
    descriptionWithLocked,
  ];

  const hasGuidance =
    selection.genre ||
    selection.combination ||
    selection.singleMode ||
    selection.polyrhythmCombination ||
    selection.timeSignature ||
    selection.timeSignatureJourney ||
    rhythmic;

  if (hasGuidance) {
    parts.push('', 'TECHNICAL GUIDANCE (use as creative inspiration, blend naturally):');

    const modeGuidance = buildGuidanceFromSelection(selection, { userInstruments });
    if (modeGuidance) parts.push(modeGuidance);

    if (rhythmic) parts.push(getRhythmicGuidance(rhythmic));
  }

  return parts.join('\n\n');
}

// Max Mode system prompt - uses metadata-style formatting for higher quality
export function buildMaxModeSystemPrompt(maxChars: number): string {
  return `You are a music prompt writer for Suno V5 MAX MODE. Generate prompts using the specific metadata format that triggers maximum quality output.

OUTPUT FORMAT (follow EXACTLY - this format is critical):

${MAX_MODE_HEADER}

genre: "<specific genre(s), comma separated>"
bpm: "<tempo from guidance>"
instruments: "<instruments with character adjectives, vocal style descriptors>"
style tags: "<recording style, texture, atmosphere descriptors>"
recording: "<performance context, source description>"

CRITICAL RULES:
1. ALWAYS start with the exact MAX MODE header tags shown above
2. Use metadata-style formatting with quoted values after colons
3. NO section tags like [VERSE] or [CHORUS] - these cause lyric bleed-through in max mode
4. Keep each field on its own line
5. Instruments should include vocal character (e.g., "BARITONE singer, vocal grit, emotional phrasing")
6. Style tags describe recording character, NOT music style
7. If ${LOCKED_PLACEHOLDER} appears in the input, include it in the instruments or style tags field

STYLE TAGS EXAMPLES (use these types of descriptors):
- Recording: "tape recorder, close-up, raw performance texture, handheld device realism"
- Space: "narrow mono image, small-bedroom acoustics, dry, limited stereo"
- Character: "unpolished, authentic take, natural dynamics, imperfections kept"

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters
- Output ONLY the formatted prompt - no explanations
- Every line must follow the format shown above`;
}

// Max Mode contextual prompt builder
export function buildMaxModeContextualPrompt(
  description: string,
  selection: ModeSelection,
  lockedPhrase?: string
): string {
  const { found: userInstruments } = extractInstruments(description);
  const detectedGenre = selection.genre || 'acoustic';

  const descriptionWithLocked = lockedPhrase
    ? `${description}\n\nLOCKED PHRASE (include in output exactly as-is): ${LOCKED_PLACEHOLDER}`
    : description;

  const parts = [
    `USER'S SONG CONCEPT:`,
    descriptionWithLocked,
    '',
    'DETECTED CONTEXT:',
    `Genre: ${detectedGenre}`,
  ];

  // Add enhanced guidance if genre is detected
  if (selection.genre) {
    const genreDef = GENRE_REGISTRY[selection.genre];
    
    // BPM
    if (genreDef?.bpm) {
      parts.push(`Tempo: ${genreDef.bpm.typical} BPM (range: ${genreDef.bpm.min}-${genreDef.bpm.max})`);
    }
    
    // Moods
    if (genreDef?.moods && genreDef.moods.length > 0) {
      const selectedMoods = [...genreDef.moods].sort(() => Math.random() - 0.5).slice(0, 3);
      parts.push(`Mood suggestions: ${selectedMoods.join(', ')}`);
    }
    
    // Vocal style
    parts.push(`Vocal style: ${buildVocalDescriptor(selection.genre)}`);
    
    // Production
    parts.push(`Production: ${buildProductionDescriptor(selection.genre)}`);
    
    // Chord progression
    parts.push(`Chord progression: ${buildProgressionDescriptor(selection.genre)}`);
    
    // Suggested instruments with articulations
    const instruments = selectInstrumentsForGenre(selection.genre, { userInstruments });
    const articulatedInstruments = instruments.map(i => articulateInstrument(i, Math.random, 0.4));
    if (articulatedInstruments.length > 0) {
      parts.push('');
      parts.push('Suggested instruments:');
      parts.push(...articulatedInstruments.map(i => `- ${i}`));
    }
  }

  if (userInstruments.length > 0) {
    parts.push('');
    parts.push(`User mentioned instruments: ${userInstruments.join(', ')}`);
  }

  return parts.join('\n');
}
