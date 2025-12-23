import { generateText } from 'ai';
import type { LanguageModelV1 } from 'ai';
import { detectGenre, detectCombination, detectHarmonic, detectPolyrhythmCombination } from '@bun/instruments/detection';
import type { GenreType } from '@bun/instruments/genres';
import type { CombinationType, HarmonicStyle } from '@bun/instruments/modes';
import type { PolyrhythmCombinationType } from '@bun/instruments/rhythms';

export type ModeSelection = {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  polyrhythmCombination: PolyrhythmCombinationType | null;
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
- rock: alternative, punk, metal, grunge, hard rock
- pop: mainstream, dance pop, synth pop
- classical: orchestral, symphony, baroque, romantic
- lofi: lo-fi, chill beats, study music, relaxing
- synthwave: retrowave, outrun, 80s synth, neon
- cinematic: film score, epic, trailer, dramatic orchestral
- folk: acoustic, bluegrass, country, americana, celtic
- rnb: r&b, soul, neo-soul, motown
- videogame: video game, chiptune, 8-bit, arcade, rpg, jrpg, boss battle

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
  model: LanguageModelV1
): Promise<ModeSelection> {
  const { text } = await generateText({
    model,
    system: SELECTION_SYSTEM_PROMPT,
    prompt: `Analyze this song description and select the best harmonic approach:\n\n"${description}"`,
    maxTokens: 150,
    temperature: 0.1,
  });

  const cleaned = text.trim().replace(/```json\n?|\n?```/g, '');
  return JSON.parse(cleaned) as ModeSelection;
}

export async function selectModes(
  description: string,
  model: LanguageModelV1
): Promise<ModeSelection> {
  try {
    return await selectModesWithLLM(description, model);
  } catch (error) {
    console.warn('[Selection] LLM selection failed, falling back to keywords:', error);
    return {
      genre: detectGenre(description),
      combination: detectCombination(description),
      singleMode: detectCombination(description) ? null : detectHarmonic(description),
      polyrhythmCombination: detectPolyrhythmCombination(description),
      reasoning: 'Fallback to keyword detection',
    };
  }
}
