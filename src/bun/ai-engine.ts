import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import {
  detectRhythmic,
  getRhythmicGuidance,
  extractInstruments,
  buildGuidanceFromSelection,
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
} from '@bun/instruments';
import type { GenreType } from '@bun/instruments';
import { selectModes } from '@bun/instruments/selection';
import type { ModeSelection } from '@bun/instruments/selection';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo } from '@shared/types';

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

const LEAKED_META_SUBSTRINGS = [
  'remove word repetition',
  'remove repetition',
  'these words repeat',
  'output only',
  'condense to under',
  'strict constraints',
  "here's the revised prompt",
  'here is the revised prompt',
] as const;

function hasLeakedMeta(text: string): boolean {
  const lower = text.toLowerCase();
  return LEAKED_META_SUBSTRINGS.some(s => lower.includes(s));
}

function stripLeakedMetaLines(text: string): string {
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const lower = line.toLowerCase();
    return !LEAKED_META_SUBSTRINGS.some(s => lower.includes(s));
  });
  return filtered.join('\n').trim();
}

export function _testStripLeakedMetaLines(text: string): string {
  return stripLeakedMetaLines(text);
}

function buildSystemPrompt(useSunoTags: boolean): string {
  const songStructure = useSunoTags ? `
OUTPUT FORMAT (follow this structure exactly):

Line 1 (MANDATORY): [Mood, Genre/Style, Key: key/mode]

Genre: <specific genre name>
Mood: <2-3 evocative mood descriptors>
Instruments: <2-4 items with character adjectives>

[INTRO] <sparse instrumentation setting the scene>
[VERSE] <weave instruments into narrative with emotion>
[CHORUS] <peak energy, full arrangement, story climax>
[BRIDGE] <contrasting texture, optional>
[OUTRO] <resolution and fade>

RULES:
1. Line 1 bracket tag is MANDATORY - never omit it
2. Write sections as natural flowing phrases, not word lists
3. Only use instruments from SUGGESTED INSTRUMENTS in technical guidance
4. Performance tags available: (breathy), (belt), (whisper), (ad-lib), (hold)` : '';

  return `You are a creative music prompt writer for Suno V5. Transform user descriptions into evocative, inspiring music prompts.

CRITICAL RULES:
1. PRESERVE the user's narrative, story, and meaning - this is the soul of the song
2. Use technical guidance as creative COLOR, blending it naturally with the story
3. NEVER repeat words or phrases - each significant word should appear only ONCE
4. Create a cohesive, non-redundant prompt that flows naturally
${songStructure}
STRICT CONSTRAINTS:
- Output MUST be under ${MAX_CHARS} characters.
- Output ONLY the prompt itself - no explanations or extra text.`;
}

