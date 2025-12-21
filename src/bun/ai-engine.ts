import { createGroq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import { detectGenre, getGenreInstruments, detectHarmonic, getHarmonicGuidance, detectRhythmic, getRhythmicGuidance } from '@bun/instruments';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
import type { DebugInfo } from '@shared/types';

export type GenerationResult = {
  text: string;
  debugInfo?: DebugInfo;
};

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

function buildSystemPrompt(useSunoTags: boolean): string {
  const songStructure = useSunoTags ? `
OUTPUT FORMAT (Top-Anchor Strategy):

[Mood], [Genre/Era], Key: [key/mode]

Genre: [specific genre name]
Mood: [2-3 evocative mood descriptors]
Instruments: [with CHARACTER adjectives - ONLY list instruments mentioned in technical guidance]

[INTRO] [Natural flowing description: sparse instrumentation setting the scene]
[VERSE] [Natural flowing description: weave instruments into the narrative with emotion]
[CHORUS] [Natural flowing description: peak energy with full arrangement and story climax]
[BRIDGE] [Natural flowing description: contrasting texture, optional]
[OUTRO] [Natural flowing description: resolution and fade]

SECTION WRITING RULES:
- Write in natural phrases, NOT word lists
- Blend instruments into the story naturally
- ONLY reference instruments from the provided list in technical guidance

PERFORMANCE TAGS: (breathy), (belt), (whisper), (ad-lib), (hold)` : '';

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

function buildContextualPrompt(description: string): string {
  const genre = detectGenre(description);
  const harmonic = detectHarmonic(description);
  const rhythmic = detectRhythmic(description);
  
  const parts = [
    `USER'S SONG CONCEPT (preserve this narrative and meaning):`,
    description,
  ];
  
  // Only add technical guidance if detected
  if (genre || harmonic || rhythmic) {
    parts.push('', 'TECHNICAL GUIDANCE (use as creative inspiration, blend naturally):');
    if (genre) parts.push(getGenreInstruments());
    if (harmonic) parts.push(getHarmonicGuidance(harmonic));
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
        system: 'Remove word repetition while preserving meaning and musical quality. Output ONLY the revised prompt.',
        prompt: `These words repeat too often: ${repeatedWords.join(', ')}\n\nRemove repetition, keep each word once:\n\n${text}`,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      return condensed.trim();
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
        system: 'You condense music prompts while preserving quality. Output ONLY the condensed prompt.',
        prompt: `Condense to under ${targetChars} characters (current: ${text.length}). Preserve musical details - genre, mood, key, instruments, structure. Remove redundant words:\n\n${text}`,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });
      return condensed.trim();
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

  async generateInitial(description: string): Promise<GenerationResult> {
    const userPrompt = buildContextualPrompt(description);
    const systemPrompt = this.systemPrompt;
    
    try {
      const genResult = await generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!genResult.text?.trim()) {
        throw new AIGenerationError('Empty response from AI model');
      }

      let result = genResult.text.trim();
      
      // Check for word repetition and fix if needed
      result = await this.deduplicateWords(result);
      
      // Ensure length constraints
      result = await this.ensureLength(result);
      
      return {
        text: result,
        debugInfo: this.debugMode ? {
          systemPrompt,
          userPrompt,
          model: this.model,
          timestamp: new Date().toISOString(),
          requestBody: formatRequestBody(genResult.request.body),
        } : undefined,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async *generateInitialStream(description: string): AsyncIterable<string> {
    try {
      const result = await streamText({
        model: this.getGroqModel(),
        system: this.systemPrompt,
        prompt: buildContextualPrompt(description),
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      throw new AIGenerationError(
        `Failed to stream prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async refinePrompt(currentPrompt: string, feedback: string): Promise<GenerationResult> {
    const systemPrompt = this.systemPrompt;
    const userPrompt = `Previous prompt:\n${currentPrompt}\n\nFeedback:\n${feedback}`;
    
    try {
      const genResult = await generateText({
        model: this.getGroqModel(),
        system: systemPrompt,
        messages: [
          { role: 'assistant', content: currentPrompt },
          { role: 'user', content: feedback },
        ],
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!genResult.text?.trim()) {
        throw new AIGenerationError('Empty response from AI model during refinement');
      }

      let result = genResult.text.trim();
      
      // Check for word repetition and fix if needed
      result = await this.deduplicateWords(result);
      
      // Ensure length constraints
      result = await this.ensureLength(result);
      
      return {
        text: result,
        debugInfo: this.debugMode ? {
          systemPrompt,
          userPrompt,
          model: this.model,
          timestamp: new Date().toISOString(),
          requestBody: formatRequestBody(genResult.request.body),
        } : undefined,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(
        `Failed to refine prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async *refinePromptStream(currentPrompt: string, feedback: string): AsyncIterable<string> {
    try {
      const result = await streamText({
        model: this.getGroqModel(),
        system: this.systemPrompt,
        messages: [
          { role: 'assistant', content: currentPrompt },
          { role: 'user', content: feedback },
        ],
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      throw new AIGenerationError(
        `Failed to stream refined prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
