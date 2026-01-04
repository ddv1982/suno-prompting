import { generateText } from 'ai';
import { selectModes } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo, QuickVibesCategory } from '@shared/types';
import { buildContextualPrompt, buildMaxModeContextualPrompt, buildCombinedSystemPrompt, buildCombinedWithLyricsSystemPrompt, buildSystemPrompt, buildMaxModeSystemPrompt, type RefinementContext } from '@bun/prompt/builders';
import { postProcessPrompt, injectLockedPhrase } from '@bun/prompt/postprocess';
import { injectBpm } from '@bun/prompt/bpm';
import { createLogger } from '@bun/logger';
import { AIConfig } from '@bun/ai/config';
import { condense, condenseWithDedup, rewriteWithoutMeta } from '@bun/ai/llm-rewriter';
import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import {
  extractGenreFromPrompt,
  extractMoodFromPrompt,
  injectStyleTags,
  remixInstruments as remixInstrumentsImpl,
  remixGenre as remixGenreImpl,
  remixMoodInPrompt,
  remixStyleTags as remixStyleTagsImpl,
  remixRecording as remixRecordingImpl,
  remixTitle as remixTitleImpl,
  remixLyrics as remixLyricsImpl,
} from '@bun/ai/remix';
import {
  generateQuickVibes as generateQuickVibesImpl,
  refineQuickVibes as refineQuickVibesImpl,
} from '@bun/ai/quick-vibes-engine';
import {
  generateCreativeBoost as generateCreativeBoostImpl,
  refineCreativeBoost as refineCreativeBoostImpl,
} from '@bun/ai/creative-boost-engine';
import type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';

// Re-export types for backwards compatibility
export type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';

const log = createLogger('AIEngine');

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export { stripLeakedMetaLines as _testStripLeakedMetaLines } from '@bun/prompt/postprocess';

export class AIEngine {
  private config = new AIConfig();

  setProvider = this.config.setProvider.bind(this.config);
  setApiKey = this.config.setApiKey.bind(this.config);
  setModel = this.config.setModel.bind(this.config);
  setUseSunoTags = this.config.setUseSunoTags.bind(this.config);
  setDebugMode = this.config.setDebugMode.bind(this.config);
  setMaxMode = this.config.setMaxMode.bind(this.config);
  setLyricsMode = this.config.setLyricsMode.bind(this.config);
  initialize = this.config.initialize.bind(this.config);
  isDebugMode = this.config.isDebugMode.bind(this.config);
  getModel = () => this.config.getModel();

  private cleanJsonResponse(text: string): string {
    return text.trim().replace(/```json\n?|\n?```/g, '');
  }

