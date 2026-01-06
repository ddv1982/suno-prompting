import { generateText, type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';
import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import {
  generateCreativeBoost as generateCreativeBoostImpl,
  refineCreativeBoost as refineCreativeBoostImpl,
} from '@bun/ai/creative-boost-engine';
import { condense, condenseWithDedup, rewriteWithoutMeta } from '@bun/ai/llm-rewriter';
import {
  generateQuickVibes as generateQuickVibesImpl,
  refineQuickVibes as refineQuickVibesImpl,
} from '@bun/ai/quick-vibes-engine';
import {
  extractGenreFromPrompt,
  extractMoodFromPrompt,
  remixInstruments as remixInstrumentsImpl,
  remixGenre as remixGenreImpl,
  remixMoodInPrompt,
  remixStyleTags as remixStyleTagsImpl,
  remixRecording as remixRecordingImpl,
  remixLyrics as remixLyricsImpl,
} from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import { buildCombinedSystemPrompt, buildCombinedWithLyricsSystemPrompt, buildSystemPrompt, buildMaxModeSystemPrompt, type RefinementContext } from '@bun/prompt/builders';
import { buildDeterministicMaxPrompt, buildDeterministicStandardPrompt } from '@bun/prompt/deterministic-builder';
import { postProcessPrompt, injectLockedPhrase } from '@bun/prompt/postprocess';
import { generateDeterministicTitle } from '@bun/prompt/title-generator';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError } from '@shared/errors';
import { cleanJsonResponse } from '@shared/prompt-utils';
import { nowISO } from '@shared/utils';

import type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';
import type { DebugInfo, QuickVibesCategory } from '@shared/types';

// Re-export types for backwards compatibility
export type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';

const log = createLogger('AIEngine');

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Options for generating an initial prompt
 */
export interface GenerateInitialOptions {
  description: string;
  lockedPhrase?: string;
  lyricsTopic?: string;
  genreOverride?: string;
}

/**
 * Options for refining a prompt
 */