function buildContextualPrompt(description: string, selection: ModeSelection): string {
  const rhythmic = detectRhythmic(description);
  const { found: userInstruments } = extractInstruments(description);

  const parts = [
    `USER'S SONG CONCEPT (preserve this narrative and meaning):`,
    description,
  ];

  const hasGuidance = selection.genre || selection.combination || selection.singleMode || rhythmic;

  if (hasGuidance) {
    parts.push('', 'TECHNICAL GUIDANCE (use as creative inspiration, blend naturally):');
    
    const modeGuidance = buildGuidanceFromSelection(selection, { userInstruments });
    if (modeGuidance) parts.push(modeGuidance);
    
    if (rhythmic) parts.push(getRhythmicGuidance(rhythmic));
  }

  return parts.join('\n\n');
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

function truncateToLimit(text: string, limit: number = MAX_CHARS): string {
  if (text.length <= limit) return text;
  
  // Try to truncate at a natural break point
  const truncated = text.slice(0, limit - 3);
  const lastNewline = truncated.lastIndexOf('\n');
  const lastComma = truncated.lastIndexOf(',');
  const breakPoint = Math.max(lastNewline, lastComma);
  
  return (breakPoint > limit * 0.7 ? truncated.slice(0, breakPoint) : truncated) + '...';
}

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
    return buildSystemPrompt(this.useSunoTags);
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

  private scrubLeakedMeta(text: string): string {
    if (!hasLeakedMeta(text)) return text;
    const scrubbed = stripLeakedMetaLines(text);
    if (scrubbed.trim().length < APP_CONSTANTS.MIN_PROMPT_CHARS) return text;
    return scrubbed;
  }

  private detectRepeatedWords(text: string): string[] {
    const words = text.toLowerCase().split(/[\s,;.()[\]]+/);
    const seen = new Set<string>();
    const repeated = new Set<string>();
    
    for (const word of words) {
      if (word.length < 4) continue; // Skip short words
      if (seen.has(word)) {
        repeated.add(word);
      }
      seen.add(word);
    }
    
    return Array.from(repeated);
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
      return this.scrubLeakedMeta(condensed.trim());
    } catch {
      return text;
    }
  }

  private async deduplicateWords(text: string): Promise<string> {
    const repeated = this.detectRepeatedWords(text);
    
    // If significant repetition detected (> 3 repeated words), fix it
    if (repeated.length > 3) {
      return this.condenseWithDedup(text, repeated);
    }
    
    return text;
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
      return this.scrubLeakedMeta(condensed.trim());
    } catch {
      // If condensing fails, fall back to truncation
      return truncateToLimit(text);
    }
  }

  private async ensureLength(text: string): Promise<string> {
    if (text.length <= MAX_CHARS) return text;
    
    // Try AI condensing once
    const condensed = await this.condense(text);
    if (condensed.length <= MAX_CHARS) return condensed;
    
    // Fall back to truncation
    return truncateToLimit(condensed);
  }

  private validateAndFixFormat(text: string): string {
    const trimmed = text.trim();
    
    // Check if output already starts with bracket tag
    if (trimmed.startsWith('[')) {
      return trimmed;
    }
    
    // Extract genre and mood from the text to construct missing bracket tag
    const genreMatch = trimmed.match(/^Genre:\s*(.+)$/m);
    const moodMatch = trimmed.match(/^Mood:\s*([^,]+)/m);
    
    const genre = genreMatch?.[1]?.trim() || 'Cinematic';
    const mood = moodMatch?.[1]?.trim() || 'Evocative';
    
    // Construct the bracket tag and prepend it
    const bracketTag = `[${mood}, ${genre}, Key: C Major]`;
    
    return `${bracketTag}\n\n${trimmed}`;
  }

  private async postProcess(text: string): Promise<string> {
    let result = this.scrubLeakedMeta(text.trim());
    if (hasLeakedMeta(result)) {
      result = await this.rewriteWithoutMeta(result);
    }
    result = this.validateAndFixFormat(result);
    result = await this.deduplicateWords(result);
    result = await this.ensureLength(result);
    result = this.scrubLeakedMeta(result);
    if (hasLeakedMeta(result)) {
      result = await this.rewriteWithoutMeta(result);
      result = this.scrubLeakedMeta(result);
    }
    return result;
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

      return this.scrubLeakedMeta(rewritten.trim());
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
    const instrumentLine = instruments.join(', ');
    
    // Replace the Instruments: line in the prompt
    const hasInstrumentsLine = /^Instruments:.*$/m.test(currentPrompt);
    
    let updatedPrompt: string;
    if (hasInstrumentsLine) {
      updatedPrompt = currentPrompt.replace(
        /^Instruments:.*$/m,
        `Instruments: ${instrumentLine}`
      );
    } else {
      // If no Instruments line found, return original (edge case)
      updatedPrompt = currentPrompt;
    }
    
    return { text: updatedPrompt };
  }

  async remixGenre(currentPrompt: string): Promise<GenerationResult> {
    const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
    
    // Extract current genre from prompt
    const genreMatch = currentPrompt.match(/^Genre:\s*(.+)$/m);
    const currentGenre = genreMatch?.[1]?.trim().toLowerCase() || '';
    
    // Filter out current genre and select a random different one
    const availableGenres = allGenres.filter(g => g !== currentGenre);
    const newGenre = availableGenres[Math.floor(Math.random() * availableGenres.length)];
    
    // Replace the Genre: line in the prompt
    const hasGenreLine = /^Genre:.*$/m.test(currentPrompt);
    
    let updatedPrompt: string;
    if (hasGenreLine) {
      updatedPrompt = currentPrompt.replace(
        /^Genre:.*$/m,
        `Genre: ${newGenre}`
      );
    } else {
      updatedPrompt = currentPrompt;
    }
    
    return { text: updatedPrompt };
  }

  async remixMood(currentPrompt: string): Promise<GenerationResult> {
    // Select 2-3 random mood descriptors
    const count = Math.random() < 0.5 ? 2 : 3;
    const shuffled = [...MOOD_POOL].sort(() => Math.random() - 0.5);
    const selectedMoods = shuffled.slice(0, count);
    const moodLine = selectedMoods.join(', ');
    
    // Replace the Mood: line in the prompt
    const hasMoodLine = /^Mood:.*$/m.test(currentPrompt);
    
    let updatedPrompt: string;
    if (hasMoodLine) {
      updatedPrompt = currentPrompt.replace(
        /^Mood:.*$/m,
        `Mood: ${moodLine}`
      );
    } else {
      updatedPrompt = currentPrompt;
    }
    
    return { text: updatedPrompt };
  }
}
