/**
 * Story Generator Module
 *
 * Transforms structured musical data into narrative prose format
 * for Story Mode generation. Uses a hybrid approach where the
 * deterministic builder provides structured data, and an LLM
 * weaves it into cohesive narrative prose.
 *
 * @module ai/story-generator
 */

import { callLLM } from '@bun/ai/llm-utils';
import { createLogger } from '@bun/logger';
import { traceDecision, type TraceCollector } from '@bun/trace';
import { getErrorMessage } from '@shared/errors';
import { MAX_MODE_HEADER } from '@shared/max-format';

import type { GenerationConfig, GenerationResult } from '@bun/ai/types';
import type { ThematicContext } from '@shared/schemas/thematic-context';
import type { LanguageModel } from 'ai';

const log = createLogger('StoryGenerator');

/** Timeout for story generation LLM calls (8 seconds) */
export const STORY_GENERATION_TIMEOUT_MS = 8000;

/**
 * System prompt for story narrative generation.
 * Designed to transform structured musical data into evocative prose.
 */
export const STORY_GENERATION_SYSTEM_PROMPT = `You transform structured music data into evocative narrative prose for Suno AI.

## Your Task
Take the structured musical data and weave it into a cohesive, atmospheric narrative that:
1. Maintains all musical accuracy (genre, BPM, key, instruments)
2. Embeds keywords naturally for Suno compatibility
3. Creates vivid, sensory-rich descriptions
4. Flows as a single cohesive paragraph or short scene

## Output Requirements
- Length: 100-500 characters
- Format: Pure narrative prose (no headers, no bullets, no structured fields)
- Include: Genre keywords, tempo feel, mood descriptors, instruments
- Style: Evocative, atmospheric, sensory-rich

## Examples

INPUT:
{
  "genre": "jazz",
  "bpmRange": "between 80 and 110",
  "key": "D minor",
  "moods": ["melancholic", "smooth"],
  "instruments": ["Rhodes piano", "tenor sax", "upright bass", "brushed drums"],
  "styleTags": ["sophisticated", "late-night", "smoky"],
  "recordingContext": "intimate jazz club"
}

OUTPUT:
The song opens in the intimate glow of a dimly-lit jazz club, where a Rhodes piano plays warm, melancholic chords in D minor. A tenor sax drifts in with a smooth, late-night melody between 80 and 110 BPM while an upright bass walks through sophisticated changes. The brushed drums whisper beneath, creating an atmosphere of wistful longing.

INPUT:
{
  "genre": "electronic",
  "subGenres": ["synthwave", "darkwave"],
  "bpmRange": "between 110 and 130",
  "moods": ["intense", "driving"],
  "instruments": ["analog synthesizers", "pulsing bass", "drum machine"],
  "styleTags": ["neon", "retro-futuristic", "cinematic"],
  "era": "80s"
}

OUTPUT:
Neon-drenched synthwave pulses through the night at 120 BPM, driven by analog synthesizers and a relentless drum machine. The 80s-inspired darkwave aesthetic builds with intense, cinematic tension as pulsing bass lines cut through layers of retro-futuristic atmosphere.

## Critical Rules
- NEVER include section markers like [INTRO], [VERSE], [CHORUS]
- NEVER use structured formats (bullets, numbered lists, key-value pairs)
- NEVER include production notes or technical instructions
- NEVER mention "MAX", "MAX mode", "MAX-generated", or any MAX-related terminology
- ALWAYS embed the tempo/BPM naturally in the narrative
- ALWAYS include key musical elements (genre, main instruments, mood)
- Respond with ONLY the narrative prose, no explanations`;

/**
 * Input data for story generation.
 * Combines data from deterministic builder, thematic context, and user input.
 */
export interface StoryGenerationInput {
  /** Primary genre */
  readonly genre: string;
  /** Sub-genres if applicable */
  readonly subGenres?: readonly string[];
  /** BPM range string (e.g., "between 80 and 110") */
  readonly bpmRange: string;
  /** Musical key if available */
  readonly key?: string;
  /** Mood descriptors */
  readonly moods: readonly string[];
  /** Instruments list */
  readonly instruments: readonly string[];
  /** Style tags */
  readonly styleTags: readonly string[];
  /** Recording context description */
  readonly recordingContext?: string;
  /** Themes from thematic context */
  readonly themes?: readonly string[];
  /** Scene description from thematic context */
  readonly scene?: string;
  /** Era from thematic context (e.g., "70s", "80s") */
  readonly era?: string;
  /** Energy level from thematic context */
  readonly energyLevel?: string;
  /** Original user description */
  readonly description?: string;
  /** Suno V5 styles for Direct Mode */
  readonly sunoStyles?: readonly string[];
  /** Whether this is Direct Mode generation */
  readonly isDirectMode: boolean;
}

