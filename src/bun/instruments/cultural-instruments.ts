/**
 * Cultural/Regional Instruments Database
 *
 * Provides authentic regional instruments and musical scales for cultural context
 * in prompt generation. Used when user descriptions indicate specific cultural
 * or regional musical traditions.
 *
 * @module instruments/cultural-instruments
 */

import { selectRandomN } from '@shared/utils/random';

/**
 * Supported cultural/regional identifiers.
 *
 * These regions represent distinct musical traditions with characteristic
 * instruments and scales that can enhance prompt authenticity.
 */
export type CulturalRegion = 'brazil' | 'japan' | 'celtic' | 'india' | 'middle-east' | 'africa';

/**
 * All supported cultural regions for iteration.
 */
export const CULTURAL_REGIONS: readonly CulturalRegion[] = [
  'brazil',
  'japan',
  'celtic',
  'india',
  'middle-east',
  'africa',
] as const;

/**
 * Cultural instrument database with detailed descriptions.
 *
 * Each region maps to a collection of characteristic instruments that define
 * the sonic palette of that musical tradition.
 *
 * @example
 * ```typescript
 * const brazilInstruments = CULTURAL_INSTRUMENTS.brazil;
 * // ['surdo', 'tamborim', 'cuíca', 'cavaquinho']
 * ```
 */
export const CULTURAL_INSTRUMENTS: Record<CulturalRegion, readonly string[]> = {
  /**
   * Brazilian instruments - Samba, Bossa Nova, Forró traditions.
   * - surdo: Large bass drum providing the heartbeat of samba
   * - tamborim: Small frame drum for high-pitched rhythmic accents
   * - cuíca: Friction drum producing distinctive "laughing" sound
   * - cavaquinho: Small 4-string guitar essential to choro and samba
   */
  brazil: ['surdo', 'tamborim', 'cuíca', 'cavaquinho'],

  /**
   * Japanese instruments - Traditional and contemporary fusion.
   * - koto: 13-string zither with haunting, ethereal tones
   * - shakuhachi: Bamboo end-blown flute with breathy, meditative quality
   * - shamisen: 3-string plucked lute with percussive attack
   * - taiko: Ensemble of powerful drums ranging from massive o-daiko to handheld shime-daiko
   */
  japan: ['koto', 'shakuhachi', 'shamisen', 'taiko'],

  /**
   * Celtic instruments - Irish, Scottish, Welsh traditions.
   * - tin whistle: Simple 6-hole fipple flute with bright, clear tone
   * - bodhrán: Frame drum played with a tipper for rhythmic drive
   * - fiddle: Violin played in traditional folk style with ornamentation
   * - uilleann pipes: Irish bagpipes with sweet, expressive bellows-blown tone
   */
  celtic: ['tin whistle', 'bodhrán', 'fiddle', 'uilleann pipes'],

  /**
   * Indian instruments - Hindustani and Carnatic classical traditions.
   * - sitar: Long-necked plucked string instrument with sympathetic strings
   * - tabla: Pair of tuned drums (dayan and bayan) for intricate rhythms
   * - tanpura: Drone instrument providing harmonic foundation
   * - harmonium: Reed organ adapted for Indian classical music
   */
  india: ['sitar', 'tabla', 'tanpura', 'harmonium'],

  /**
   * Middle Eastern instruments - Arabic, Persian, Turkish traditions.
   * - oud: Fretless short-necked lute, ancestor of the European lute
   * - darbuka: Goblet-shaped hand drum with sharp, focused sound
   * - ney: End-blown flute with breathy, mystical quality
   * - qanun: Plucked zither with 78 strings and quarter-tone levers
   */
  'middle-east': ['oud', 'darbuka', 'ney', 'qanun'],

  /**
   * African instruments - West African, Central African traditions.
   * - djembe: Rope-tuned goblet drum with wide tonal range
   * - balafon: Wooden xylophone with gourd resonators
   * - kora: 21-string bridge-harp with harp-like and lute-like qualities
   * - talking drum: Hourglass-shaped drum that mimics tonal language
   */
  africa: ['djembe', 'balafon', 'kora', 'talking drum'],
} as const;

/**
 * Cultural scale/mode database.
 *
 * Maps each region to characteristic scales and modes that define the
 * harmonic character of its musical tradition.
 *
 * @example
 * ```typescript
 * const japanScale = CULTURAL_SCALES.japan;
 * // 'pentatonic'
 * ```
 */
