/**
 * Genre Aliases Module
 *
 * Maps common genre variations, misspellings, and alternate names to their
 * canonical GenreType values. This enables more flexible genre detection
 * from user input.
 *
 * @module prompt/deterministic/aliases
 */

import type { GenreType } from '@bun/instruments/genres';

/**
 * Genre alias mappings.
 *
 * Maps common variations, misspellings, and alternate names to canonical genre names.
 * All keys should be lowercase and trimmed. The values are the canonical GenreType.
 *
 * Design rationale:
 * - Hip-hop variants map to 'trap' as our most similar genre
 * - Metal subgenres map to 'metal' or 'stonerrock' based on sonic characteristics
 * - Electronic variants map to the closest matching subgenre
 * - Regional spellings and common typos are included
 */
export const GENRE_ALIASES = {
  // Hip-hop variants → trap (closest match in our registry)
  'hip hop': 'trap',
  'hip-hop': 'trap',
  'hiphop': 'trap',
  'rap': 'trap',
  'boom bap': 'lofi',
  'boombap': 'lofi',
  'lofi hip hop': 'lofi',
  'lofi hiphop': 'lofi',

  // R&B variants
  'r&b': 'rnb',
  'r and b': 'rnb',
  'r n b': 'rnb',
  'rhythm and blues': 'rnb',
  "r'n'b": 'rnb',

  // Synth variants
  'synth pop': 'synthpop',
  'synth-pop': 'synthpop',
  'synth wave': 'synthwave',
  'synth-wave': 'synthwave',
  'retro wave': 'synthwave',
  'retrowave': 'synthwave',

  // Metal variants
  'heavy metal': 'metal',
  'thrash metal': 'metal',
  'death metal': 'metal',
  'black metal': 'metal',
  'nu metal': 'metal',
  'nu-metal': 'metal',
  'doom metal': 'stonerrock',
  'stoner metal': 'stonerrock',
  'sludge metal': 'stonerrock',
  'doom': 'stonerrock',

  // Electronic variants
  'edm': 'electronic',
  'electro': 'electronic',
  'electronica': 'electronic',
  'techno music': 'melodictechno',
  'tech house': 'house',
  'deep house': 'house',
  'progressive house': 'house',
  'progressive trance': 'trance',
  'psytrance': 'trance',
  'psy-trance': 'trance',
  'goa trance': 'trance',

  // Rock variants
  'alternative': 'indie',
  'alt rock': 'indie',
  'alt-rock': 'indie',
  'alternative rock': 'indie',
  'post-rock': 'shoegaze',
  'post rock': 'shoegaze',
  'math-rock': 'mathrock',
  'math rock': 'mathrock',

  // Drum & Bass variants
  'dnb': 'drumandbass',
  'd&b': 'drumandbass',
  'd n b': 'drumandbass',
  'drum n bass': 'drumandbass',
  'drum and bass': 'drumandbass',
  'drum-n-bass': 'drumandbass',
  'liquid dnb': 'drumandbass',
  'neurofunk': 'drumandbass',

  // Lo-fi variants
  'lo-fi': 'lofi',
  'lo fi': 'lofi',
  'lowfi': 'lofi',

  // Trip-hop variants
  'trip-hop': 'downtempo',
  'triphop': 'downtempo',
  'trip hop': 'downtempo',

  // Jazz variants
  'nu jazz': 'jazz',
  'nu-jazz': 'jazz',
  'acid jazz': 'jazz',
  'smooth jazz': 'jazz',
  'bebop': 'jazz',
  'bop': 'jazz',
  'cool jazz': 'jazz',

  // Soul variants
  'neo soul': 'soul',
  'neo-soul': 'soul',
  'motown': 'soul',

  // New wave variants
  'new wave': 'synthpop',
  'new-wave': 'synthpop',
  'newwave': 'synthpop',

  // Garage variants
  'uk garage': 'ukgarage',
  'uk-garage': 'ukgarage',
  '2-step': 'ukgarage',
  '2 step': 'ukgarage',
  'two-step': 'ukgarage',

  // Dubstep variants
  'brostep': 'dubstep',
  'riddim': 'dubstep',

  // Country variants
  'western': 'country',
  'country western': 'country',

  // Classical variants
  'orchestral': 'classical',
  'baroque': 'classical',
  'chamber music': 'classical',

  // Ambient variants
  'atmospheric': 'ambient',
  'drone': 'ambient',

  // World music variants
  'world music': 'afrobeat',
  'world': 'afrobeat',
} as const satisfies Record<string, GenreType>;

/**
 * Resolve a genre alias to its canonical GenreType.
 *
 * Performs case-insensitive, trimmed lookup of the input string against
 * the GENRE_ALIASES mapping. Returns null if no alias match is found.
 *
 * @param input - User input string that may be a genre alias
 * @returns The canonical GenreType if alias found, null otherwise
 *
 * @example
 * resolveGenreAlias('hip hop') // returns 'trap'
 * resolveGenreAlias('R&B') // returns 'rnb'
 * resolveGenreAlias('unknown') // returns null
 */
export function resolveGenreAlias(input: string): GenreType | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.toLowerCase().trim();
  return (GENRE_ALIASES as Record<string, GenreType>)[normalized] ?? null;
}

/**
 * Check if a string matches any genre alias.
 *
 * Searches the input string for any alias substring matches.
 * This is useful for detecting genre aliases within longer descriptions.
 *
 * @param input - Input string to search for aliases
 * @returns The first matching GenreType if found, null otherwise
 *
 * @example
 * findGenreAliasInText('I want hip hop beats') // returns 'trap'
 * findGenreAliasInText('some r&b vibes') // returns 'rnb'
 * findGenreAliasInText('random text') // returns null
 */
export function findGenreAliasInText(input: string): GenreType | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const lower = input.toLowerCase();

  // Check aliases in order of length (longest first for more specific matches)
  const sortedAliases = Object.keys(GENRE_ALIASES).sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    if (lower.includes(alias)) {
      return (GENRE_ALIASES as Record<string, GenreType>)[alias] ?? null;
    }
  }

  return null;
}
