import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
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
import type { DebugInfo, AppConfig } from '@shared/types';
import { buildContextualPrompt, buildSystemPrompt, buildMaxModeSystemPrompt, buildMaxModeContextualPrompt, LOCKED_PLACEHOLDER } from '@bun/prompt/builders';
import { postProcessPrompt, swapLockedPhraseIn, swapLockedPhraseOut } from '@bun/prompt/postprocess';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';
import { selectRealismTags, selectElectronicTags, isElectronicGenre, selectRecordingDescriptors, selectGenericTags } from '@bun/prompt/realism-tags';
import { injectBpm } from '@bun/prompt/bpm';
import { buildLyricsSystemPrompt, buildLyricsUserPrompt, buildTitleSystemPrompt, buildTitleUserPrompt, isLyricsModeOutput, extractStyleSection, rebuildLyricsModeOutput } from '@bun/prompt/lyrics-builder';
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

function formatRequestBody(body: unknown): string {
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

// truncateToLimit now lives in @bun/prompt/postprocess

export class AIEngine {
  private apiKey: string | null = null;
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;

  setApiKey(key: string) {
    this.apiKey = key;
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
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.useSunoTags !== undefined) this.useSunoTags = config.useSunoTags;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;
    if (config.maxMode !== undefined) this.maxMode = config.maxMode;
    if (config.lyricsMode !== undefined) this.lyricsMode = config.lyricsMode;
  }

  private getGroqModel() {
    return createGroq({ apiKey: this.apiKey || process.env.GROQ_API_KEY })(this.model);
  }

  private get systemPrompt(): string {
    if (this.maxMode) {
      return buildMaxModeSystemPrompt(MAX_CHARS);
    }
    return buildSystemPrompt(MAX_CHARS, this.useSunoTags);
  }

  private buildDebugInfo(systemPrompt: string, userPrompt: string, requestBody: unknown): DebugInfo {
    return {
      systemPrompt,
      userPrompt,
      model: this.model,
      timestamp: new Date().toISOString(),
      requestBody: formatRequestBody(requestBody),
    };
  }

  private async condenseWithDedup(text: string, repeatedWords: string[]): Promise<string> {
    try {
      const { text: condensed } = await generateText({
        model: this.getGroqModel(),
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
        model: this.getGroqModel(),
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
        model: this.getGroqModel(),
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
    operation: () => Promise<Awaited<ReturnType<typeof generateText>>>
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
          ? this.buildDebugInfo(systemPrompt, userPromptForDebug, genResult.request.body)
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
    const selection = await selectModes(description, this.getGroqModel());
    const userPrompt = this.maxMode
      ? buildMaxModeContextualPrompt(description, selection, lockedPhrase)
      : buildContextualPrompt(description, selection, lockedPhrase);
    const systemPrompt = this.systemPrompt;

    const result = await this.runGeneration('generate prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      })
    );

    if (lockedPhrase) {
      result.text = swapLockedPhraseOut(result.text, lockedPhrase);
    }

    // Extract genre for post-processing (regex handles both normal and max mode formats)
    const genre = extractGenreFromMaxModePrompt(result.text);
    
    // Inject BPM directly (bypass LLM) to get random value from genre range
    result.text = injectBpm(result.text, genre);
    
    // Inject style tags directly (bypass LLM) when in max mode
    if (this.maxMode) {
      result.text = injectStyleTags(result.text, genre);
    }

    // If lyrics mode is enabled, generate title and lyrics
    if (this.lyricsMode) {
      // Extract mood from the generated prompt
      const moodMatch = result.text.match(/^mood:\s*"?([^"\n]+)/mi) || result.text.match(/^Mood:\s*([^\n]+)/mi);
      const mood = moodMatch?.[1]?.trim() || 'emotional';
      
      // Generate title
      const titleResult = await this.generateTitle(description, genre, mood);
      
      // Generate lyrics
      const lyricsResult = await this.generateLyrics(description, genre, mood);
      
      // Store as separate fields (text remains as style-only prompt)
      result.title = titleResult.title;
      result.lyrics = lyricsResult.lyrics;
      
      // Add debug info for title and lyrics generation
      if (result.debugInfo) {
        result.debugInfo.titleGeneration = titleResult.debugInfo;
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
        model: this.getGroqModel(),
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
        model: this.getGroqModel(),
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
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    const systemPrompt = this.systemPrompt;
    const promptForLLM = lockedPhrase ? swapLockedPhraseIn(styleSection, lockedPhrase) : styleSection;
    const feedbackWithLocked = lockedPhrase
      ? `${feedback}\n\nLOCKED PHRASE (must preserve exactly as-is in output): ${LOCKED_PLACEHOLDER}`
      : feedback;
    const userPrompt = `Previous prompt:\n${promptForLLM}\n\nFeedback:\n${feedbackWithLocked}`;

    const result = await this.runGeneration('refine prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        messages: [
          { role: 'assistant', content: promptForLLM },
          { role: 'user', content: feedbackWithLocked },
        ],
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      })
    );

    if (lockedPhrase) {
      result.text = swapLockedPhraseOut(result.text, lockedPhrase);
    }

    // Rebuild lyrics mode output with refined style section
    if (isLyricsMode) {
      result.text = rebuildLyricsModeOutput(currentPrompt, result.text);
    }

    return result;
  }

  async remixInstruments(currentPrompt: string, originalInput: string): Promise<GenerationResult> {
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    // Detect genre from original input
    const selection = await selectModes(originalInput, this.getGroqModel());
    const genre = selection.genre || 'ambient';
    
    // Generate new instruments from genre pool
    const instruments = selectInstrumentsForGenre(genre, { maxTags: 4 });
    const newStyle = replaceFieldLine(styleSection, 'Instruments', instruments.join(', '));
    
    return { 
      text: isLyricsMode ? rebuildLyricsModeOutput(currentPrompt, newStyle) : newStyle 
    };
  }

  async remixGenre(currentPrompt: string): Promise<GenerationResult> {
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    // Extract full genre value (handle both regular and max mode formats)
    const genreMatch = styleSection.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/mi);
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
    let result = replaceFieldLine(styleSection, 'Genre', newGenreValue);
    
    // Also update BPM to match new genre
    // Extract base genre: "jazz fusion" → "jazz", "jazz, rock" → "jazz"
    const firstGenre = newGenreValue.split(',')[0]?.trim().toLowerCase() || '';
    const baseGenre = firstGenre.split(' ')[0] || firstGenre;
    const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
    if (genreDef?.bpm) {
      result = replaceFieldLine(result, 'BPM', `${genreDef.bpm.typical}`);
    }
    
    return { 
      text: isLyricsMode ? rebuildLyricsModeOutput(currentPrompt, result) : result 
    };
  }

  async remixMood(currentPrompt: string): Promise<GenerationResult> {
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    // Select 2-3 random mood descriptors
    const count = Math.random() < 0.5 ? 2 : 3;
    const shuffled = [...MOOD_POOL].sort(() => Math.random() - 0.5);
    const selectedMoods = shuffled.slice(0, count);
    const moodLine = selectedMoods.join(', ');
    
    const newStyle = replaceFieldLine(styleSection, 'Mood', moodLine);
    return { 
      text: isLyricsMode ? rebuildLyricsModeOutput(currentPrompt, newStyle) : newStyle 
    };
  }

  async remixStyleTags(currentPrompt: string): Promise<GenerationResult> {
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    const genre = extractGenreFromMaxModePrompt(styleSection);
    const newStyle = injectStyleTags(styleSection, genre);
    
    return { 
      text: isLyricsMode ? rebuildLyricsModeOutput(currentPrompt, newStyle) : newStyle 
    };
  }

  async remixRecording(currentPrompt: string): Promise<GenerationResult> {
    const isLyricsMode = isLyricsModeOutput(currentPrompt);
    const styleSection = extractStyleSection(currentPrompt);
    
    const descriptors = selectRecordingDescriptors(3);
    const newStyle = replaceRecordingLine(styleSection, descriptors.join(', '));
    
    return { 
      text: isLyricsMode ? rebuildLyricsModeOutput(currentPrompt, newStyle) : newStyle 
    };
  }
}