/**
 * Options for story narrative generation.
 */
export interface StoryGenerationOptions {
  /** Structured input data for the story */
  readonly input: StoryGenerationInput;
  /** Function to get the language model */
  readonly getModel: () => LanguageModel;
  /** Optional Ollama endpoint for local LLM */
  readonly ollamaEndpoint?: string;
  /** Optional abort signal for timeout/cancellation */
  readonly signal?: AbortSignal;
  /** Optional trace collector for debugging */
  readonly trace?: TraceCollector;
}

/**
 * Result from story generation.
 */
export interface StoryGenerationResult {
  /** Generated narrative prose */
  readonly narrative: string;
  /** Whether generation was successful */
  readonly success: boolean;
  /** Error message if generation failed */
  readonly error?: string;
}

/**
 * Set optional field on object if value is truthy.
 */
function setIfTruthy(
  obj: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  if (value) {
    obj[key] = value;
  }
}

/**
 * Set optional array field on object if array has items.
 */
function setIfHasItems(
  obj: Record<string, unknown>,
  key: string,
  value: readonly unknown[] | undefined
): void {
  if (value && value.length > 0) {
    obj[key] = value;
  }
}

/**
 * Build the JSON input object for story generation.
 */
function buildStoryJsonInput(input: StoryGenerationInput): Record<string, unknown> {
  const jsonInput: Record<string, unknown> = {
    genre: input.genre,
    bpmRange: input.bpmRange,
  };

  setIfHasItems(jsonInput, 'subGenres', input.subGenres);
  setIfTruthy(jsonInput, 'key', input.key);
  setIfHasItems(jsonInput, 'moods', input.moods);
  setIfHasItems(jsonInput, 'instruments', input.instruments);
  setIfHasItems(jsonInput, 'styleTags', input.styleTags);
  setIfTruthy(jsonInput, 'recordingContext', input.recordingContext);
  setIfHasItems(jsonInput, 'themes', input.themes);
  setIfTruthy(jsonInput, 'scene', input.scene);
  setIfTruthy(jsonInput, 'era', input.era);
  setIfTruthy(jsonInput, 'energyLevel', input.energyLevel);

  return jsonInput;
}

/**
 * Build the user prompt from structured input.
 */
function buildStoryUserPrompt(input: StoryGenerationInput): string {
  const parts: string[] = ['Transform this musical data into narrative prose:'];
  parts.push('');

  const jsonInput = buildStoryJsonInput(input);
  parts.push(JSON.stringify(jsonInput, null, 2));

  if (input.isDirectMode && input.sunoStyles?.length) {
    parts.push('');
    parts.push('Important: Incorporate these Suno V5 styles naturally: ' + input.sunoStyles.join(', '));
  }

  return parts.join('\n');
}

/**
 * Generate narrative prose from structured musical data.
 *
 * Uses LLM to transform the deterministic builder output into
 * evocative narrative prose that Suno AI can interpret.
 *
 * @param options - Story generation options
 * @returns StoryGenerationResult with narrative or error
 */
export async function generateStoryNarrative(
  options: StoryGenerationOptions
): Promise<StoryGenerationResult> {
  const { input, getModel, ollamaEndpoint, trace } = options;

  const userPrompt = buildStoryUserPrompt(input);

  log.info('generateStoryNarrative:start', {
    genre: input.genre,
    isDirectMode: input.isDirectMode,
    hasSunoStyles: !!input.sunoStyles?.length,
    hasThemes: !!input.themes?.length,
    useOllama: !!ollamaEndpoint,
  });

  traceDecision(trace, {
    domain: 'other',
    key: 'storyMode.generation.start',
    branchTaken: input.isDirectMode ? 'direct-mode' : 'standard',
    why: `Starting story generation for ${input.genre}${input.isDirectMode ? ' (Direct Mode with styles)' : ''}`,
  });

  try {
    // Use callLLM which handles cloud/Ollama routing, empty response checking, and tracing
    const text = await callLLM({
      getModel,
      systemPrompt: STORY_GENERATION_SYSTEM_PROMPT,
      userPrompt,
      errorContext: 'story generation',
      ollamaEndpoint,
      timeoutMs: STORY_GENERATION_TIMEOUT_MS,
      trace,
      traceLabel: 'story.generation',
    });

    const trimmedText = text.trim();

    log.info('generateStoryNarrative:success', { length: trimmedText.length });

    traceDecision(trace, {
      domain: 'other',
      key: 'storyMode.generation.complete',
      branchTaken: 'success',
      why: `Generated ${trimmedText.length} character narrative`,
    });

    return {
      narrative: trimmedText,
      success: true,
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    log.warn('generateStoryNarrative:failed', { error: message });

    traceDecision(trace, {
      domain: 'other',
      key: 'storyMode.generation.error',
      branchTaken: 'error',
      why: `Story generation failed: ${message}`,
    });

    return {
      narrative: '',
      success: false,
      error: message,
    };
  }
}

/**
 * Prepend MAX Mode headers to narrative output.
 * Used when both Story Mode and MAX Mode are enabled.
 *
 * @param narrative - The generated narrative prose
 * @returns Combined string with MAX headers and narrative
 */
export function prependMaxHeaders(narrative: string): string {
  return `${MAX_MODE_HEADER}\n\n${narrative}`;
}

/**
 * Regex pattern to match MAX Mode headers that should be stripped before LLM processing.
 * Matches bracket-style headers like [HEADER_NAME: value](optional suffix)
 */
const MAX_HEADER_PATTERN = /^\[[A-Z_]+:[^\]]*\](?:\([^)]*\))?\s*/gim;

