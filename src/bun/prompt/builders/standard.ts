/**
 * Standard mode prompt builders
 * @module prompt/builders/standard
 */

import {
  CONTEXT_INTEGRATION_INSTRUCTIONS,
  JSON_OUTPUT_FORMAT_RULES,
} from '@bun/prompt/shared-instructions';

import { buildContextualGuidance, buildSongConceptParts } from './shared';

import type { ModeSelection } from '@bun/instruments/selection';
import type { PreFormattedStandardOutput } from '@bun/prompt/context-preservation';

type PerformanceGuidanceType = Parameters<typeof buildContextualGuidance>[2];

export function buildSystemPrompt(
  maxChars: number,
  useSunoTags: boolean,
  preFormattedOutput?: PreFormattedStandardOutput
): string {
  // When pre-formatted output is provided, LLM only generates section content
  if (preFormattedOutput) {
    return `You are a creative music prompt writer for Suno V5. You are enhancing a pre-formatted prompt.

PRE-FORMATTED OUTPUT (these fields are ALREADY SET - do NOT modify):
- Genre: "${preFormattedOutput.genre}"
- BPM: "${preFormattedOutput.bpm}"
- Mood: "${preFormattedOutput.mood}"
- Instruments: "${preFormattedOutput.instruments}"

YOUR TASK: Generate evocative section descriptions using the pre-set context.

OUTPUT FORMAT - Return valid JSON:
{
  "intro": "<sparse instrumentation setting the scene>",
  "verse": "<weave instruments into narrative with emotion>",
  "chorus": "<peak energy, full arrangement, story climax>",
  "bridge": "<contrasting texture, optional>",
  "outro": "<resolution and fade>"
}

RULES:
- Use the pre-set genre, mood, and instruments as your creative foundation
- Write sections as natural flowing phrases, not word lists
- Reflect the chord progression feel and production style in section descriptions
- Output ONLY the JSON object - no explanations

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters

${JSON_OUTPUT_FORMAT_RULES}`;
  }

  const songStructure = useSunoTags
    ? `
OUTPUT FORMAT (follow this structure exactly):

Line 1 (MANDATORY): [Mood, Genre/Style, Key: key/mode]

Genre: <specific genre name>
BPM: <tempo RANGE from guidance, e.g., "between 80 and 160">
Mood: <use the mood suggestions from detected context>
Instruments: <2-4 items from suggested list with character adjectives>

[INTRO] <sparse instrumentation setting the scene>
[VERSE] <weave instruments into narrative with emotion>
[CHORUS] <peak energy, full arrangement, story climax>
[BRIDGE] <contrasting texture, optional>
[OUTRO] <resolution and fade>

RULES:
1. Line 1 bracket tag is MANDATORY - never omit it
2. Write sections as natural flowing phrases, not word lists
3. Only use instruments from SUGGESTED INSTRUMENTS in technical guidance
4. Backing vocals in (): wordless (ooh, ahh) or lyric echo (repeat key word from line)
5. Reflect chord progression feel and production style in section descriptions`
    : '';

  return `You are a creative music prompt writer for Suno V5. Transform user descriptions into evocative, inspiring music prompts.

${CONTEXT_INTEGRATION_INSTRUCTIONS}

CRITICAL RULES:
1. PRESERVE the user's narrative, story, and meaning - this is the soul of the song
2. Use technical guidance as creative COLOR, blending it naturally with the story
3. NEVER repeat words or phrases - each significant word should appear only ONCE
4. Create a cohesive, non-redundant prompt that flows naturally
${songStructure}
STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters.
- Output ONLY the prompt itself - no explanations or extra text.`;
}

/**
 * @internal
 * Used for refinement context - not part of public API
 */
export function buildContextualPrompt(
  description: string,
  selection: ModeSelection,
  lyricsTopic?: string,
  performanceGuidance?: PerformanceGuidanceType | null
): string {
  const parts = buildSongConceptParts(
    `USER'S SONG CONCEPT (preserve this narrative and meaning):`,
    description,
    lyricsTopic
  );

  const guidanceParts = buildContextualGuidance(selection, description, performanceGuidance);
  parts.push(...guidanceParts);

  return parts.join('\n\n');
}
