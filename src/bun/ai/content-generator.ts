import { generateText, type LanguageModel } from 'ai';

import { GENRE_REGISTRY } from '@bun/instruments';
import { createLogger } from '@bun/logger';
import { buildLyricsSystemPrompt, buildLyricsUserPrompt, buildTitleSystemPrompt, buildTitleUserPrompt } from '@bun/prompt/lyrics-builder';
import { APP_CONSTANTS } from '@shared/constants';
import { getErrorMessage } from '@shared/errors';

const log = createLogger('ContentGenerator');

/** All available genre keys from the registry */
const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as Array<keyof typeof GENRE_REGISTRY>;

/**
 * Default fallback genre when LLM detection fails or returns invalid result.
 * Pop is chosen because it's genre-neutral and works well with any lyrics topic.
 */
const DEFAULT_FALLBACK_GENRE = 'pop';

export type ContentDebugInfo = {
  systemPrompt: string;
  userPrompt: string;
};

export type TitleResult = {
  title: string;
  debugInfo: ContentDebugInfo;
};

export type LyricsResult = {
  lyrics: string;
  debugInfo: ContentDebugInfo;
};

/**
 * Result from LLM-based genre detection.
 * Includes debug info to show the prompts used in the debug drawer,
 * allowing users to see how genre was inferred from their lyrics topic.
 */
export type GenreDetectionResult = {
  genre: string;
  debugInfo: ContentDebugInfo & { detectedGenre: string };
};

export async function generateTitle(
  description: string,
  genre: string,
  mood: string,
  getModel: () => LanguageModel
): Promise<TitleResult> {
  const systemPrompt = buildTitleSystemPrompt();
  const userPrompt = buildTitleUserPrompt(description, genre, mood);
  const debugInfo = { systemPrompt, userPrompt };

  try {
    const { text } = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    return {
      title: text.trim().replace(/^["']|["']$/g, ''),
      debugInfo,
    };
  } catch (error) {
    log.warn('generateTitle:failed', { error: getErrorMessage(error) });
    return { title: 'Untitled', debugInfo };
  }
}

export async function generateLyrics(
  description: string,
  genre: string,
  mood: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean = false
): Promise<LyricsResult> {
  const systemPrompt = buildLyricsSystemPrompt(maxMode, useSunoTags);
  const userPrompt = buildLyricsUserPrompt(description, genre, mood, useSunoTags);
  const debugInfo = { systemPrompt, userPrompt };

  try {
    const { text } = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    return { lyrics: text.trim(), debugInfo };
  } catch (error) {
    log.warn('generateLyrics:failed', { error: getErrorMessage(error) });
    return { lyrics: '[VERSE]\nLyrics generation failed...', debugInfo };
  }
}

/**
 * Detect the best genre from the deterministic builder's registry based on lyrics topic.
 * Used when lyrics mode is ON but no genre is selected - LLM picks the most fitting genre.
 *
 * @param lyricsTopic - The user's lyrics topic/theme
 * @param getModel - Function to get the language model
 * @returns Genre key and debug info with prompts used for detection
 */
export async function detectGenreFromTopic(
  lyricsTopic: string,
  getModel: () => LanguageModel
): Promise<GenreDetectionResult> {
  // Build genre list with descriptions for LLM context
  const genreDescriptions = ALL_GENRE_KEYS.map((key) => {
    const genre = GENRE_REGISTRY[key];
    const moods = genre.moods?.slice(0, 3).join(', ') || '';
    return `- ${key}: ${genre.name}${moods ? ` (${moods})` : ''}`;
  }).join('\n');

  const systemPrompt = `You are a music genre expert. Given a lyrics topic/theme, select the single most fitting genre from the available list.

AVAILABLE GENRES:
${genreDescriptions}

RULES:
- Return ONLY the genre key (lowercase, e.g., "jazz", "rock", "ambient")
- Choose the genre that best matches the emotional tone and subject matter
- If uncertain, prefer versatile genres like "pop", "rock", or "indie"
- Do NOT return anything except the genre key`;

  const userPrompt = `Lyrics topic: "${lyricsTopic}"

Which genre fits best? Return only the genre key.`;

  try {
    const { text } = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    const genre = text.trim().toLowerCase();
    // Validate the returned genre exists in registry
    if (ALL_GENRE_KEYS.includes(genre as keyof typeof GENRE_REGISTRY)) {
      log.info('detectGenreFromTopic:success', { lyricsTopic, genre });
      return {
        genre,
        debugInfo: { systemPrompt, userPrompt, detectedGenre: genre },
      };
    }

    log.warn('detectGenreFromTopic:invalid_genre', { lyricsTopic, returned: genre });
    return {
      genre: DEFAULT_FALLBACK_GENRE,
      debugInfo: { systemPrompt, userPrompt, detectedGenre: `${DEFAULT_FALLBACK_GENRE} (fallback from invalid: ${genre})` },
    };
  } catch (error) {
    log.warn('detectGenreFromTopic:failed', { error: getErrorMessage(error) });
    return {
      genre: DEFAULT_FALLBACK_GENRE,
      debugInfo: { systemPrompt, userPrompt, detectedGenre: `${DEFAULT_FALLBACK_GENRE} (fallback from error)` },
    };
  }
}