/**
 * Strip MAX Mode headers from deterministic text.
 * Prevents LLM from incorporating MAX terminology into narrative prose.
 */
function stripMaxHeaders(text: string): string {
  return text.replace(MAX_HEADER_PATTERN, '').trim();
}

/** Regex patterns for extracting data from deterministic output */
const EXTRACTION_PATTERNS = {
  genre: /(?:Genre:|genre:)\s*["']?([^"'\n]+)["']?/i,
  bpm: /(?:BPM:|bpm:)\s*["']?([^"'\n]+)["']?/i,
  key: /(?:Key:|key:)\s*["']?([^"'\n,\]]+)["']?/i,
  mood: /(?:Mood:|moods?:)\s*["']?([^"'\n]+)["']?/i,
  instruments: /(?:Instruments:|instruments:)\s*["']?([^"'\n]+)["']?/i,
  styleTags: /(?:Style Tags:|style tags:)\s*["']?([^"'\n]+)["']?/i,
  recording: /(?:Recording:|recording:)\s*["']?([^"'\n]+)["']?/i,
  header: /^\[([^\]]+)\]/,
} as const;

/**
 * Extract a single string value from text using a regex pattern.
 */
function extractSingleValue(text: string, pattern: RegExp, fallback: string): string {
  const match = pattern.exec(text);
  return match?.[1]?.trim() ?? fallback;
}

/**
 * Extract a comma-separated list from text using a regex pattern.
 */
function extractListValue(text: string, pattern: RegExp): string[] {
  const match = pattern.exec(text);
  if (!match?.[1]) return [];
  return match[1].split(',').map((item) => item.trim()).filter(Boolean);
}

/**
 * Extract sub-genres from header, filtering out moods and key signatures.
 */
function extractSubGenres(text: string, moods: string[]): string[] {
  const match = EXTRACTION_PATTERNS.header.exec(text);
  if (!match?.[1]) return [];

  const moodsLower = moods.map((m) => m.toLowerCase());
  return match[1]
    .split(',')
    .map((p) => p.trim())
    .filter((p) =>
      !p.toLowerCase().includes('key') &&
      p.length > 2 &&
      !moodsLower.includes(p.toLowerCase())
    )
    .slice(0, 3);
}

/**
 * Extract structured data for story generation from deterministic result.
 *
 * @param deterministicText - The text output from deterministic builder
 * @param thematicContext - Optional thematic context from LLM extraction
 * @param options - Generation options containing description and sunoStyles
 * @returns StoryGenerationInput ready for LLM
 */
export function extractStructuredDataForStory(
  deterministicText: string,
  thematicContext: ThematicContext | null,
  options: {
    readonly description?: string;
    readonly sunoStyles?: readonly string[];
  }
): StoryGenerationInput {
  // Strip MAX headers to prevent LLM from incorporating MAX terminology into narrative
  const cleanText = stripMaxHeaders(deterministicText);

  // Extract values from cleaned text
  const genre = extractSingleValue(cleanText, EXTRACTION_PATTERNS.genre, 'pop');
  const bpmRange = extractSingleValue(cleanText, EXTRACTION_PATTERNS.bpm, 'natural tempo');
  const key = extractSingleValue(cleanText, EXTRACTION_PATTERNS.key, '');
  const moods = extractListValue(cleanText, EXTRACTION_PATTERNS.mood);
  const instruments = extractListValue(cleanText, EXTRACTION_PATTERNS.instruments);
  const styleTags = extractListValue(cleanText, EXTRACTION_PATTERNS.styleTags);
  const recordingContext = extractSingleValue(cleanText, EXTRACTION_PATTERNS.recording, '');

  // Extract sub-genres from header
  const subGenres = extractSubGenres(cleanText, moods);

  const isDirectMode = (options.sunoStyles?.length ?? 0) > 0;

  return {
    genre,
    subGenres: subGenres.length > 0 ? subGenres : undefined,
    bpmRange,
    key: key || undefined,
    moods,
    instruments,
    styleTags,
    recordingContext: recordingContext || undefined,
    themes: thematicContext?.themes,
    scene: thematicContext?.scene,
    era: thematicContext?.era,
    energyLevel: thematicContext?.energyLevel,
    description: options.description,
    sunoStyles: options.sunoStyles,
    isDirectMode,
  };
}

