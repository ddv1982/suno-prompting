import { selectInstrumentsForGenre } from '@bun/instruments';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildProductionDescriptor } from '@bun/prompt/production-elements';
import { buildVocalDescriptor } from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';
import { getCreativityLevel } from '@shared/creative-boost-utils';

import type { GenreType } from '@bun/instruments/genres';

function isValidGenre(genre: string): genre is GenreType {
  return genre in GENRE_REGISTRY;
}

export { getCreativityLevel };

const MAX_STYLE_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Builds the system prompt for Creative Boost generation.
 * Includes creativity-specific guidance for each level.
 * Note: Lyrics are generated separately using the existing generateLyrics() function.
 */
export function buildCreativeBoostSystemPrompt(
  creativityLevel: number,
  withWordlessVocals: boolean
): string {
  const level = getCreativityLevel(creativityLevel);

  let creativityGuidance: string;

  switch (level) {
    case 'low':
      creativityGuidance = `CREATIVITY: LOW
- Use ONLY single genres (no combinations)
- Be predictable and genre-pure
- Stick to traditional, well-defined sounds
- Examples: "ambient", "jazz", "rock"`;
      break;
    case 'safe':
      creativityGuidance = `CREATIVITY: SAFE
- Use established combinations from the registry
- Combinations should be well-known and proven
- Stay within recognized genre pairings
- Examples: "jazz fusion", "trip hop", "electro pop"`;
      break;
    case 'normal':
      creativityGuidance = `CREATIVITY: NORMAL (BALANCED)
- Balance pure and blended genres
- Create sensible, natural combinations
- Stay cohesive while allowing some exploration
- The result should feel musically coherent`;
      break;
    case 'adventurous':
      creativityGuidance = `CREATIVITY: ADVENTUROUS
- Push boundaries with unusual combinations
- Mix genres that rarely meet
- Surprise the listener but remain musical
- Take creative risks while maintaining quality`;
      break;
    case 'high':
      creativityGuidance = `CREATIVITY: HIGH (EXPERIMENTAL)
- INVENT entirely new genre fusions
- Create combinations that don't exist in any registry
- Be bold, unexpected, and highly creative
- Examples: "doom metal bossa nova", "hyperpop bluegrass"`;
      break;
  }

  const vocalsGuidance = withWordlessVocals
    ? `VOCALS: Include wordless vocals only (humming, oohs, aahs, vocalizations). NO actual words or lyrics.`
    : `VOCALS: Focus on the musical style. Vocals/lyrics will be handled separately if needed.`;

  return `You are Creative Boost, an AI music genre exploration assistant for Suno V5.
Your role is to generate creative genre combinations and music prompts.

${creativityGuidance}

${vocalsGuidance}

OUTPUT FORMAT:
Return a JSON object with:
{
  "title": "A creative, evocative title for the piece",
  "style": "Genre/style description (the main prompt)"
}

RULES:
1. The "style" should be a rich description of the sound, not just genre names
2. Include sonic textures, mood, and character in the style
3. The title should be evocative and match the vibe
4. Keep style under ${MAX_STYLE_CHARS} characters
5. Do NOT wrap the JSON in markdown code blocks
6. When performance guidance is provided, weave vocal style and production elements naturally into the style`;
}

/**
 * Builds the user prompt for Creative Boost generation.
 * Uses lyricsTopic for title context only when description is empty.
 */
export function buildCreativeBoostUserPrompt(
  creativityLevel: number,
  seedGenres: string[],
  description: string,
  lyricsTopic?: string
): string {
  const parts: string[] = [];

  parts.push(`Creativity level: ${creativityLevel}%`);

  if (seedGenres.length > 0) {
    parts.push(`Seed genres to explore: ${seedGenres.join(', ')}`);

    // Add performance guidance from primary genre (if it's a known genre)
    const primaryGenre = seedGenres[0];
    if (primaryGenre && isValidGenre(primaryGenre)) {
      parts.push('');
      parts.push('PERFORMANCE GUIDANCE (blend naturally into style):');
      parts.push(`Vocal style: ${buildVocalDescriptor(primaryGenre)}`);
      parts.push(`Production: ${buildProductionDescriptor(primaryGenre)}`);

      const instruments = selectInstrumentsForGenre(primaryGenre, {});
      const articulated = instruments
        .slice(0, 3)
        .map((i) => articulateInstrument(i, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE));
      if (articulated.length > 0) {
        parts.push(`Suggested instruments: ${articulated.join(', ')}`);
      }
    }
  } else {
    parts.push('No seed genres - surprise me with something interesting');
  }

  if (description.trim()) {
    parts.push(`User's description: "${description.trim()}"`);
  } else if (lyricsTopic?.trim()) {
    // Use lyrics topic for title context only when no description provided
    parts.push(`Lyrics topic: "${lyricsTopic.trim()}"`);
  }

  parts.push('\nGenerate the creative prompt:');

  return parts.join('\n');
}

/**
 * Parses the Creative Boost response from the AI.
 * Handles JSON parsing, strips markdown code blocks, and provides fallback on error.
 * Note: Lyrics are generated separately, not included in this response.
 */
export function parseCreativeBoostResponse(text: string): {
  title: string;
  style: string;
} {
  try {
    // Remove markdown code blocks if present
    let cleaned = text
      .replace(/```json\s*\n?/gi, '')
      .replace(/```\s*\n?/g, '')
      .trim();

    // Try to extract JSON if there's extra text around it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned) as { title?: string; style?: string };

    return {
      title: parsed.title || 'Untitled',
      style: parsed.style || '',
    };
  } catch {
    // Fallback: treat entire text as style
    return {
      title: 'Creative Boost',
      style: text.trim(),
    };
  }
}

/**
 * Builds the system prompt for Creative Boost refinement.
 * Note: Lyrics are generated separately using the existing generateLyrics() function.
 */
export function buildCreativeBoostRefineSystemPrompt(
  withWordlessVocals: boolean
): string {
  const vocalsGuidance = withWordlessVocals
    ? `VOCALS: Include wordless vocals only (humming, oohs, aahs). NO actual words.`
    : `VOCALS: Focus on the musical style. Vocals/lyrics will be handled separately if needed.`;

  return `You are Creative Boost, an AI music genre exploration assistant for Suno V5.
You are REFINING an existing Creative Boost prompt based on user feedback.

Keep the same general vibe but apply the requested changes thoughtfully.

${vocalsGuidance}

OUTPUT FORMAT:
Return a JSON object with:
{
  "title": "Updated title (or keep similar if not requested to change)",
  "style": "Updated style/genre description"
}

RULES:
1. Apply the user's feedback while maintaining musical coherence
2. Keep style under ${MAX_STYLE_CHARS} characters
3. The title should still be evocative and match the vibe
4. Do NOT wrap the JSON in markdown code blocks`;
}

/**
 * Builds the user prompt for Creative Boost refinement.
 * Always includes lyricsTopic when provided (gives context for refining).
 */
export function buildCreativeBoostRefineUserPrompt(
  currentPrompt: string,
  currentTitle: string,
  feedback: string,
  lyricsTopic?: string
): string {
  const parts = [
    `Current title: "${currentTitle}"`,
    `Current style: "${currentPrompt}"`,
  ];

  if (lyricsTopic?.trim()) {
    parts.push(`Lyrics topic: "${lyricsTopic.trim()}"`);
  }

  parts.push('', `User feedback: ${feedback}`, '', 'Generate the refined prompt:');

  return parts.join('\n');
}