  private cleanTitle(title: string | undefined, fallback: string = 'Untitled'): string {
    return title?.trim().replace(/^["']|["']$/g, '') || fallback;
  }

  private cleanLyrics(lyrics: string | undefined): string | undefined {
    return lyrics?.trim() || undefined;
  }

  private parseJsonResponse(rawResponse: string, actionName: string): ParsedCombinedResponse | null {
    try {
      const cleaned = this.cleanJsonResponse(rawResponse);
      const parsed = JSON.parse(cleaned) as ParsedCombinedResponse;
      if (!parsed.prompt) {
        throw new Error('Missing prompt in response');
      }
      return parsed;
    } catch (e) {
      log.warn(`${actionName}:json_parse_failed`, {
        error: e instanceof Error ? e.message : 'Unknown error',
        rawResponse: rawResponse.slice(0, 200),
      });
      return null;
    }
  }

  private get systemPrompt(): string {
    if (this.config.isMaxMode()) {
      return buildMaxModeSystemPrompt(MAX_CHARS);
    }
    return buildSystemPrompt(MAX_CHARS, this.config.getUseSunoTags());
  }

  private buildDebugInfo(
    systemPrompt: string,
    userPrompt: string,
    rawResponse: string,
    messages?: Array<{ role: string; content: string }>
  ): DebugInfo {
    const requestMessages = messages
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

    const requestBody = {
      provider: this.config.getProvider(),
      model: this.config.getModelName(),
      messages: requestMessages,
    };

    return {
      systemPrompt,
      userPrompt,
      model: this.config.getModelName(),
      provider: this.config.getProvider(),
      timestamp: new Date().toISOString(),
      requestBody: JSON.stringify(requestBody, null, 2),
      responseBody: rawResponse,
    };
  }

  private async postProcess(text: string): Promise<string> {
    return postProcessPrompt(text, {
      maxChars: MAX_CHARS,
      minChars: APP_CONSTANTS.MIN_PROMPT_CHARS,
      rewriteWithoutMeta: (t) => rewriteWithoutMeta(t, this.getModel),
      condense: (t) => condense(t, this.getModel),
      condenseWithDedup: (t, repeated) => condenseWithDedup(t, repeated, this.getModel),
    });
  }

  private async runGeneration(
    actionLabel: string,
    systemPrompt: string,
    userPromptForDebug: string,
    operation: () => Promise<Awaited<ReturnType<typeof generateText>>>,
    messages?: Array<{ role: string; content: string }>
  ): Promise<GenerationResult> {
    try {
      const genResult = await operation();

      if (!genResult.text?.trim()) {
        throw new AIGenerationError(`Empty response from AI model${actionLabel ? ` (${actionLabel})` : ''}`);
      }

      const result = await this.postProcess(genResult.text);

      return {
        text: result,
        debugInfo: this.config.isDebugMode()
          ? this.buildDebugInfo(systemPrompt, userPromptForDebug, genResult.text, messages)
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to ${actionLabel}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async generateInitial(description: string, lockedPhrase?: string, lyricsTopic?: string, genreOverride?: string): Promise<GenerationResult> {
    const selection = await selectModes(description, this.getModel(), genreOverride);
    const userPrompt = this.config.isMaxMode()
      ? buildMaxModeContextualPrompt(description, selection, lyricsTopic)
      : buildContextualPrompt(description, selection, lyricsTopic);

    const systemPrompt = this.config.isLyricsMode()
      ? buildCombinedWithLyricsSystemPrompt(MAX_CHARS, this.config.getUseSunoTags(), this.config.isMaxMode())
      : buildCombinedSystemPrompt(MAX_CHARS, this.config.getUseSunoTags(), this.config.isMaxMode());

    const { text: rawResponse } = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    const parsed = this.parseJsonResponse(rawResponse, 'generateInitial');
    if (!parsed) {
      return this.generateInitialFallback(description, lockedPhrase, userPrompt, lyricsTopic);
    }

    let promptText = await this.postProcess(parsed.prompt);
    const genre = extractGenreFromPrompt(promptText);

    promptText = injectBpm(promptText, genre);

    if (this.config.isMaxMode()) {
      promptText = injectStyleTags(promptText, genre);
    }

    if (lockedPhrase) {
      promptText = injectLockedPhrase(promptText, lockedPhrase, this.config.isMaxMode());
    }

    return {
      text: promptText,
      title: this.cleanTitle(parsed.title),
      lyrics: this.cleanLyrics(parsed.lyrics),
      debugInfo: this.config.isDebugMode()
        ? this.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
        : undefined,
    };
  }

  private async generateInitialFallback(
    description: string,
    lockedPhrase: string | undefined,
    userPrompt: string,
    lyricsTopic?: string
  ): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;

    const result = await this.runGeneration('generate prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      })
    );

    const genre = extractGenreFromPrompt(result.text);
    result.text = injectBpm(result.text, genre);

    if (this.config.isMaxMode()) {
      result.text = injectStyleTags(result.text, genre);
    }

    if (lockedPhrase) {
      result.text = injectLockedPhrase(result.text, lockedPhrase, this.config.isMaxMode());
    }

    const mood = extractMoodFromPrompt(result.text);
    const titleResult = await generateTitle(description, genre, mood, this.getModel);
    result.title = titleResult.title;

    if (result.debugInfo) {
      result.debugInfo.titleGeneration = titleResult.debugInfo;
    }

    if (this.config.isLyricsMode()) {
      const topicForLyrics = lyricsTopic?.trim() || description;
      const lyricsResult = await generateLyrics(topicForLyrics, genre, mood, this.config.isMaxMode(), this.getModel);
      result.lyrics = lyricsResult.lyrics;

      if (result.debugInfo) {
        result.debugInfo.lyricsGeneration = lyricsResult.debugInfo;
      }
    }

    return result;
  }

  async refinePrompt(
    currentPrompt: string,
    feedback: string,
    lockedPhrase?: string,
    currentTitle?: string,
    currentLyrics?: string,
    lyricsTopic?: string,
    // genreOverride unused in refinement - genre already embedded in currentPrompt
    _genreOverride?: string
  ): Promise<GenerationResult> {
    const promptForLLM = lockedPhrase
      ? currentPrompt.replace(`, ${lockedPhrase}`, '').replace(`${lockedPhrase}, `, '').replace(lockedPhrase, '')
      : currentPrompt;

    const refinement: RefinementContext = {
      currentPrompt: promptForLLM,
      currentTitle: currentTitle || 'Untitled',
      currentLyrics: currentLyrics,
      lyricsTopic: lyricsTopic,
    };

    const systemPrompt = this.config.isLyricsMode()
      ? buildCombinedWithLyricsSystemPrompt(MAX_CHARS, this.config.getUseSunoTags(), this.config.isMaxMode(), refinement)
      : buildCombinedSystemPrompt(MAX_CHARS, this.config.getUseSunoTags(), this.config.isMaxMode(), refinement);

    const userPrompt = `Apply this feedback and return the refined JSON:\n\n${feedback}`;
    const { text: rawResponse } = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    const parsed = this.parseJsonResponse(rawResponse, 'refinePrompt');
    if (!parsed) {
      const fallbackResult = await this.refinePromptFallback(promptForLLM, feedback, lockedPhrase);
      return {
        ...fallbackResult,
        title: currentTitle,
        lyrics: this.config.isLyricsMode() ? currentLyrics : undefined,
      };
    }

    let promptText = await this.postProcess(parsed.prompt);

    if (lockedPhrase) {
      promptText = injectLockedPhrase(promptText, lockedPhrase, this.config.isMaxMode());
    }

    return {
      text: promptText,
      title: this.cleanTitle(parsed.title, currentTitle),
      lyrics: this.config.isLyricsMode() ? (this.cleanLyrics(parsed.lyrics) || currentLyrics) : undefined,
      debugInfo: this.config.isDebugMode()
        ? this.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
        : undefined,
    };
  }

  private async refinePromptFallback(
    currentPrompt: string,
    feedback: string,
    lockedPhrase?: string
  ): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;
    const userPrompt = `Previous prompt:\n${currentPrompt}\n\nFeedback:\n${feedback}`;
    const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
      { role: 'assistant', content: currentPrompt },
      { role: 'user', content: feedback },
    ];

    const result = await this.runGeneration('refine prompt fallback', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getModel(),
        system: systemPrompt,
        messages,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      }),
      messages
    );

    if (lockedPhrase) {
      result.text = injectLockedPhrase(result.text, lockedPhrase, this.config.isMaxMode());
    }

    return result;
  }

