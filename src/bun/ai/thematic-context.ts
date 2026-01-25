/**
 * Thematic Context Extraction Module
 *
 * Extracts themes, moods, and scene phrases from user descriptions using LLM.
 * Part of the hybrid LLM + deterministic architecture for song context preservation.
 *
 * @module ai/thematic-context
 */

import { callLLM } from '@bun/ai/llm-utils';
import { createLogger } from '@bun/logger';
import { traceDecision, traceError } from '@bun/trace';
import { ThematicContextSchema } from '@shared/schemas/thematic-context';

import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';
import type { LanguageModel } from 'ai';

const log = createLogger('ThematicContext');

/** Minimum description length for extraction (chars) */
const MIN_DESCRIPTION_LENGTH = 10;

/** Maximum cache size for thematic context */
const MAX_CACHE_SIZE = 10;

/** Cache for thematic context to avoid redundant LLM calls */
const thematicCache = new Map<string, ThematicContext>();

/**
 * Clear the thematic context cache (for testing).
 */
export function clearThematicCache(): void {
  thematicCache.clear();
}

/**
 * System prompt for thematic context extraction.
 * Designed to return only valid JSON without markdown formatting.
 *
 * Core enrichment fields:
 * - era: Production era inferred from context clues
 * - tempo: BPM adjustment and energy curve based on scene
 * - contrast: Section-by-section mood and dynamics progression
 *
 * Intent and reference fields:
 * - intent: Listening intent classification
 * - musicalReference: Style/signature extraction (NO ARTIST NAMES)
 *
 * Vocal and spatial fields:
 * - vocalCharacter: Vocal style characteristics
 * - energyLevel: Overall energy intensity
 * - spatialHint: Space and reverb suggestions
 *
 * Narrative and cultural fields:
 * - narrativeArc: Emotional journey for narrative-driven songs
 * - culturalContext: Regional instruments and scales for authentic production
 */