export interface RefinePromptOptions {
  currentPrompt: string;
  currentTitle: string;
  feedback: string;
  currentLyrics?: string;
  lockedPhrase?: string;
  lyricsTopic?: string;
}



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
  getModel = (): LanguageModel => this.config.getModel();

  private cleanJsonResponse(text: string): string {
    return cleanJsonResponse(text);
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
        throw new AIGenerationError('Missing prompt in response');
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
      timestamp: nowISO(),
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

  /**
   * Generate initial prompt using deterministic builder.
   *
   * The prompt is generated deterministically without LLM calls.
   * LLM is only used for:
   * - Genre detection from lyrics topic (when lyrics ON + no genre selected)
   * - Title generation (when lyrics ON - to match lyrics theme)
   * - Lyrics generation (when lyrics ON)
   *
   * Flow:
   * 1. detectGenreFromTopic() - LLM-based genre selection (if lyrics ON + no genre)
   * 2. buildDeterministicMaxPrompt/StandardPrompt() - deterministic prompt generation
   * 3. generateTitle() - LLM (lyrics ON) or deterministic (lyrics OFF)
   * 4. generateLyrics() - LLM-based lyrics generation (if lyrics mode enabled)
   *
   * @param options - Options for generating initial prompt
   * @param options.description - User's song description
   * @param options.lockedPhrase - Optional phrase to inject into prompt
   * @param options.lyricsTopic - Optional topic for lyrics generation
   * @param options.genreOverride - Optional genre override from Advanced Mode
   * @returns Generated prompt, title, and optionally lyrics
   */
  async generateInitial(options: GenerateInitialOptions): Promise<GenerationResult> {
    const { description, lockedPhrase, lyricsTopic, genreOverride } = options;

    const isLyricsMode = this.config.isLyricsMode();
    let resolvedGenreOverride = genreOverride;
    let genreDetectionDebugInfo: { systemPrompt: string; userPrompt: string; detectedGenre: string } | undefined;

    // 1. Detect genre from lyrics topic if no genre selected and lyrics mode is ON
    if (isLyricsMode && !genreOverride && lyricsTopic?.trim()) {
      const genreResult = await detectGenreFromTopic(lyricsTopic.trim(), this.getModel);
      resolvedGenreOverride = genreResult.genre;
      genreDetectionDebugInfo = genreResult.debugInfo;
      log.info('generateInitial:genreFromTopic', { lyricsTopic, detectedGenre: genreResult.genre });
    }

    // 2. Deterministic prompt generation (no LLM)
    const deterministicResult = this.config.isMaxMode()
      ? buildDeterministicMaxPrompt({ description, genreOverride: resolvedGenreOverride })
      : buildDeterministicStandardPrompt({ description, genreOverride: resolvedGenreOverride });

    let promptText = deterministicResult.text;

    // 3. Inject locked phrase if provided
    if (lockedPhrase) {
      promptText = injectLockedPhrase(promptText, lockedPhrase, this.config.isMaxMode());
    }

    // 4. Extract genre and mood for title/lyrics generation
    const genre = extractGenreFromPrompt(promptText);
    const mood = extractMoodFromPrompt(promptText);

    // 5. Generate title: LLM when lyrics ON (to match lyrics theme), deterministic otherwise
    let title: string;
    let titleDebugInfo: { systemPrompt: string; userPrompt: string } | undefined;

    if (isLyricsMode) {
      const topicForTitle = lyricsTopic?.trim() || description;
      const titleResult = await generateTitle(topicForTitle, genre, mood, this.getModel);
      title = titleResult.title;
      titleDebugInfo = titleResult.debugInfo;
    } else {
      title = generateDeterministicTitle(genre, mood);
    }

    // 6. Generate lyrics using LLM (if lyrics mode enabled)
    let lyrics: string | undefined;
    let lyricsDebugInfo: { systemPrompt: string; userPrompt: string } | undefined;

    if (isLyricsMode) {
      const topicForLyrics = lyricsTopic?.trim() || description;
      const lyricsResult = await generateLyrics(
        topicForLyrics,
        genre,
        mood,
        this.config.isMaxMode(),
        this.getModel,
        this.config.getUseSunoTags()
      );
      lyrics = lyricsResult.lyrics;
      lyricsDebugInfo = lyricsResult.debugInfo;
    }

    // 7. Build debug info if debug mode enabled
    const debugInfo = this.config.isDebugMode()
      ? {
          systemPrompt: isLyricsMode
            ? 'Deterministic prompt; LLM for genre detection, title, and lyrics'
            : 'Fully deterministic generation - no LLM calls',
          userPrompt: description,
          model: this.config.getModelName(),
          provider: this.config.getProvider(),
          timestamp: nowISO(),
          requestBody: JSON.stringify({ deterministicResult: deterministicResult.metadata }, null, 2),
          responseBody: promptText,
          genreDetection: genreDetectionDebugInfo,
          titleGeneration: titleDebugInfo,
          lyricsGeneration: lyricsDebugInfo,
        }
      : undefined;

    return {
      text: promptText,
      title: this.cleanTitle(title),
      lyrics: this.cleanLyrics(lyrics),
      debugInfo,
    };
  }

  async refinePrompt(options: RefinePromptOptions): Promise<GenerationResult> {
    const {
      currentPrompt,
      currentTitle,
      feedback,
      currentLyrics,
      lockedPhrase,
      lyricsTopic,
    } = options;

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

  /**
   * Remix instruments in a prompt with new genre-appropriate instruments.
   * This operation is fully deterministic - no LLM calls.
   */
  remixInstruments(currentPrompt: string, originalInput: string): GenerationResult {
    return remixInstrumentsImpl(currentPrompt, originalInput);
  }

  /**
   * Remix genre - fully deterministic, no LLM.
   */
  remixGenre(currentPrompt: string): GenerationResult {
    return remixGenreImpl(currentPrompt);
  }

  /**
   * Remix mood - fully deterministic, no LLM.
   */
  remixMood(currentPrompt: string): GenerationResult {
    return remixMoodInPrompt(currentPrompt);
  }

  /**
   * Remix style tags - fully deterministic, no LLM.
   */
  remixStyleTags(currentPrompt: string): GenerationResult {
    return remixStyleTagsImpl(currentPrompt);
  }

  /**
   * Remix recording context - fully deterministic, no LLM.
   */
  remixRecording(currentPrompt: string): GenerationResult {
    return remixRecordingImpl(currentPrompt);
  }

  /**
   * Remix title - fully deterministic, no LLM.
   */
  remixTitle(currentPrompt: string, _originalInput: string): { title: string } {
    const genre = extractGenreFromPrompt(currentPrompt);
    const mood = extractMoodFromPrompt(currentPrompt);
    return { title: generateDeterministicTitle(genre, mood) };
  }

  async remixLyrics(currentPrompt: string, originalInput: string, lyricsTopic?: string): Promise<{ lyrics: string }> {
    return remixLyricsImpl(
      currentPrompt,
      originalInput,
      lyricsTopic,
      this.config.isMaxMode(),
      this.getModel,
      this.config.getUseSunoTags()
    );
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
    return generateCreativeBoostImpl({
      creativityLevel,
      seedGenres,
      sunoStyles,
      description,
      lyricsTopic,
      withWordlessVocals,
      maxMode,
      withLyrics,
      config: {
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
        getUseSunoTags: this.config.getUseSunoTags.bind(this.config),
      },
    });
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
    return refineCreativeBoostImpl({
      currentPrompt,
      currentTitle,
      feedback,
      lyricsTopic,
      description,
      seedGenres,
      sunoStyles,
      withWordlessVocals,
      maxMode,
      withLyrics,
      config: {
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfo.bind(this),
        getUseSunoTags: this.config.getUseSunoTags.bind(this.config),
      },
    });
  }
}
