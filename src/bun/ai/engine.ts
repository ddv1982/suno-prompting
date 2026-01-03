import { generateText } from 'ai';
import { selectModes } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo } from '@shared/types';
import { buildContextualPrompt, buildMaxModeContextualPrompt, buildCombinedSystemPrompt, buildCombinedWithLyricsSystemPrompt, buildSystemPrompt, buildMaxModeSystemPrompt, type RefinementContext } from '@bun/prompt/builders';
import { buildQuickVibesSystemPrompt, buildQuickVibesUserPrompt, postProcessQuickVibes, applyQuickVibesMaxMode, stripMaxModeHeader, buildQuickVibesRefineSystemPrompt, buildQuickVibesRefineUserPrompt } from '@bun/prompt/quick-vibes-builder';
import {
  buildCreativeBoostSystemPrompt,
  buildCreativeBoostUserPrompt,
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { convertToNonMaxFormat } from '@bun/prompt/non-max-conversion';
import type { QuickVibesCategory } from '@shared/types';
import { postProcessPrompt, injectLockedPhrase, enforceLengthLimit } from '@bun/prompt/postprocess';
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

const log = createLogger('AIEngine');

export type GenerationResult = {
  text: string;
  title?: string;
  lyrics?: string;
  debugInfo?: DebugInfo;
};

export type ParsedCombinedResponse = {
  prompt: string;
  title: string;
  lyrics?: string;
};

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

  private async generateLyricsForCreativeBoost(
    styleResult: string,
    lyricsTopic: string,
    description: string,
    maxMode: boolean,
    withLyrics: boolean
  ): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
    if (!withLyrics) return { lyrics: undefined };
    
    const genre = extractGenreFromPrompt(styleResult);
    const mood = extractMoodFromPrompt(styleResult);
    const topicForLyrics = lyricsTopic?.trim() || description?.trim() || 'creative expression';
    const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, this.getModel);
    
    return {
      lyrics: result.lyrics,
      debugInfo: result.debugInfo,
    };
  }

  /**
   * Applies format conversion to a style prompt based on maxMode.
   * - Max Mode ON: Uses convertToMaxFormat for metadata-style format
   * - Max Mode OFF: Uses convertToNonMaxFormat for section-based format
   * Both ensure proper structure with identifiable instruments for remixing.
   * 
   * Genre priority:
   * 1. sunoStyles (if provided) - inject directly as-is (no transformation)
   * 2. seedGenres (if provided) - format using display names
   * 3. Detected from text (fallback)
   */
  private async applyMaxModeConversion(
    style: string,
    maxMode: boolean,
    seedGenres?: string[],
    sunoStyles?: string[]
  ): Promise<{ styleResult: string; debugInfo?: DebugInfo['maxConversion'] }> {
    if (maxMode) {
      const result = await convertToMaxFormat(style, this.getModel, seedGenres, sunoStyles);
      return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
    } else {
      const result = await convertToNonMaxFormat(style, this.getModel, seedGenres, sunoStyles);
      return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
    }
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

  /**
   * Enforce max character limit on already-formatted output.
   * Used by Creative Boost where conversion already produces clean output.
   */
  private async enforceMaxLength(text: string): Promise<string> {
    if (text.length <= MAX_CHARS) {
      return text;
    }
    log.info('enforceMaxLength:processing', { originalLength: text.length, maxChars: MAX_CHARS });
    const result = await enforceLengthLimit(text, MAX_CHARS, (t) => condense(t, this.getModel));
    if (result.length < text.length) {
      log.info('enforceMaxLength:reduced', { newLength: result.length });
    }
    return result;
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
    withWordlessVocals: boolean
  ): Promise<GenerationResult> {
    const systemPrompt = buildQuickVibesSystemPrompt(this.config.isMaxMode(), withWordlessVocals);
    const userPrompt = buildQuickVibesUserPrompt(category, customDescription);

    try {
      const { text: rawResponse } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!rawResponse?.trim()) {
        throw new AIGenerationError('Empty response from AI model (Quick Vibes)');
      }

      let result = postProcessQuickVibes(rawResponse);
      result = applyQuickVibesMaxMode(result, this.config.isMaxMode());

      return {
        text: result,
        debugInfo: this.config.isDebugMode()
          ? this.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to generate Quick Vibes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async refineQuickVibes(
    currentPrompt: string,
    feedback: string,
    withWordlessVocals: boolean,
    category?: QuickVibesCategory | null
  ): Promise<GenerationResult> {
    const cleanPrompt = stripMaxModeHeader(currentPrompt);
    const systemPrompt = buildQuickVibesRefineSystemPrompt(this.config.isMaxMode(), withWordlessVocals);
    const userPrompt = buildQuickVibesRefineUserPrompt(cleanPrompt, feedback, category);

    try {
      const { text: rawResponse } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!rawResponse?.trim()) {
        throw new AIGenerationError('Empty response from AI model (Quick Vibes refine)');
      }

      let result = postProcessQuickVibes(rawResponse);
      result = applyQuickVibesMaxMode(result, this.config.isMaxMode());

      return {
        text: result,
        debugInfo: this.config.isDebugMode()
          ? this.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to refine Quick Vibes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
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
    const systemPrompt = buildCreativeBoostSystemPrompt(creativityLevel, withWordlessVocals);
    const userPrompt = buildCreativeBoostUserPrompt(creativityLevel, seedGenres, description);

    try {
      const { text: rawResponse } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!rawResponse?.trim()) {
        throw new AIGenerationError('Empty response from AI model (Creative Boost)');
      }

      const parsed = parseCreativeBoostResponse(rawResponse);
      
      // Apply Max Mode format using the same conversion as Full Mode
      // Pass seedGenres/sunoStyles to inject user's genre selection directly into output
      // sunoStyles takes priority over seedGenres (injected as-is, no transformation)
      const { styleResult, debugInfo: maxConversionDebugInfo } = await this.applyMaxModeConversion(
        parsed.style, maxMode, seedGenres, sunoStyles
      );

      // Enforce max char limit (conversion output is already clean, just check length)
      const processedStyle = await this.enforceMaxLength(styleResult);

      // Generate lyrics separately using existing generateLyrics function
      const lyricsResult = await this.generateLyricsForCreativeBoost(
        processedStyle, lyricsTopic, description, maxMode, withLyrics
      );

      // Build debug info including lyrics generation if applicable
      let debugInfo: DebugInfo | undefined;
      if (this.config.isDebugMode()) {
        debugInfo = this.buildDebugInfo(systemPrompt, userPrompt, rawResponse);
        if (maxConversionDebugInfo) {
          debugInfo.maxConversion = maxConversionDebugInfo;
        }
        if (lyricsResult.debugInfo) {
          debugInfo.lyricsGeneration = lyricsResult.debugInfo;
        }
      }

      return {
        text: processedStyle,
        title: parsed.title,
        lyrics: lyricsResult.lyrics,
        debugInfo,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to generate Creative Boost: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
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
    const cleanPrompt = stripMaxModeHeader(currentPrompt);
    const systemPrompt = buildCreativeBoostRefineSystemPrompt(withWordlessVocals);
    const userPrompt = buildCreativeBoostRefineUserPrompt(cleanPrompt, currentTitle, feedback);

    try {
      const { text: rawResponse } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!rawResponse?.trim()) {
        throw new AIGenerationError('Empty response from AI model (Creative Boost refine)');
      }

      const parsed = parseCreativeBoostResponse(rawResponse);
      
      // Apply Max Mode format using the same conversion as Full Mode
      // Pass seedGenres/sunoStyles to preserve user's genre selection during refine
      // sunoStyles takes priority over seedGenres (injected as-is, no transformation)
      const { styleResult, debugInfo: maxConversionDebugInfo } = await this.applyMaxModeConversion(
        parsed.style, maxMode, seedGenres, sunoStyles
      );

      // Enforce max char limit (conversion output is already clean, just check length)
      const processedStyle = await this.enforceMaxLength(styleResult);

      // Regenerate lyrics using existing generateLyrics function
      const lyricsResult = await this.generateLyricsForCreativeBoost(
        processedStyle, lyricsTopic, description, maxMode, withLyrics
      );

      // Build debug info including lyrics generation if applicable
      let debugInfo: DebugInfo | undefined;
      if (this.config.isDebugMode()) {
        debugInfo = this.buildDebugInfo(systemPrompt, userPrompt, rawResponse);
        if (maxConversionDebugInfo) {
          debugInfo.maxConversion = maxConversionDebugInfo;
        }
        if (lyricsResult.debugInfo) {
          debugInfo.lyricsGeneration = lyricsResult.debugInfo;
        }
      }

      return {
        text: processedStyle,
        title: parsed.title,
        lyrics: lyricsResult.lyrics,
        debugInfo,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to refine Creative Boost: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
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
