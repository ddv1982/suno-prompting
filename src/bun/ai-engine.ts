import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
} from '@bun/instruments';
import type { GenreType } from '@bun/instruments';
import { selectModes } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo, AppConfig } from '@shared/types';
import { buildContextualPrompt, buildSystemPrompt, buildMaxModeSystemPrompt, buildMaxModeContextualPrompt, LOCKED_PLACEHOLDER } from '@bun/prompt/builders';
import { postProcessPrompt, swapLockedPhraseIn, swapLockedPhraseOut } from '@bun/prompt/postprocess';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';
import { selectRealismTags, selectElectronicTags, isElectronicGenre, selectRecordingDescriptors, selectGenericTags } from '@bun/prompt/realism-tags';
import { createLogger } from '@bun/logger';

const log = createLogger('AIEngine');

export type GenerationResult = {
  text: string;
  debugInfo?: DebugInfo;
};

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

const MOOD_POOL = [
  // Energetic
  'euphoric', 'explosive', 'triumphant', 'exhilarating', 'electrifying', 'uplifting',
  // Calm
  'serene', 'peaceful', 'tranquil', 'meditative', 'soothing', 'gentle',
  // Dark
  'haunting', 'sinister', 'ominous', 'menacing', 'foreboding',
  // Emotional
  'melancholic', 'wistful', 'bittersweet', 'yearning', 'nostalgic', 'tender',
  // Playful
  'whimsical', 'mischievous', 'carefree', 'lighthearted', 'jovial', 'quirky',
  // Intense
  'passionate', 'fierce', 'relentless', 'urgent', 'raw', 'visceral',
  // Atmospheric
  'ethereal', 'dreamy', 'mysterious', 'hypnotic', 'otherworldly', 'cosmic',
  // Additional variety
  'introspective', 'defiant', 'hopeful', 'rebellious', 'contemplative', 'cinematic',
] as const;

const MULTI_GENRE_COMBINATIONS = [
  // Fusion styles
  'jazz fusion', 'jazz funk', 'jazz hip-hop', 'nu jazz', 'acid jazz',
  // Electronic blends
  'electronic rock', 'electro pop', 'synth pop', 'future bass', 'chillwave', 'vaporwave',
  // Folk blends
  'folk rock', 'folk pop', 'indie folk', 'chamber folk',
  // Rock blends
  'blues rock', 'southern rock', 'progressive rock', 'psychedelic rock', 'art rock', 'indie rock', 'alternative rock',
  // Soul/R&B blends
  'neo soul', 'psychedelic soul', 'funk soul',
  // World/Latin blends
  'latin jazz', 'bossa nova', 'afrobeat', 'reggae fusion',
  // Metal blends
  'progressive metal', 'symphonic metal', 'doom metal',
  // Hip-hop blends
  'trip hop', 'lo-fi hip hop',
  // Ambient blends
  'dark ambient', 'space ambient', 'drone ambient',
] as const;

function isMultiGenre(genre: string): boolean {
  const words = genre.toLowerCase().trim().split(/\s+/);
  return words.length >= 2;
}

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

  initialize(config: Partial<AppConfig>) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.useSunoTags !== undefined) this.useSunoTags = config.useSunoTags;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;
    if (config.maxMode !== undefined) this.maxMode = config.maxMode;
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

    // Inject style tags directly (bypass LLM) when in max mode
    if (this.maxMode) {
      const genre = extractGenreFromMaxModePrompt(result.text);
      result.text = injectStyleTags(result.text, genre);
    }

    return result;
  }

  async refinePrompt(currentPrompt: string, feedback: string, lockedPhrase?: string): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;
    const promptForLLM = lockedPhrase ? swapLockedPhraseIn(currentPrompt, lockedPhrase) : currentPrompt;
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

    return result;
  }

  async remixInstruments(currentPrompt: string, originalInput: string): Promise<GenerationResult> {
    // Detect genre from original input
    const selection = await selectModes(originalInput, this.getGroqModel());
    const genre = selection.genre || 'ambient';
    
    // Generate new instruments from genre pool
    const instruments = selectInstrumentsForGenre(genre, { maxTags: 4 });
    return { text: replaceFieldLine(currentPrompt, 'Instruments', instruments.join(', ')) };
  }

  async remixGenre(currentPrompt: string): Promise<GenerationResult> {
    // Extract current genre from prompt (handle both regular and max mode formats)
    const genreMatch = currentPrompt.match(/^genre:\s*"?([^"\n,]+)/mi);
    const currentGenre = genreMatch?.[1]?.trim().toLowerCase() || '';
    
    // Detect if current genre is multi-genre
    if (isMultiGenre(currentGenre)) {
      // Pick from multi-genre pool, excluding current
      const available = MULTI_GENRE_COMBINATIONS.filter(g => g !== currentGenre);
      const newGenre = available[Math.floor(Math.random() * available.length)]!;
      return { text: replaceFieldLine(currentPrompt, 'Genre', newGenre) };
    }
    
    // Single genre - pick from registry
    const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
    const availableGenres = allGenres.filter(g => g !== currentGenre);

    if (availableGenres.length === 0) {
      return { text: currentPrompt };
    }

    const newGenre = availableGenres[Math.floor(Math.random() * availableGenres.length)]!;
    return { text: replaceFieldLine(currentPrompt, 'Genre', newGenre) };
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
}