/**
 * Generate story narrative with timeout handling.
 * Wraps generateStoryNarrative with AbortController for timeout.
 *
 * @param options - Story generation options (without signal)
 * @returns StoryGenerationResult
 */
export async function generateStoryNarrativeWithTimeout(
  options: Omit<StoryGenerationOptions, 'signal'>
): Promise<StoryGenerationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, STORY_GENERATION_TIMEOUT_MS);

  try {
    const result = await generateStoryNarrative({
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    // Re-wrap as StoryGenerationResult if needed
    const message = getErrorMessage(error);
    return {
      narrative: '',
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// Shared Story Mode Helper
// ============================================================================

/**
 * Options for the shared tryStoryMode helper.
 * Consolidates Story Mode logic used across generation paths.
 */
export interface TryStoryModeOptions {
  /** Structured input for story generation */
  readonly input: StoryGenerationInput;
  /** Generated title */
  readonly title: string;
  /** Generated lyrics (optional, for with-lyrics path) */
  readonly lyrics?: string;
  /** Fallback text to use if story generation fails */
  readonly fallbackText: string;
  /** Generation configuration */
  readonly config: GenerationConfig;
  /** Trace collector for debugging */
  readonly trace?: TraceCollector;
  /** Trace key prefix (e.g., 'generation.storyMode', 'directMode.storyMode') */
  readonly tracePrefix: string;
  /** Log label for identifying the caller */
  readonly logLabel: string;
}

/**
 * Shared Story Mode generation helper.
 *
 * Consolidates the common Story Mode pattern used across:
 * - with-lyrics.ts (tryGenerateStoryModeWithLyrics)
 * - without-lyrics.ts (tryGenerateStoryMode)
 * - direct-mode-generation.ts (tryDirectModeStory)
 *
 * @param options - Story mode options
 * @returns GenerationResult if Story Mode is enabled and LLM available, null otherwise
 */
export async function tryStoryMode(
  options: TryStoryModeOptions
): Promise<GenerationResult | null> {
  const { input, title, lyrics, fallbackText, config, trace, tracePrefix, logLabel } = options;

  // Story Mode requires LLM
  if (!config.isStoryMode() || !config.isLLMAvailable()) {
    return null;
  }

  traceDecision(trace, {
    domain: 'other',
    key: `${tracePrefix}.branch`,
    branchTaken: 'story-mode-enabled',
    why: `Story Mode enabled${lyrics ? ' with lyrics' : ''}; generating narrative prose`,
  });

  log.info(`${logLabel}:storyMode`, {
    genre: input.genre,
    isDirectMode: input.isDirectMode,
    hasLyrics: !!lyrics,
  });

  // Generate narrative with timeout handling
  const storyResult = await generateStoryNarrativeWithTimeout({
    input,
    getModel: config.getModel,
    ollamaEndpoint: config.getOllamaEndpointIfLocal(),
    trace,
  });

  if (storyResult.success) {
    // Prepend MAX headers if MAX Mode is also enabled
    const finalText = config.isMaxMode()
      ? prependMaxHeaders(storyResult.narrative)
      : storyResult.narrative;

    traceDecision(trace, {
      domain: 'other',
      key: `${tracePrefix}.result`,
      branchTaken: 'narrative-generated',
      why: `Story Mode generated ${storyResult.narrative.length} chars${config.isMaxMode() ? ' with MAX headers' : ''}`,
    });

    return {
      text: finalText,
      title,
      lyrics,
      debugTrace: undefined,
    };
  }

  // Fallback on Story Mode failure
  log.warn(`${logLabel}:storyModeFallback`, { error: storyResult.error });

  traceDecision(trace, {
    domain: 'other',
    key: `${tracePrefix}.fallback`,
    branchTaken: 'fallback',
    why: `Story Mode failed: ${storyResult.error ?? 'unknown'}; using fallback output`,
  });

  return {
    text: fallbackText,
    title,
    lyrics,
    debugTrace: undefined,
    storyModeFallback: true,
  };
}
