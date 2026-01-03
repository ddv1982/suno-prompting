import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import {
  detectGenre,
  detectCombination,
  detectHarmonic,
  detectPolyrhythmCombination,
  detectTimeSignature,
  detectTimeSignatureJourney,
} from '@bun/instruments/detection';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType } from '@bun/instruments/genres';
import type { CombinationType, HarmonicStyle } from '@bun/instruments/modes';
import type { PolyrhythmCombinationType, TimeSignatureType, TimeSignatureJourneyType } from '@bun/instruments/rhythms';
import { createLogger } from '@bun/logger';

const log = createLogger('Selection');

const ALL_GENRES = Object.keys(GENRE_REGISTRY) as [string, ...string[]];

const LLMResponseSchema = z.object({
  genre: z.enum(ALL_GENRES).nullable().optional(),
  combination: z.string().nullable().optional(),
  singleMode: z.string().nullable().optional(),
  polyrhythmCombination: z.string().nullable().optional(),
  reasoning: z.string().optional(),
});

export type ModeSelection = {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  polyrhythmCombination: PolyrhythmCombinationType | null;
  timeSignature: TimeSignatureType | null;
  timeSignatureJourney: TimeSignatureJourneyType | null;
  reasoning: string;
};

const SELECTION_SYSTEM_PROMPT = `You are a music theory expert. Analyze song descriptions and select the best harmonic and rhythmic approach.

HARMONIC COMBINATIONS (for multi-mode journeys):
- major_minor: Joy ↔ Melancholy. Use for: bittersweet, happy-sad, emotional depth
- lydian_minor: Wonder → Shadow. Use for: dreamy-dark, ethereal tension
- lydian_major: Floating → Resolved. Use for: uplifting, bright, hopeful
- dorian_lydian: Groove → Float. Use for: sophisticated, jazz, fusion
- harmonic_major: Tension → Triumph. Use for: dramatic resolution, victory, classical drama
- phrygian_major: Exotic → Liberation. Use for: Spanish, flamenco, exotic triumph
- minor_journey: Sadness → Drama → Resolution. Use for: emotional arcs, grief to acceptance
- lydian_exploration: Dream → Groove → Cosmic. Use for: multiple lydian colors, ethereal variety, "2 lydian types"
- major_modes: Wonder → Joy → Groove. Use for: bright journey, major variety
- dark_modes: Melancholy → Danger → Dread. Use for: horror, descent, darkness

SINGLE MODES (when one specific color is needed):
- lydian: dreamy, floating, cinematic wonder
- lydian_dominant: funky, playful mystery, Simpsons vibe
- lydian_augmented: alien, supernatural, otherworldly
- ionian: happy, bright, resolved, pop
- mixolydian: bluesy, rock, driving groove
- dorian: jazzy, soulful, hopeful minor
- aeolian: sad, melancholic, dramatic
- harmonic_minor: gothic, dramatic, classical tension, vampire
- melodic_minor: jazz, sophisticated, noir
- phrygian: spanish, exotic, metal, tense
- locrian: horror, unstable, experimental

POLYRHYTHM COMBINATIONS (for rhythmic journeys):
- complexity_build: Groove → Drive → Chaos. Use for: building intensity, EDM drops, progressive builds
- triplet_exploration: Shuffle → Tension → Flow. Use for: jazz fusion, exploratory
- odd_journey: Hypnotic → Complex → Intricate. Use for: prog rock, math rock, complex throughout
- tension_arc: Drive → Chaos → Resolution. Use for: full tension/release arc
- groove_to_drive: Shuffle → Driving. Use for: building energy, dance builds
- tension_release: Drive → Shuffle. Use for: drops, satisfying releases
- afrobeat_journey: Swing → Interlocking. Use for: world fusion, African rhythms
- complex_simple: Chaos → Grounded. Use for: progressive resolution

AVAILABLE GENRES:
- ambient: atmospheric, soundscape, ethereal textures
- jazz: bebop, swing, cool jazz, fusion, big band, bossa nova
- electronic: edm, house, techno, dubstep, trance
- rock: alternative, grunge, hard rock, classic rock
- pop: mainstream, dance pop, synth pop
- classical: orchestral, symphony, baroque, romantic
- lofi: lo-fi, chill beats, study music, relaxing
- synthwave: retrowave, outrun, 80s synth, neon
- cinematic: film score, epic, trailer, dramatic orchestral
- folk: acoustic, bluegrass, americana, celtic
- rnb: r&b, neo-soul, contemporary r&b
- videogame: video game, chiptune, 8-bit, arcade, rpg, jrpg
- country: country rock, americana, bluegrass, honky tonk
- blues: electric blues, delta blues, chicago blues
- punk: punk rock, pop punk, emo, hardcore
- metal: heavy metal, doom, progressive metal, thrash
- latin: bossa nova, salsa, tango, flamenco, afro-cuban
- soul: motown, gospel soul, classic soul
- trap: dark trap, melodic trap, drill, phonk
- retro: 50s, 60s, rock and roll, doo-wop, surf rock
- symphonic: symphonic metal, orchestral rock, epic metal

SELECTION RULES:
1. Match EMOTIONAL ARC to combination's arc when possible
2. "heartbreak → hope" = minor_journey or major_minor
3. "epic battle → victory" = harmonic_major
4. "floating, dreamy" = lydian or lydian_exploration
5. "dark, descending" = dark_modes
6. Explicit requests like "2 lydian", "multiple lydian", "lydian types" = lydian_exploration
7. "building polyrhythm" or "evolving rhythm" = complexity_build
8. "complex rhythms throughout" or "prog rhythm" = odd_journey
9. "tension and release rhythm" = tension_arc
10. combination and singleMode are mutually exclusive - pick ONE or the other
11. polyrhythmCombination is INDEPENDENT - can be used with any harmonic choice

Return ONLY valid JSON (no markdown, no explanation):
{"genre":"ambient"|"jazz"|"electronic"|"rock"|"pop"|"classical"|"lofi"|"synthwave"|"cinematic"|"folk"|"rnb"|"videogame"|null,"combination":"<key>"|null,"singleMode":"<key>"|null,"polyrhythmCombination":"<key>"|null,"reasoning":"brief"}`;