const THEMATIC_EXTRACTION_SYSTEM_PROMPT = `You extract thematic context from song descriptions for music generation.

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "themes": ["word1", "word2", "word3"],
  "moods": ["mood1", "mood2"],
  "scene": "5-10 word scene phrase...",
  "era": "70s",
  "tempo": { "adjustment": -10, "curve": "gradual-rise" },
  "contrast": { "sections": [{ "type": "verse", "mood": "melancholic", "dynamics": "soft" }] },
  "intent": "cinematic",
  "musicalReference": { "style": ["progressive rock"], "era": "70s", "signature": ["spacey guitar delay", "slow build"] },
  "narrativeArc": ["isolation", "hope", "triumph"],
  "culturalContext": { "region": "brazil", "instruments": ["surdo", "tamborim"], "scale": "mixolydian" },
  "vocalCharacter": { "style": "powerful", "layering": "harmonies", "technique": "belt" },
  "energyLevel": "energetic",
  "spatialHint": { "space": "hall", "reverb": "wet" }
}

REQUIRED FIELDS:
- themes: exactly 3 single words, most distinctive/unique aspects
- moods: 2-3 words describing emotional tone (not genre descriptors)
- scene: short evocative phrase (5-10 words) setting the scene

OPTIONAL ENRICHMENT FIELDS (include only if clearly indicated):

ERA - Production era if context suggests it:
  Values: "50s-60s", "70s", "80s", "90s", "2000s", "modern"
  Inference rules:
  - "vintage", "tape", "vinyl", "analog", "old-school" → "70s"
  - "synth", "neon", "retro wave" → "80s"
  - "grunge", "rave", "trip-hop" → "90s"
  - "polished", "digital" → "2000s"
  - "contemporary", "current", "fresh" → "modern"
  - "doo-wop", "early rock", "classic jazz" → "50s-60s"

TEMPO - BPM adjustment and energy curve:
  adjustment: -30 (much slower) to +30 (much faster) from genre default
  curve: "steady" | "gradual-rise" | "gradual-fall" | "explosive"
  Inference:
  - "calm", "meditation", "relaxed", "slow" → adjustment: -15 to -30
  - "energetic", "intense", "chase", "fast" → adjustment: +15 to +30
  - "building to climax" → curve: "gradual-rise"
  - "fading out", "winding down" → curve: "gradual-fall"
  - "sudden drop", "explosive energy" → curve: "explosive"

CONTRAST - Section mood/dynamics progression (for descriptions with mood shifts):
  sections: array of { type, mood, dynamics }
  type: "intro" | "verse" | "pre-chorus" | "chorus" | "bridge" | "breakdown" | "outro"
  mood: single word describing section emotion
  dynamics: "soft" | "building" | "powerful" | "explosive"
  Example patterns:
  - "whispered verse, powerful chorus" → verse: soft, chorus: powerful
  - "builds from quiet to explosive" → intro: soft, bridge: building, chorus: explosive
  - "peaceful with sudden storm" → verse: soft, bridge: explosive

INTENT - Listening purpose classification:
  Values: "background" | "focal" | "cinematic" | "dancefloor" | "emotional"
  Classification rules:
  - "studying", "work", "focus", "ambient", "relaxing" → "background"
  - "concert", "showcase", "featured", "main event" → "focal"
  - "film", "movie", "trailer", "epic", "dramatic", "soundtrack" → "cinematic"
  - "club", "dance", "party", "DJ", "rave", "festival" → "dancefloor"
  - "sad", "heartbreak", "emotional", "touching", "moving" → "emotional"

MUSICAL REFERENCE - Extract production style characteristics:
  *** CRITICAL: NEVER include artist names in the output ***
  Only extract style characteristics and production elements.
  
  style: array of genre/style descriptors (e.g., ["progressive rock", "psychedelic"])
  era: production era if referenced (e.g., "70s", "80s")
  signature: array of production elements (e.g., ["spacey guitar delay", "slow build", "ambient textures"])
  
  Example extractions:
  - "like Pink Floyd" → { "style": ["progressive rock", "psychedelic"], "era": "70s", "signature": ["spacey guitar delay", "ambient textures", "slow build"] }
  - "Billie Eilish whispered vocals" → { "style": ["dark pop", "minimal"], "signature": ["whispered vocals", "sparse production", "bass-heavy"] }
  - "Daft Punk-style vocoder" → { "style": ["electronic funk"], "signature": ["vocoder vocals", "robotic effects"] }
  - "80s synth pop sound" → { "style": ["synth pop"], "era": "80s", "signature": ["analog synthesizers", "gated drums"] }

  DO NOT output: "Pink Floyd", "Billie Eilish", "Daft Punk" or any artist name
  ONLY output: style characteristics, production techniques, sonic signatures

NARRATIVE ARC - Emotional journey for narrative-driven songs:
  Array of 2-5 emotion words describing the story arc progression.
  Extraction rules:
  - "journey from isolation to hope to triumph" → ["isolation", "hope", "triumph"]
  - "starts peaceful, builds tension, releases into joy" → ["peaceful", "tense", "joyful"]
  - "stages of grief" → ["denial", "anger", "acceptance"]
  - Only include if description implies a clear emotional progression
  - Each element is a single emotion word
  - Order matters: first element is start, last element is conclusion
  Example inputs:
  - "a story of heartbreak turning to acceptance" → ["heartbreak", "grief", "acceptance"]
  - "building from despair through struggle to victory" → ["despair", "struggle", "hope", "victory"]
  - "the calm before the storm then peace again" → ["calm", "chaotic", "peaceful"]

CULTURAL CONTEXT - Regional instruments and scales for authentic production:
  Object with region, instruments (array), and scale for specific cultural contexts.
  
  region: lowercase region identifier (e.g., "brazil", "japan", "celtic", "india", "middle-east", "africa")
  instruments: array of region-specific instruments
  scale: characteristic scale or mode
  
  Regional mappings:
  - Brazil → instruments: ["surdo", "tamborim", "cuíca", "cavaquinho"], scale: "mixolydian"
  - Japan → instruments: ["koto", "shakuhachi", "shamisen", "taiko"], scale: "pentatonic" or "in scale"
  - Celtic → instruments: ["tin whistle", "bodhrán", "fiddle", "uilleann pipes"], scale: "dorian" or "mixolydian"
  - India → instruments: ["sitar", "tabla", "tanpura", "harmonium"], scale: "raga"
  - Middle East → instruments: ["oud", "darbuka", "ney", "qanun"], scale: "phrygian dominant" or "maqam"
  - Africa → instruments: ["djembe", "balafon", "kora", "talking drum"], scale: "pentatonic"
  
  Example inputs:
  - "Brazilian carnival" → { "region": "brazil", "instruments": ["surdo", "tamborim", "cuíca"], "scale": "mixolydian" }
  - "Japanese lo-fi city pop" → { "region": "japan", "instruments": ["koto-inspired synth"], "scale": "pentatonic" }
  - "Celtic folk ballad" → { "region": "celtic", "instruments": ["tin whistle", "bodhrán", "fiddle"], "scale": "dorian" }
  - "Indian classical fusion" → { "region": "india", "instruments": ["sitar", "tabla"], "scale": "raga" }
  
  Only include if description clearly references a specific culture/region.

VOCAL CHARACTER - Extract vocal style characteristics:
  style: Primary vocal quality (e.g., "breathy", "powerful", "raspy", "smooth", "ethereal")
  layering: Vocal arrangement (e.g., "solo", "harmonies", "choir", "double-tracked", "layered")
  technique: Special techniques (e.g., "falsetto", "belt", "whisper", "growl", "scat")
  
  Example extractions:
  - "intimate whispered vocals" → { "style": "breathy", "technique": "whisper" }
  - "powerful gospel choir" → { "style": "powerful", "layering": "choir" }
  - "soulful harmonies" → { "layering": "harmonies" }
  - "raspy blues voice" → { "style": "raspy" }
  - "operatic soprano" → { "style": "powerful", "technique": "belt" }
  
  Only include if vocals are implied/mentioned in description.

ENERGY LEVEL - Classify overall energy:
  Values: "ambient" | "relaxed" | "moderate" | "energetic" | "intense"
  
  Classification rules:
  - Meditation, sleep, spa, drone → "ambient"
  - Chill, lo-fi, coffee shop, gentle → "relaxed"
  - Balanced, everyday, casual → "moderate"
  - Upbeat, workout, driving, party → "energetic"
  - Hardcore, rave, aggressive, mosh pit → "intense"
  
  Always include when determinable from context.

SPATIAL HINT - Infer spatial environment from scene:
  space: "intimate" | "room" | "hall" | "vast"
  reverb: "dry" | "natural" | "wet" | "cavernous"
  
  Scene-to-space mappings:
  - "bedroom", "whispered", "close", "headphones" → space: "intimate", reverb: "dry"
  - "studio", "recording", "practice room" → space: "room", reverb: "natural"
  - "concert", "arena", "stage", "theater" → space: "hall", reverb: "wet"
  - "cathedral", "mountains", "space", "void" → space: "vast", reverb: "cavernous"
  
  Extract from scene description when spatial context is clear.

CRITICAL RULES:
- NEVER include artist names anywhere in the output - extract only style/production characteristics
- Only include optional fields if the description clearly suggests them
- Return null or omit fields for ambiguous cases
- No markdown formatting, just raw JSON`;

