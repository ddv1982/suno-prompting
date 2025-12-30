import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, type LanguageModel } from 'ai';
import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
} from '@bun/instruments';
import { MOOD_POOL } from '@bun/instruments/datasets';
import type { GenreType } from '@bun/instruments';
import { selectModes } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo, AppConfig, AIProvider, APIKeys } from '@shared/types';
import { buildContextualPrompt, buildMaxModeContextualPrompt, buildCombinedSystemPrompt, buildCombinedWithLyricsSystemPrompt, buildSystemPrompt, buildMaxModeSystemPrompt } from '@bun/prompt/builders';
import { postProcessPrompt, injectLockedPhrase } from '@bun/prompt/postprocess';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';
import { selectRealismTags, selectElectronicTags, isElectronicGenre, selectRecordingDescriptors, selectGenericTags } from '@bun/prompt/realism-tags';
import { injectBpm } from '@bun/prompt/bpm';
import { buildLyricsSystemPrompt, buildLyricsUserPrompt, buildTitleSystemPrompt, buildTitleUserPrompt } from '@bun/prompt/lyrics-builder';
import { createLogger } from '@bun/logger';

const log = createLogger('AIEngine');

export type GenerationResult = {
  text: string;
  title?: string;
  lyrics?: string;
  debugInfo?: DebugInfo;
};

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export function _testStripLeakedMetaLines(text: string): string {
  // Back-compat export for tests
  return text
    .split('\n')
    .filter(line => {
      const lower = line.toLowerCase();
      return ![
        'remove word repetition',
        'remove repetition',
        'these words repeat',
        'output only',
        'condense to under',
        'strict constraints',
        "here's the revised prompt",
        'here is the revised prompt',
      ].some(s => lower.includes(s));
    })
    .join('\n')
    .trim();
}

function extractGenreFromMaxModePrompt(prompt: string): string {
  const match = prompt.match(/^genre:\s*"?([^"\n,]+)/mi);
  return match?.[1]?.trim().toLowerCase() || 'acoustic';
}

function extractMoodFromPrompt(prompt: string): string {
  const match = prompt.match(/^mood:\s*"?([^"\n]+)/mi) || prompt.match(/^Mood:\s*([^\n]+)/mi);
  return match?.[1]?.trim() || 'emotional';
}

function injectStyleTags(prompt: string, genre: string): string {
  const isElectronic = isElectronicGenre(genre);
  let styleTags = isElectronic 
    ? selectElectronicTags(4)
    : selectRealismTags(genre, 4);
  
  // Fallback to generic tags if none found for this genre
  if (styleTags.length === 0) {
    styleTags = selectGenericTags(4);
  }
  
  return replaceStyleTagsLine(prompt, styleTags.join(', '));
}

// truncateToLimit now lives in @bun/prompt/postprocess

export class AIEngine {
  private provider: AIProvider = APP_CONSTANTS.AI.DEFAULT_PROVIDER;
  private apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  setApiKey(provider: AIProvider, key: string) {
    this.apiKeys[provider] = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  setUseSunoTags(value: boolean) {
    this.useSunoTags = value;
  }

  setDebugMode(value: boolean) {
    this.debugMode = value;
  }

  setMaxMode(value: boolean) {
    this.maxMode = value;
  }

  setLyricsMode(value: boolean) {
    this.lyricsMode = value;
  }

  initialize(config: Partial<AppConfig>) {
    if (config.provider) this.provider = config.provider;
    if (config.apiKeys) this.apiKeys = { ...this.apiKeys, ...config.apiKeys };
    if (config.model) this.model = config.model;
    if (config.useSunoTags !== undefined) this.useSunoTags = config.useSunoTags;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;
    if (config.maxMode !== undefined) this.maxMode = config.maxMode;
    if (config.lyricsMode !== undefined) this.lyricsMode = config.lyricsMode;
  }

  private getModel(): LanguageModel {
    switch (this.provider) {
      case 'openai':
        return createOpenAI({ apiKey: this.apiKeys.openai || process.env.OPENAI_API_KEY })(this.model) as unknown as LanguageModel;
      case 'anthropic':
        return createAnthropic({ apiKey: this.apiKeys.anthropic || process.env.ANTHROPIC_API_KEY })(this.model) as unknown as LanguageModel;
      case 'groq':
      default:
        return createGroq({ apiKey: this.apiKeys.groq || process.env.GROQ_API_KEY })(this.model) as LanguageModel;
    }
  }

  private get systemPrompt(): string {
    if (this.maxMode) {
      return buildMaxModeSystemPrompt(MAX_CHARS);
    }
    return buildSystemPrompt(MAX_CHARS, this.useSunoTags);
  }

  private buildDebugInfo(
    systemPrompt: string,
    userPrompt: string,
    messages?: Array<{ role: string; content: string }>
  ): DebugInfo {
    // Build messages array in universal OpenAI-compatible format
    const requestMessages = messages 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];
    
    const requestBody = {
      provider: this.provider,
      model: this.model,
      messages: requestMessages,
    };
    
    return {
      systemPrompt,
      userPrompt,
      model: this.model,
      provider: this.provider,
      timestamp: new Date().toISOString(),
      requestBody: JSON.stringify(requestBody, null, 2),
    };
  }

