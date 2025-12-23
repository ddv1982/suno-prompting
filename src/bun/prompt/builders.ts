import {
  detectRhythmic,
  getRhythmicGuidance,
  extractInstruments,
  buildGuidanceFromSelection,
} from '@bun/instruments';
import type { ModeSelection } from '@bun/instruments/selection';

export const LOCKED_PLACEHOLDER = '{{LOCKED_PHRASE}}';

export function buildSystemPrompt(maxChars: number, useSunoTags: boolean): string {
  const songStructure = useSunoTags ? `
OUTPUT FORMAT (follow this structure exactly):

Line 1 (MANDATORY): [Mood, Genre/Style, Key: key/mode]

Genre: <specific genre name>
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