/**
 * Options for extracting thematic context from a description.
 */
export interface ExtractThematicContextOptions {
  /** User's song description */
  readonly description: string;
  /** Function to get the language model */
  readonly getModel: () => LanguageModel;
  /** Optional Ollama endpoint for offline mode */
  readonly ollamaEndpoint?: string;
  /** Optional trace collector */
  readonly trace?: TraceCollector;
  /** Optional abort signal for cancellation */
  readonly signal?: AbortSignal;
}

/**
 * Builds the user prompt for thematic extraction.
 */
function buildUserPrompt(description: string): string {
  return `Extract thematic context from this song description:\n\n"${description}"`;
}

/**
 * Strip markdown code fences from LLM response.
 * LLMs often wrap JSON in ```json ... ``` despite instructions.
 */
function stripMarkdownFence(text: string): string {
  return text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
}

/**
 * Parses and validates the LLM response as ThematicContext.
 * Returns null if parsing or validation fails.
 */
/**
 * Normalize themes to exactly 3 elements.
 * If fewer than 3, pad with the first theme; if more, take first 3.
 */
function normalizeThemes(themes: string[]): [string, string, string] {
  if (themes.length >= 3) {
    return [themes[0], themes[1], themes[2]] as [string, string, string];
  }
  const first = themes[0] ?? 'unknown';
  const second = themes[1] ?? first;
  const third = themes[2] ?? first;
  return [first, second, third];
}