export async function selectModesWithLLM(
  description: string,
  model: LanguageModel
): Promise<ModeSelection> {
  const { text } = await generateText({
    model,
    system: SELECTION_SYSTEM_PROMPT,
    prompt: `Analyze this song description and select the best harmonic approach:\n\n"${description}"`,
    maxOutputTokens: 150,
    temperature: 0.1,
  });

  const cleaned = text.trim().replace(/```json\n?|\n?```/g, '');
  const rawParsed = JSON.parse(cleaned);
  const validated = LLMResponseSchema.parse(rawParsed);

  return {
    genre: (validated.genre as GenreType) ?? null,
    combination: (validated.combination as CombinationType) ?? null,
    singleMode: (validated.singleMode as HarmonicStyle) ?? null,
    polyrhythmCombination: (validated.polyrhythmCombination as PolyrhythmCombinationType) ?? null,
    timeSignature: detectTimeSignature(description),
    timeSignatureJourney: detectTimeSignatureJourney(description),
    reasoning: validated.reasoning ?? 'LLM selection',
  };
}

async function correctGenreSpelling(
  description: string,
  model: LanguageModel
): Promise<string> {
  const genreNames = Object.values(GENRE_REGISTRY).map(g => g.name);
  const { text } = await generateText({
    model,
    system: `You are a spelling corrector. Given a music description, identify any misspelled genre names and return the corrected description. Only fix genre-related spelling. Available genres: ${genreNames.join(', ')}.`,
    prompt: `Correct any genre spelling in: "${description}"`,
    maxOutputTokens: 200,
    temperature: 0,
  });
  return text.trim();
}

export async function selectModes(
  description: string,
  model: LanguageModel,
  genreOverride?: string
): Promise<ModeSelection> {
  // If user explicitly selected a genre from dropdown, use it
  if (genreOverride) {
    // Check if it's a valid single genre
    let effectiveGenre: GenreType | null = null;
    if (genreOverride in GENRE_REGISTRY) {
      effectiveGenre = genreOverride as GenreType;
    } else {
      // For combinations (e.g., "jazz fusion"), extract base genre for Max Mode features
      const baseGenre = genreOverride.split(' ').at(0);
      if (baseGenre && baseGenre in GENRE_REGISTRY) {
        effectiveGenre = baseGenre as GenreType;
      }
    }

    return {
      genre: effectiveGenre,
      combination: detectCombination(description),
      singleMode: null,
      polyrhythmCombination: detectPolyrhythmCombination(description),
      timeSignature: detectTimeSignature(description),
      timeSignatureJourney: detectTimeSignatureJourney(description),
      reasoning: `User selected: ${genreOverride}`,
    };
  }

  // Tier 1: Direct match on name + keywords
  let genre = detectGenre(description);
  let reasoning = genre ? `Direct match: ${genre}` : '';

  // Tier 2: LLM spelling correction → re-match
  if (!genre) {
    try {
      const corrected = await correctGenreSpelling(description, model);
      genre = detectGenre(corrected);
      if (genre) {
        reasoning = `Spelling corrected match: ${genre}`;
      }
    } catch (e) {
      log.warn('spelling correction failed', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Tier 3: LLM decides genre (final fallback)
  try {
    const llmResult = await selectModesWithLLM(description, model);
    return {
      ...llmResult,
      genre: genre ?? llmResult.genre,
      reasoning: reasoning || llmResult.reasoning,
    };
  } catch (error) {
    log.warn('LLM selection failed, falling back to keywords', { error: error instanceof Error ? error.message : String(error) });
    const combination = detectCombination(description);
    return {
      genre,
      combination,
      singleMode: combination ? null : detectHarmonic(description),
      polyrhythmCombination: detectPolyrhythmCombination(description),
      timeSignature: detectTimeSignature(description),
      timeSignatureJourney: detectTimeSignatureJourney(description),
      reasoning: reasoning || 'Keyword detection (LLM failed)',
    };
  }
}