  async remixInstruments(currentPrompt: string, originalInput: string): Promise<GenerationResult> {
    return remixInstrumentsImpl(currentPrompt, originalInput, this.getModel);
  }

  async remixGenre(currentPrompt: string): Promise<GenerationResult> {
    return remixGenreImpl(currentPrompt);
  }

  async remixMood(currentPrompt: string): Promise<GenerationResult> {
    return remixMoodInPrompt(currentPrompt);
  }

  async remixStyleTags(currentPrompt: string): Promise<GenerationResult> {
    return remixStyleTagsImpl(currentPrompt);
  }

  async remixRecording(currentPrompt: string): Promise<GenerationResult> {
    return remixRecordingImpl(currentPrompt);
  }

  async remixTitle(currentPrompt: string, originalInput: string): Promise<{ title: string }> {
    return remixTitleImpl(currentPrompt, originalInput, this.getModel);
  }

  async remixLyrics(currentPrompt: string, originalInput: string, lyricsTopic?: string): Promise<{ lyrics: string }> {
    return remixLyricsImpl(currentPrompt, originalInput, lyricsTopic, this.config.isMaxMode(), this.getModel);
  }

  async generateQuickVibes(
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[]
  ): Promise<GenerationResult> {
    return generateQuickVibesImpl(
      { category, customDescription, withWordlessVocals, sunoStyles },
      {
        getModel: this.getModel,
        isMaxMode: this.config.isMaxMode.bind(this.config),
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
      }
    );
  }

  async refineQuickVibes(options: {
    currentPrompt: string;
    currentTitle?: string;
    description?: string;
    feedback: string;
    withWordlessVocals: boolean;
    category?: QuickVibesCategory | null;
    sunoStyles?: string[];
  }): Promise<GenerationResult> {
    return refineQuickVibesImpl(
      { ...options, sunoStyles: options.sunoStyles ?? [] },
      {
        getModel: this.getModel,
        isMaxMode: this.config.isMaxMode.bind(this.config),
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
      }
    );
  }

  async generateCreativeBoost(
    creativityLevel: number,
    seedGenres: string[],
    sunoStyles: string[],
    description: string,
    lyricsTopic: string,
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean
  ): Promise<GenerationResult> {
    return generateCreativeBoostImpl(
      creativityLevel, seedGenres, sunoStyles, description, lyricsTopic,
      withWordlessVocals, maxMode, withLyrics,
      {
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
      }
    );
  }

  async refineCreativeBoost(
    currentPrompt: string,
    currentTitle: string,
    feedback: string,
    lyricsTopic: string,
    description: string,
    seedGenres: string[],
    sunoStyles: string[],
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean
  ): Promise<GenerationResult> {
    return refineCreativeBoostImpl(
      currentPrompt, currentTitle, feedback, lyricsTopic, description,
      seedGenres, sunoStyles, withWordlessVocals, maxMode, withLyrics,
      {
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
      }
    );
  }
}

export function _testCleanJsonResponse(text: string): string {
  return text.trim().replace(/```json\n?|\n?```/g, '');
}

export function _testCleanTitle(title: string | undefined, fallback: string = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

export function _testCleanLyrics(lyrics: string | undefined): string | undefined {
  return lyrics?.trim() || undefined;
}

export function _testParseJsonResponse(rawResponse: string): ParsedCombinedResponse | null {
  try {
    const cleaned = _testCleanJsonResponse(rawResponse);
    const parsed = JSON.parse(cleaned) as ParsedCombinedResponse;
    if (!parsed.prompt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