function parseThematicResponse(rawResponse: string): ThematicContext | null {
  try {
    const cleaned = stripMarkdownFence(rawResponse);
    const parsed: unknown = JSON.parse(cleaned);
    const validated = ThematicContextSchema.parse(parsed);
    // Normalize themes to exactly 3
    const normalized: ThematicContext = {
      ...validated,
      themes: normalizeThemes(validated.themes),
    };
    return normalized;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    log.warn('parseThematicResponse:failed', { error: message });
    return null;
  }
}

/**
 * Extracts thematic context (themes, moods, scene) from a description using LLM.
 *
 * Returns null if:
 * - Description is empty or too short (<10 chars)
 * - LLM returns invalid/malformed response
 *
 * Note: Timeout is handled by the caller via Promise.race pattern in generation.ts.
 * This function does not have its own timeout - it will complete when the LLM responds.
 *
 * @param options - Extraction options
 * @returns ThematicContext or null if extraction fails
 *
 * @example
 * ```typescript
 * const context = await extractThematicContext({
 *   description: 'exploring an alien jungle with bioluminescent plants',
 *   getModel: () => groq('llama-3.1-8b-instant'),
 * });
 * // Returns: { themes: ['alien', 'bioluminescent', 'discovery'], moods: ['wondrous', 'curious'], scene: 'first steps into an alien jungle...' }
 * ```
 */
export async function extractThematicContext(
  options: ExtractThematicContextOptions
): Promise<ThematicContext | null> {
  const { description, getModel, ollamaEndpoint, trace } = options;

  // Early return for empty or short descriptions
  const trimmed = description?.trim();
  if (!trimmed || trimmed.length < MIN_DESCRIPTION_LENGTH) {
    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.skip',
      branchTaken: 'description-too-short',
      why: `Description length ${trimmed?.length ?? 0} < ${MIN_DESCRIPTION_LENGTH}, skipping extraction`,
    });
    return null;
  }

  // Check cache first
  const cacheKey = trimmed.toLowerCase();
  const cached = thematicCache.get(cacheKey);
  if (cached) {
    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.cache',
      branchTaken: 'cache-hit',
      why: `Cache hit for description; returning cached context`,
    });
    log.info('extractThematicContext:cacheHit', { themes: cached.themes });
    return cached;
  }

  const userPrompt = buildUserPrompt(trimmed);

  try {
    // Use callLLM which handles cloud/Ollama routing, tracing, and error handling
    const rawResponse = await callLLM({
      getModel,
      systemPrompt: THEMATIC_EXTRACTION_SYSTEM_PROMPT,
      userPrompt,
      errorContext: 'thematic extraction',
      ollamaEndpoint,
      maxRetries: 1, // One retry for transient failures
      trace,
      traceLabel: 'thematic.extraction',
    });

    // Parse and validate JSON response
    const validated = parseThematicResponse(rawResponse);

    if (!validated) {
      traceDecision(trace, {
        domain: 'other',
        key: 'thematic.extraction.fallback',
        branchTaken: 'malformed-json',
        why: 'LLM returned malformed JSON, falling back to deterministic',
      });
      return null;
    }

    // Cache the result
    if (thematicCache.size >= MAX_CACHE_SIZE) {
      const firstKey = thematicCache.keys().next().value;
      if (firstKey) thematicCache.delete(firstKey);
    }
    thematicCache.set(cacheKey, validated);

    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.success',
      branchTaken: 'llm-extracted',
      why: `Extracted ${validated.themes.length} themes, ${validated.moods.length} moods`,
      selection: {
        method: 'index',
        chosenIndex: 0,
        candidates: validated.themes,
      },
    });

    log.info('extractThematicContext:success', {
      themes: validated.themes,
      moodsCount: validated.moods.length,
    });

    return validated;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.warn('extractThematicContext:failed', { error: message });

    traceError(trace, error);
    traceDecision(trace, {
      domain: 'other',
      key: 'thematic.extraction.fallback',
      branchTaken: 'extraction-failed',
      why: `Extraction failed: ${message}`,
    });

    return null;
  }
}
