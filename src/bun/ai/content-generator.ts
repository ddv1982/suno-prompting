import { generateText, type LanguageModel } from 'ai';
import { APP_CONSTANTS } from '@shared/constants';
import { getErrorMessage } from '@shared/errors';
import { buildLyricsSystemPrompt, buildLyricsUserPrompt, buildTitleSystemPrompt, buildTitleUserPrompt } from '@bun/prompt/lyrics-builder';
import { createLogger } from '@bun/logger';

const log = createLogger('ContentGenerator');

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
  getModel: () => LanguageModel
): Promise<LyricsResult> {
  const systemPrompt = buildLyricsSystemPrompt(maxMode);
  const userPrompt = buildLyricsUserPrompt(description, genre, mood);
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
