import { createGroq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import { detectGenre, getGenreInstruments, detectHarmonic, getHarmonicGuidance, detectRhythmic, getRhythmicGuidance } from '@bun/instruments';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';

export class AIEngine {
  private systemPrompt: string = '';
  private apiKey: string | null = null;
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  setUseSunoTags(value: boolean) {
    this.useSunoTags = value;
    this.systemPrompt = '';
  }

  async initialize() {
    const songStructure = this.useSunoTags ? `
OUTPUT FORMAT (Top-Anchor Strategy):

[Vocal Persona], [Mood], [Genre/Era], Key: [key/mode]

Genre: [specific genre name]
Mood: [2-3 evocative mood descriptors]
Instruments: [with CHARACTER adjectives]
Vocals: [vocal tone/texture description or "none"]

[INTRO] [Sparse instrumentation, set the mood]
[VERSE] [Specific instruments + emotional arc]
[CHORUS] [Full arrangement, peak energy]
[BRIDGE] [Contrasting texture, optional]
[OUTRO] [Resolution style]

SECTION TIP: Specify instruments per section

PERFORMANCE TAGS: (breathy), (belt), (whisper), (ad-lib), (hold)` : `OUTPUT FORMAT (Top-Anchor Strategy):
`;

    this.systemPrompt = `
You are a creative music prompt writer for Suno V5. Transform user descriptions into evocative, inspiring music prompts.
${songStructure}
STRICT CONSTRAINTS:
- Output MUST be under ${APP_CONSTANTS.MAX_PROMPT_CHARS} characters.
- Output ONLY the prompt itself - no explanations or extra text.
`;
  }

  private getGroqModel() {
    const groq = createGroq({
      apiKey: this.apiKey || process.env.GROQ_API_KEY,
    });
    
    return groq(this.model);
  }

  async condenseIfNeeded(text: string): Promise<string> {
    const maxChars = APP_CONSTANTS.MAX_PROMPT_CHARS;
    
    if (text.length <= maxChars) {
      return text;
    }

    let result = text;
    let attempts = 0;
    const maxAttempts = APP_CONSTANTS.AI.MAX_LENGTH_RETRIES;

    while (result.length > maxChars && attempts < maxAttempts) {
      attempts++;
      console.log(`Bun: Condensing attempt ${attempts} - ${result.length} chars`);
      try {
        result = await this.retryForLength(result);
      } catch (error) {
        console.error(`Bun: Condense attempt ${attempts} failed:`, error);
        break;
      }
    }

    // Hard truncation fallback if still over limit
    if (result.length > maxChars) {
      console.log(`Bun: Truncating from ${result.length} to ${maxChars} chars`);
      result = result.slice(0, maxChars - 3) + '...';
    }

    console.log(`Bun: Final length: ${result.length} chars`);
    return result;
  }

  private async retryForLength(text: string): Promise<string> {
    if (!this.systemPrompt) {
      await this.initialize();
    }

    const maxChars = APP_CONSTANTS.MAX_PROMPT_CHARS;
    const targetChars = maxChars - 20; // Small buffer, truncation is fallback
    
    const { text: condensed } = await generateText({
      model: this.getGroqModel(),
      system: `You condense music prompts while preserving quality. Output ONLY the condensed prompt.`,
      prompt: `Condense to under ${targetChars} characters (current: ${text.length}). Preserve all musical details - genre, mood, key, instruments, structure. Only remove redundant words:\n\n${text}`,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });
    return condensed.trim();
  }

  private buildPromptWithGenre(description: string): string {
    const genre = detectGenre(description);
    const harmonic = detectHarmonic(description);
    const rhythmic = detectRhythmic(description);
    
    let context = '';
    if (genre) context += `\n\n${getGenreInstruments(genre)}`;
    if (harmonic) context += `\n\n${getHarmonicGuidance(harmonic)}`;
    if (rhythmic) context += `\n\n${getRhythmicGuidance(rhythmic)}`;
    
    return `Generate a studio-grade Suno V5 prompt for: ${description}${context}`;
  }

  async generateInitial(description: string): Promise<string> {
    if (!this.systemPrompt) {
        await this.initialize();
    }

    try {
      const { text } = await generateText({
        model: this.getGroqModel(),
        system: this.systemPrompt,
        prompt: this.buildPromptWithGenre(description),
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!text || text.trim().length === 0) {
        throw new AIGenerationError('Empty response from AI model');
      }

      let result = text.trim();
      if (result.length > APP_CONSTANTS.MAX_PROMPT_CHARS) {
        result = await this.condenseIfNeeded(result);
      }

      return result;
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      throw new AIGenerationError(`Failed to generate initial prompt: ${message}`, 
          error instanceof Error ? error : undefined);
    }
  }

  async *generateInitialStream(description: string): AsyncIterable<string> {
    if (!this.systemPrompt) {
        await this.initialize();
    }

    try {
      const result = await streamText({
        model: this.getGroqModel(),
        system: this.systemPrompt,
        prompt: this.buildPromptWithGenre(description),
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      throw new AIGenerationError(`Failed to stream initial prompt: ${message}`, 
          error instanceof Error ? error : undefined);
    }
  }

  async refinePrompt(currentPrompt: string, feedback: string): Promise<string> {
    if (!this.systemPrompt) {
        await this.initialize();
    }

    try {
      const { text } = await generateText({
        model: this.getGroqModel(),
        system: this.systemPrompt,
        messages: [
          { role: 'assistant', content: currentPrompt },
          { role: 'user', content: feedback },
        ],
        maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
        abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
      });

      if (!text || text.trim().length === 0) {
        throw new AIGenerationError('Empty response from AI model during refinement');
      }

      let result = text.trim();
      if (result.length > APP_CONSTANTS.MAX_PROMPT_CHARS) {
        result = await this.condenseIfNeeded(result);
      }

      return result;
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      throw new AIGenerationError(`Failed to refine prompt: ${message}`, 
          error instanceof Error ? error : undefined);
    }
  }

  async *refinePromptStream(currentPrompt: string, feedback: string): AsyncIterable<string> {
    if (!this.systemPrompt) {
        await this.initialize();
    }

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
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      throw new AIGenerationError(`Failed to stream refined prompt: ${message}`, 
          error instanceof Error ? error : undefined);
    }
  }
}