  private async condenseWithDedup(text: string, repeatedWords: string[]): Promise<string> {
    try {
      const { text: condensed } = await generateText({
        model: this.getModel(),
        system: [
          'Rewrite the given music prompt to remove word repetition while preserving meaning and musical quality.',
          'Return ONLY the rewritten prompt text.',
          'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
          'Do NOT mention repetition-removal, condensing, or "output only" in the result.',
        ].join(' '),
        prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>\n\nREPEATED_WORDS:\n${repeatedWords.join(', ')}`,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      return condensed.trim();
    } catch (error) {
      log.warn('condenseWithDedup:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return text;
    }
  }

  private async condense(text: string): Promise<string> {
    const targetChars = MAX_CHARS - 50;
    
    try {
      const { text: condensed } = await generateText({
        model: this.getModel(),
        system: [
          `Rewrite the given music prompt to be under ${targetChars} characters while preserving musical quality and key details.`,
          'Return ONLY the rewritten prompt text.',
          'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
          'Do NOT mention condensing, character counts, or "output only" in the result.',
        ].join(' '),
        prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      return condensed.trim();
    } catch (error) {
      log.warn('condense:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return text;
    }
  }

  private async postProcess(text: string): Promise<string> {
    return postProcessPrompt(text, {
      maxChars: MAX_CHARS,
      minChars: APP_CONSTANTS.MIN_PROMPT_CHARS,
      rewriteWithoutMeta: (t) => this.rewriteWithoutMeta(t),
      condense: (t) => this.condense(t),
      condenseWithDedup: (t, repeated) => this.condenseWithDedup(t, repeated),
    });
  }

  private async rewriteWithoutMeta(text: string): Promise<string> {
    try {
      const { text: rewritten } = await generateText({
        model: this.getModel(),
        system: [
          'Rewrite the given music prompt text.',
          'Remove any meta-instructions or assistant chatter.',
          'Return ONLY the final prompt text.',
        ].join(' '),
        prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      return rewritten.trim();
    } catch (error) {
      log.warn('rewriteWithoutMeta:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return text;
    }
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
        debugInfo: this.debugMode
          ? this.buildDebugInfo(systemPrompt, userPromptForDebug, messages)
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

  async generateInitial(description: string, lockedPhrase?: string): Promise<GenerationResult> {
    const selection = await selectModes(description, this.getModel());
    const userPrompt = this.maxMode
      ? buildMaxModeContextualPrompt(description, selection)
      : buildContextualPrompt(description, selection);
    
    // Use combined prompt to generate style + title (+ lyrics if enabled) in one call
    const systemPrompt = this.lyricsMode
      ? buildCombinedWithLyricsSystemPrompt(MAX_CHARS, this.useSunoTags, this.maxMode)
      : buildCombinedSystemPrompt(MAX_CHARS, this.useSunoTags, this.maxMode);

    const { text: rawResponse } = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    // Parse combined JSON response
    let parsed: { prompt: string; title: string; lyrics?: string };
    try {
      const cleaned = rawResponse.trim().replace(/```json\n?|\n?```/g, '');
      parsed = JSON.parse(cleaned);
      if (!parsed.prompt) {
        throw new Error('Missing prompt in response');
      }
    } catch (e) {
      log.warn('generateInitial:json_parse_failed', { 
        error: e instanceof Error ? e.message : 'Unknown error',
        rawResponse: rawResponse.slice(0, 200) 
      });
      // Fallback to legacy separate calls
      return this.generateInitialFallback(description, lockedPhrase, userPrompt);
    }

    // Post-process the prompt
    let promptText = await this.postProcess(parsed.prompt);

    // Extract genre for post-processing
    const genre = extractGenreFromMaxModePrompt(promptText);
    
    // Inject BPM directly (bypass LLM) to get random value from genre range
    promptText = injectBpm(promptText, genre);
    
    // Inject style tags directly (bypass LLM) when in max mode
    if (this.maxMode) {
      promptText = injectStyleTags(promptText, genre);
    }

    // Inject locked phrase directly (bypass LLM) into instruments field
    if (lockedPhrase) {
      promptText = injectLockedPhrase(promptText, lockedPhrase, this.maxMode);
    }

    const result: GenerationResult = {
      text: promptText,
      title: parsed.title?.trim().replace(/^["']|["']$/g, '') || 'Untitled',
      lyrics: parsed.lyrics?.trim(),
      debugInfo: this.debugMode
        ? this.buildDebugInfo(systemPrompt, userPrompt)
        : undefined,
    };

    return result;
  }

  // Fallback method using separate LLM calls (used if JSON parsing fails)
  private async generateInitialFallback(
    description: string,
    lockedPhrase: string | undefined,
    userPrompt: string
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

    const genre = extractGenreFromMaxModePrompt(result.text);
    result.text = injectBpm(result.text, genre);
    
    if (this.maxMode) {
      result.text = injectStyleTags(result.text, genre);
    }

    // Inject locked phrase directly (bypass LLM) into instruments field
    if (lockedPhrase) {
      result.text = injectLockedPhrase(result.text, lockedPhrase, this.maxMode);
    }

    const mood = extractMoodFromPrompt(result.text);
    const titleResult = await this.generateTitle(description, genre, mood);
    result.title = titleResult.title;
    
    if (result.debugInfo) {
      result.debugInfo.titleGeneration = titleResult.debugInfo;
    }

    if (this.lyricsMode) {
      const lyricsResult = await this.generateLyrics(description, genre, mood);
      result.lyrics = lyricsResult.lyrics;
      
      if (result.debugInfo) {
        result.debugInfo.lyricsGeneration = lyricsResult.debugInfo;
      }
    }

    return result;
  }

  private async generateTitle(description: string, genre: string, mood: string): Promise<{
    title: string;
    debugInfo: { systemPrompt: string; userPrompt: string };
  }> {
    const systemPrompt = buildTitleSystemPrompt();
    const userPrompt = buildTitleUserPrompt(description, genre, mood);
    const debugInfo = { systemPrompt, userPrompt };
    
    try {
      const { text } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: 3,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      
      return { 
        title: text.trim().replace(/^["']|["']$/g, ''),
        debugInfo
      };
    } catch (error) {
      log.warn('generateTitle:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { title: 'Untitled', debugInfo };
    }
  }

  private async generateLyrics(description: string, genre: string, mood: string): Promise<{
    lyrics: string;
    debugInfo: { systemPrompt: string; userPrompt: string };
  }> {
    const systemPrompt = buildLyricsSystemPrompt(this.maxMode);
    const userPrompt = buildLyricsUserPrompt(description, genre, mood);
    const debugInfo = { systemPrompt, userPrompt };
    
    try {
      const { text } = await generateText({
        model: this.getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: 3,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      
      return { lyrics: text.trim(), debugInfo };
    } catch (error) {
      log.warn('generateLyrics:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { lyrics: '[VERSE]\nLyrics generation failed...', debugInfo };
    }
  }

  async refinePrompt(currentPrompt: string, feedback: string, lockedPhrase?: string): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;
    // Remove locked phrase from prompt before sending to LLM (will re-inject after)
    const promptForLLM = lockedPhrase 
      ? currentPrompt.replace(`, ${lockedPhrase}`, '').replace(`${lockedPhrase}, `, '').replace(lockedPhrase, '')
      : currentPrompt;
    const userPrompt = `Previous prompt:\n${promptForLLM}\n\nFeedback:\n${feedback}`;
    const messages = [
      { role: 'assistant', content: promptForLLM },
      { role: 'user', content: feedback },
    ];

    const result = await this.runGeneration('refine prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getModel(),
        system: systemPrompt,
        messages,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      }),
      messages
    );

    // Re-inject locked phrase directly (bypass LLM)
    if (lockedPhrase) {
      result.text = injectLockedPhrase(result.text, lockedPhrase, this.maxMode);
    }

    return result;
  }

  async remixInstruments(currentPrompt: string, originalInput: string): Promise<GenerationResult> {
    // Detect genre from original input
    const selection = await selectModes(originalInput, this.getModel());
    const genre = selection.genre || 'ambient';
    
    // Generate new instruments from genre pool
    const instruments = selectInstrumentsForGenre(genre, { maxTags: 4 });
    return { text: replaceFieldLine(currentPrompt, 'Instruments', instruments.join(', ')) };
  }

  async remixGenre(currentPrompt: string): Promise<GenerationResult> {
    // Extract full genre value (handle both regular and max mode formats)
    const genreMatch = currentPrompt.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/mi);
    const fullGenreValue = genreMatch?.[1]?.trim() || '';
    
    // Parse comma-separated genres
    const currentGenres = fullGenreValue.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
    const genreCount = currentGenres.length;
    
    // Available genres pool (registry + multi-genre combinations)
    const allSingleGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
    const allGenreOptions = [...allSingleGenres, ...MULTI_GENRE_COMBINATIONS];
    
    let newGenreValue: string;
    
    if (genreCount <= 1) {
      // Single genre - check if it's a multi-word genre like "jazz fusion"
      const singleGenre = currentGenres[0] || '';
      
      if (isMultiGenre(singleGenre)) {
        // Pick from multi-genre pool, excluding current
        const available = MULTI_GENRE_COMBINATIONS.filter(g => g !== singleGenre);
        newGenreValue = available[Math.floor(Math.random() * available.length)]!;
      } else {
        // Single word genre - pick from registry
        const availableGenres = allSingleGenres.filter(g => g !== singleGenre);
        if (availableGenres.length === 0) return { text: currentPrompt };
        newGenreValue = availableGenres[Math.floor(Math.random() * availableGenres.length)]!;
      }
    } else {
      // Multiple comma-separated genres - generate same count of different genres
      const availableGenres = allGenreOptions.filter(g => !currentGenres.includes(g.toLowerCase()));
      const shuffled = [...availableGenres].sort(() => Math.random() - 0.5);
      const selectedGenres = shuffled.slice(0, genreCount);
      newGenreValue = selectedGenres.join(', ');
    }
    
    // Replace genre line
    let result = replaceFieldLine(currentPrompt, 'Genre', newGenreValue);
    
    // Also update BPM to match new genre
    const firstGenre = newGenreValue.split(',')[0]?.trim().toLowerCase() || '';
    const baseGenre = firstGenre.split(' ')[0] || firstGenre;
    const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
    if (genreDef?.bpm) {
      result = replaceFieldLine(result, 'BPM', `${genreDef.bpm.typical}`);
    }
    
    return { text: result };
  }

  async remixMood(currentPrompt: string): Promise<GenerationResult> {
    // Select 2-3 random mood descriptors
    const count = Math.random() < 0.5 ? 2 : 3;
    const shuffled = [...MOOD_POOL].sort(() => Math.random() - 0.5);
    const selectedMoods = shuffled.slice(0, count);
    const moodLine = selectedMoods.join(', ');
    
    return { text: replaceFieldLine(currentPrompt, 'Mood', moodLine) };
  }

  async remixStyleTags(currentPrompt: string): Promise<GenerationResult> {
    const genre = extractGenreFromMaxModePrompt(currentPrompt);
    return { text: injectStyleTags(currentPrompt, genre) };
  }

  async remixRecording(currentPrompt: string): Promise<GenerationResult> {
    const descriptors = selectRecordingDescriptors(3);
    return { text: replaceRecordingLine(currentPrompt, descriptors.join(', ')) };
  }

  async remixTitle(currentPrompt: string, originalInput: string): Promise<{ title: string }> {
    const genre = extractGenreFromMaxModePrompt(currentPrompt);
    const mood = extractMoodFromPrompt(currentPrompt);
    const result = await this.generateTitle(originalInput, genre, mood);
    return { title: result.title };
  }

  async remixLyrics(currentPrompt: string, originalInput: string): Promise<{ lyrics: string }> {
    const genre = extractGenreFromMaxModePrompt(currentPrompt);
    const mood = extractMoodFromPrompt(currentPrompt);
    const result = await this.generateLyrics(originalInput, genre, mood);
    return { lyrics: result.lyrics };
  }
}