export const CULTURAL_SCALES: Record<CulturalRegion, string> = {
  /** Brazilian music often uses major-influenced Mixolydian mode */
  brazil: 'mixolydian',

  /** Japanese traditional music uses pentatonic scales (both yo and in scales) */
  japan: 'pentatonic',

  /** Celtic music frequently uses the Dorian mode for its characteristic sound */
  celtic: 'dorian',

  /** Indian classical music uses raga scales (complex melodic frameworks) */
  india: 'raga scales',

  /** Middle Eastern music uses Phrygian dominant (also known as Hijaz maqam) */
  'middle-east': 'phrygian dominant',

  /** African music often uses pentatonic variations with specific regional characteristics */
  africa: 'pentatonic',
} as const;

/**
 * Region aliases for common variations and related terms.
 * Maps alternative names to canonical CulturalRegion values.
 */
const REGION_ALIASES: Readonly<Record<string, CulturalRegion>> = {
  'brazilian': 'brazil',
  'japanese': 'japan',
  'celtic': 'celtic',
  'irish': 'celtic',
  'scottish': 'celtic',
  'indian': 'india',
  'hindustani': 'india',
  'carnatic': 'india',
  'middle east': 'middle-east',
  'middle eastern': 'middle-east',
  'middleeast': 'middle-east',
  'arabic': 'middle-east',
  'persian': 'middle-east',
  'turkish': 'middle-east',
  'african': 'africa',
  'west african': 'africa',
};

/**
 * Resolve a region string to a canonical CulturalRegion.
 *
 * @param region - Region identifier (case-insensitive, trims whitespace)
 * @returns Canonical CulturalRegion or undefined if not recognized
 */
function resolveRegion(region: string): CulturalRegion | undefined {
  const normalized = region.toLowerCase().trim();
  if (normalized in CULTURAL_INSTRUMENTS) {
    return normalized as CulturalRegion;
  }
  return REGION_ALIASES[normalized];
}

/**
 * Get instruments for a specific cultural region.
 *
 * Returns the characteristic instruments associated with a musical tradition.
 * These instruments can be merged with genre instrument pools to add
 * cultural authenticity to generated prompts.
 *
 * @param region - Cultural region identifier (case-insensitive)
 * @returns Array of instrument names, or empty array if region not found
 *
 * @example
 * ```typescript
 * getCulturalInstruments('brazil')
 * // ['surdo', 'tamborim', 'cuíca', 'cavaquinho']
 *
 * getCulturalInstruments('Brazil') // Case-insensitive
 * // ['surdo', 'tamborim', 'cuíca', 'cavaquinho']
 *
 * getCulturalInstruments('unknown')
 * // []
 * ```
 */
export function getCulturalInstruments(region: string): readonly string[] {
  const resolved = resolveRegion(region);
  return resolved ? CULTURAL_INSTRUMENTS[resolved] : [];
}

/**
 * Get the characteristic scale/mode for a cultural region.
 *
 * Returns the primary scale or mode associated with a musical tradition.
 * This can be used to influence harmonic tag selection in prompt generation.
 *
 * @param region - Cultural region identifier (case-insensitive)
 * @returns Scale/mode name, or undefined if region not found
 *
 * @example
 * ```typescript
 * getCulturalScale('japan')
 * // 'pentatonic'
 *
 * getCulturalScale('India') // Case-insensitive
 * // 'raga scales'
 *
 * getCulturalScale('unknown')
 * // undefined
 * ```
 */
export function getCulturalScale(region: string): string | undefined {
  const resolved = resolveRegion(region);
  return resolved ? CULTURAL_SCALES[resolved] : undefined;
}

/**
 * Select random instruments from a cultural region.
 *
 * Uses selectRandomN for fair, deterministic selection via Fisher-Yates shuffle.
 *
 * @param region - Cultural region identifier
 * @param count - Number of instruments to select (default: 2)
 * @param rng - Random number generator function (default: Math.random)
 * @returns Array of selected instrument names
 *
 * @example
 * ```typescript
 * selectCulturalInstruments('brazil', 2, Math.random)
 * // ['cuíca', 'surdo']
 * ```
 */
export function selectCulturalInstruments(
  region: string,
  count = 2,
  rng: () => number = Math.random,
): string[] {
  const instruments = getCulturalInstruments(region);
  if (instruments.length === 0) return [];
  return selectRandomN([...instruments], Math.min(count, instruments.length), rng);
}

/**
 * Check if a region identifier is a valid cultural region.
 *
 * @param region - Region identifier to check
 * @returns True if the region is recognized (including aliases)
 *
 * @example
 * ```typescript
 * isCulturalRegion('brazil')  // true
 * isCulturalRegion('irish')   // true (alias for celtic)
 * isCulturalRegion('unknown') // false
 * ```
 */
export function isCulturalRegion(region: string): boolean {
  const instruments = getCulturalInstruments(region);
  return instruments.length > 0;
}
