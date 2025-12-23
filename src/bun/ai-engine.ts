import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
} from '@bun/instruments';
import type { GenreType } from '@bun/instruments';
import { selectModes } from '@bun/instruments/selection';
import type { ModeSelection } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo } from '@shared/types';
import { buildContextualPrompt, buildSystemPrompt } from '@bun/prompt/builders';
import { postProcessPrompt } from '@bun/prompt/postprocess';
import { replaceFieldLine } from '@bun/prompt/remix';

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
  'haunting', 'brooding', 'sinister', 'ominous', 'menacing', 'foreboding',
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

  private getGroqModel() {
    return createGroq({ apiKey: this.apiKey || process.env.GROQ_API_KEY })(this.model);
  }

  private get systemPrompt(): string {
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
    } catch {
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
    } catch {
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
    } catch {
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

  async generateInitial(description: string): Promise<GenerationResult> {
    const selection = await selectModes(description, this.getGroqModel());
    const userPrompt = buildContextualPrompt(description, selection);
    const systemPrompt = this.systemPrompt;

    return this.runGeneration('generate prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      })
    );
  }

  async refinePrompt(currentPrompt: string, feedback: string): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;
    const userPrompt = `Previous prompt:\n${currentPrompt}\n\nFeedback:\n${feedback}`;

    return this.runGeneration('refine prompt', systemPrompt, userPrompt, async () =>
      generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        messages: [
          { role: 'assistant', content: currentPrompt },
          { role: 'user', content: feedback },
        ],
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      })
    );
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
    const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
    
    // Extract current genre from prompt
    const genreMatch = currentPrompt.match(/^Genre:\s*(.+)$/m);
    const currentGenre = genreMatch?.[1]?.trim().toLowerCase() || '';
    
    // Filter out current genre and select a random different one
    const availableGenres = allGenres.filter(g => g !== currentGenre);
    const newGenre = availableGenres[Math.floor(Math.random() * availableGenres.length)];
    
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
}
