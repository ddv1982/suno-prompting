import { generateText } from 'ai';
import type { LanguageModelV1 } from 'ai';
import { detectGenre, detectCombination, detectHarmonic } from './detection';
import type { GenreType } from './genres';
import type { CombinationType, HarmonicStyle } from './modes';

export type ModeSelection = {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  reasoning: string;
};

const SELECTION_SYSTEM_PROMPT = `You are a music theory expert. Analyze song descriptions and select the best harmonic approach.

AVAILABLE COMBINATIONS (for multi-mode journeys):
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

AVAILABLE GENRES:
- ambient: atmospheric, soundscape, ethereal textures

SELECTION RULES:
1. Match EMOTIONAL ARC to combination's arc when possible
2. "heartbreak → hope" = minor_journey or major_minor
3. "epic battle → victory" = harmonic_major
4. "floating, dreamy" = lydian or lydian_exploration
5. "dark, descending" = dark_modes
6. Explicit requests like "2 lydian", "multiple lydian", "lydian types" = lydian_exploration
7. If description is purely technical, match the mode name
8. If emotional but no clear arc, pick single mode matching dominant emotion
9. combination and singleMode are mutually exclusive - pick ONE or the other

Return ONLY valid JSON (no markdown, no explanation):
{"genre":"ambient"|null,"combination":"<key>"|null,"singleMode":"<key>"|null,"reasoning":"brief"}`;

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
      reasoning: 'Fallback to keyword detection',
    };
  }
}
