/**
 * Combined prompt builders for generating style + title (+ lyrics)
 * @module prompt/builders/combined
 */

import { buildMaxModeSystemPrompt } from './max-mode';
import { buildSystemPrompt } from './standard';

/**
 * Refinement context for refining existing prompts
 */
export interface RefinementContext {
  currentPrompt: string;
  currentTitle: string;
  currentLyrics?: string;
  lyricsTopic?: string;
}

/**
 * Combined system prompt for generating style prompt + title in one call
 */
export function buildCombinedSystemPrompt(
  maxChars: number,
  useSunoTags: boolean,
  maxMode: boolean,
  refinement?: RefinementContext
): string {
  const basePrompt = maxMode
    ? buildMaxModeSystemPrompt(maxChars)
    : buildSystemPrompt(maxChars, useSunoTags);

  if (refinement) {
    return `${basePrompt}

REFINEMENT MODE:
You are refining an existing music prompt and title based on user feedback.
Apply the feedback to improve BOTH outputs while maintaining consistency between them.

CURRENT STYLE PROMPT:
${refinement.currentPrompt}

CURRENT TITLE:
${refinement.currentTitle}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the refined music prompt>",
  "title": "<the refined song title (1-5 words)>"
}

REFINEMENT RULES:
- Apply user feedback to all relevant parts (prompt, title)
- Maintain consistency between style prompt and title mood/theme
- Keep what works well, improve what the feedback targets
- If feedback only mentions one element, still return both (keep other mostly unchanged)

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
  }

  return `${basePrompt}

ADDITIONAL OUTPUT REQUIREMENT:
After generating the music prompt, also create a song title.

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the complete music prompt as described above>",
  "title": "<a short, evocative 1-5 word song title that matches the mood and genre>"
}

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
}

/**
 * Combined system prompt for generating style prompt + title + lyrics in one call
 */
export function buildCombinedWithLyricsSystemPrompt(
  maxChars: number,
  useSunoTags: boolean,
  maxMode: boolean,
  refinement?: RefinementContext
): string {
  const basePrompt = maxMode
    ? buildMaxModeSystemPrompt(maxChars)
    : buildSystemPrompt(maxChars, useSunoTags);

  const lyricsFormat = maxMode
    ? `The lyrics MUST start with: ///*****///
Then section tags on subsequent lines.`
    : '';

  if (refinement) {
    const existingLyrics = refinement.currentLyrics?.trim();
    const lyricsSection =
      existingLyrics && existingLyrics.length > 0
        ? `CURRENT LYRICS:\n${existingLyrics}`
        : `CURRENT LYRICS: None - generate fresh lyrics based on the refined prompt and title`;

    const lyricsTopicSection = refinement.lyricsTopic
      ? `\nLYRICS TOPIC (use this as the core subject for lyrics, NOT the musical style):\n${refinement.lyricsTopic}`
      : '';

    const freshLyricsRequirements = !(existingLyrics && existingLyrics.length > 0)
      ? `
LYRICS REQUIREMENTS FOR NEW LYRICS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Lyrics should be evocative, poetic, and emotionally resonant
- Match the genre's typical lyrical style`
      : '';

    const additionalInstructions = [lyricsFormat, freshLyricsRequirements]
      .filter(Boolean)
      .join('\n');

    return `${basePrompt}

REFINEMENT MODE:
You are refining an existing music prompt, title, and lyrics based on user feedback.
Apply the feedback to improve ALL THREE outputs while maintaining consistency between them.

CURRENT STYLE PROMPT:
${refinement.currentPrompt}

CURRENT TITLE:
${refinement.currentTitle}

${lyricsSection}${lyricsTopicSection}

${additionalInstructions}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the refined music prompt>",
  "title": "<the refined song title (1-5 words)>",
  "lyrics": "<the refined or newly generated lyrics with section tags>"
}

REFINEMENT RULES:
- Apply user feedback to all relevant parts (prompt, title, lyrics)
- Maintain consistency between style prompt and lyrics mood/theme
- Keep what works well, improve what the feedback targets
- If feedback only mentions one element, still return all three (keep others mostly unchanged)
- If no existing lyrics, generate fresh lyrics that match the refined prompt and title

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
  }

  return `${basePrompt}

ADDITIONAL OUTPUT REQUIREMENT:
After generating the music prompt, also create a song title and complete lyrics.

${lyricsFormat}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the complete music prompt as described above>",
  "title": "<a short, evocative 1-5 word song title that matches the mood and genre>",
  "lyrics": "<complete song lyrics with section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]>"
}

LYRICS REQUIREMENTS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Lyrics should be evocative, poetic, and emotionally resonant
- Match the genre's typical lyrical style

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
}
