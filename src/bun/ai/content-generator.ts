import { generateText, type LanguageModel } from 'ai';

import { generateWithOllama } from '@bun/ai/ollama-client';
import { GENRE_REGISTRY } from '@bun/instruments';
import { createLogger } from '@bun/logger';
import { buildLyricsSystemPrompt, buildLyricsUserPrompt, buildTitleSystemPrompt, buildTitleUserPrompt } from '@bun/prompt/lyrics-builder';
import { APP_CONSTANTS, DEFAULT_GENRE } from '@shared/constants';
import { getErrorMessage } from '@shared/errors';

const log = createLogger('ContentGenerator');

/** All available genre keys from the registry */
const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as Array<keyof typeof GENRE_REGISTRY>;

/**
 * Generate text using either the AI SDK (cloud) or direct Ollama client (local).
 * This helper encapsulates the provider selection logic to avoid repetition.
 *
 * @param systemPrompt - System prompt for the model
 * @param userPrompt - User prompt for the model
 * @param getModel - Function to get the language model (for cloud providers)
 * @param timeoutMs - Timeout in milliseconds
 * @param ollamaEndpoint - Optional Ollama endpoint (when provided, uses direct Ollama client)
 * @returns Generated text
 */
async function generateTextWithProvider(
  systemPrompt: string,
  userPrompt: string,
  getModel: () => LanguageModel,
  timeoutMs: number,
  ollamaEndpoint?: string
): Promise<string> {
  if (ollamaEndpoint) {
    // Use direct Ollama client to bypass Bun fetch empty body bug
    return generateWithOllama(ollamaEndpoint, systemPrompt, userPrompt, timeoutMs);
  }
  // Use AI SDK for cloud providers
  const result = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return result.text;
}

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

/**
 * Generate a song title using AI.
 *
 * @param description - The song description or lyrics topic
 * @param genre - The detected or selected genre
 * @param mood - The detected mood
 * @param getModel - Function to get the language model (cloud or Ollama)
 * @param timeoutMs - Optional timeout in milliseconds (defaults to AI.TIMEOUT_MS)
 * @param ollamaEndpoint - Optional Ollama endpoint for direct API calls (bypasses AI SDK)
 */
export async function generateTitle(
  description: string,
  genre: string,
  mood: string,
  getModel: () => LanguageModel,
  timeoutMs: number = APP_CONSTANTS.AI.TIMEOUT_MS,
  ollamaEndpoint?: string
): Promise<TitleResult> {
  const systemPrompt = buildTitleSystemPrompt();
  const userPrompt = buildTitleUserPrompt(description, genre, mood);
  const debugInfo = { systemPrompt, userPrompt };

  try {
    const text = await generateTextWithProvider(systemPrompt, userPrompt, getModel, timeoutMs, ollamaEndpoint);

    return {
      title: text.trim().replace(/^["']|["']$/g, ''),
      debugInfo,
    };
  } catch (error: unknown) {
    log.warn('generateTitle:failed', { error: getErrorMessage(error) });
    return { title: 'Untitled', debugInfo };
  }
}

/**
 * Generate song lyrics using AI.
 *
 * @param description - The lyrics topic or song description
 * @param genre - The detected or selected genre
 * @param mood - The detected mood
 * @param maxMode - Whether to use max mode for lyrics generation
 * @param getModel - Function to get the language model (cloud or Ollama)
 * @param useSunoTags - Whether to include Suno performance tags
 * @param timeoutMs - Optional timeout in milliseconds (defaults to AI.TIMEOUT_MS)
 * @param ollamaEndpoint - Optional Ollama endpoint for direct API calls (bypasses AI SDK)
 */
export async function generateLyrics(
  description: string,
  genre: string,
  mood: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean = false,
  timeoutMs: number = APP_CONSTANTS.AI.TIMEOUT_MS,
  ollamaEndpoint?: string
): Promise<LyricsResult> {
  const systemPrompt = buildLyricsSystemPrompt(maxMode, useSunoTags);
  const userPrompt = buildLyricsUserPrompt(description, genre, mood, useSunoTags);
  const debugInfo = { systemPrompt, userPrompt };

  try {
    const text = await generateTextWithProvider(systemPrompt, userPrompt, getModel, timeoutMs, ollamaEndpoint);

    return { lyrics: text.trim(), debugInfo };
  } catch (error: unknown) {
    log.warn('generateLyrics:failed', { error: getErrorMessage(error) });
    return { lyrics: '[VERSE]\nLyrics generation failed...', debugInfo };
  }
}

/**
 * Detect the best genre from the deterministic builder's registry based on lyrics topic.
 * Used when lyrics mode is ON but no genre is selected - LLM picks the most fitting genre.
 *
 * @param lyricsTopic - The user's lyrics topic/theme
 * @param getModel - Function to get the language model (cloud or Ollama)
 * @param timeoutMs - Optional timeout in milliseconds (defaults to AI.TIMEOUT_MS)
 * @param ollamaEndpoint - Optional Ollama endpoint for direct API calls (bypasses AI SDK)
 * @returns Genre key and debug info with prompts used for detection
 */
export async function detectGenreFromTopic(
  lyricsTopic: string,
  getModel: () => LanguageModel,
  timeoutMs: number = APP_CONSTANTS.AI.TIMEOUT_MS,
  ollamaEndpoint?: string
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
    const text = await generateTextWithProvider(systemPrompt, userPrompt, getModel, timeoutMs, ollamaEndpoint);

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
      genre: DEFAULT_GENRE,
      debugInfo: { systemPrompt, userPrompt, detectedGenre: `${DEFAULT_GENRE} (fallback from invalid: ${genre})` },
    };
  } catch (error: unknown) {
    log.warn('detectGenreFromTopic:failed', { error: getErrorMessage(error) });
    return {
      genre: DEFAULT_GENRE,
      debugInfo: { systemPrompt, userPrompt, detectedGenre: `${DEFAULT_GENRE} (fallback from error)` },
    };
  }
}
