/**
 * Mood Intensity Scaling
 *
 * Maps base moods to intensity variants for 3-level intensity scaling.
 * Each mood has mild, moderate, and intense variants.
 *
 * @module mood/intensity
 */

import type { MoodIntensity } from '@bun/mood/types';

/**
 * Intensity variant mapping for a single mood.
 * Maps intensity level to the appropriate mood word.
 */
export type IntensityVariants = Record<MoodIntensity, string>;

/**
 * Mood intensity map for all mood categories.
 * Maps base mood words to their intensity variants.
 *
 * Structure:
 * - mild: Subtle, understated expression
 * - moderate: Standard, balanced expression
 * - intense: Strong, powerful expression
 */
export const MOOD_INTENSITY_MAP: Record<string, IntensityVariants> = {
  // Energetic category
  euphoric: { mild: 'uplifted', moderate: 'euphoric', intense: 'ecstatic' },
  energetic: { mild: 'lively', moderate: 'energetic', intense: 'explosive' },
  uplifting: { mild: 'hopeful', moderate: 'uplifting', intense: 'triumphant' },
  vibrant: { mild: 'spirited', moderate: 'vibrant', intense: 'electrifying' },
  dynamic: { mild: 'animated', moderate: 'dynamic', intense: 'exhilarating' },

  // Calm category
  serene: { mild: 'quiet', moderate: 'serene', intense: 'transcendent' },
  peaceful: { mild: 'gentle', moderate: 'peaceful', intense: 'blissful' },
  relaxed: { mild: 'mellow', moderate: 'relaxed', intense: 'deeply tranquil' },
  tranquil: { mild: 'soft', moderate: 'tranquil', intense: 'profoundly calm' },
  calm: { mild: 'quiet', moderate: 'calm', intense: 'deeply serene' },

  // Dark category
  haunting: { mild: 'mysterious', moderate: 'haunting', intense: 'terrifying' },
  dark: { mild: 'shadowy', moderate: 'dark', intense: 'pitch black' },
  ominous: { mild: 'foreboding', moderate: 'ominous', intense: 'menacing' },
  brooding: { mild: 'pensive', moderate: 'brooding', intense: 'smoldering' },
  sinister: { mild: 'eerie', moderate: 'sinister', intense: 'malevolent' },

  // Emotional category
  melancholic: { mild: 'wistful', moderate: 'melancholic', intense: 'devastated' },
  sad: { mild: 'pensive', moderate: 'sad', intense: 'heartbroken' },
  nostalgic: { mild: 'reminiscent', moderate: 'nostalgic', intense: 'achingly nostalgic' },
  tender: { mild: 'gentle', moderate: 'tender', intense: 'deeply moving' },
  bittersweet: { mild: 'wistful', moderate: 'bittersweet', intense: 'poignant' },

  // Playful category
  whimsical: { mild: 'quirky', moderate: 'whimsical', intense: 'fantastical' },
  playful: { mild: 'lighthearted', moderate: 'playful', intense: 'exuberant' },
  cheerful: { mild: 'pleasant', moderate: 'cheerful', intense: 'gleeful' },
  fun: { mild: 'amusing', moderate: 'fun', intense: 'riotous' },
  carefree: { mild: 'easygoing', moderate: 'carefree', intense: 'wild and free' },

  // Intense category
  passionate: { mild: 'ardent', moderate: 'passionate', intense: 'fiercely passionate' },
  fierce: { mild: 'strong', moderate: 'fierce', intense: 'ferocious' },
  aggressive: { mild: 'assertive', moderate: 'aggressive', intense: 'savage' },
  powerful: { mild: 'strong', moderate: 'powerful', intense: 'overwhelming' },
  raw: { mild: 'honest', moderate: 'raw', intense: 'visceral' },

  // Atmospheric category
  ethereal: { mild: 'airy', moderate: 'ethereal', intense: 'otherworldly' },
  dreamy: { mild: 'hazy', moderate: 'dreamy', intense: 'surreal' },
  mysterious: { mild: 'enigmatic', moderate: 'mysterious', intense: 'cryptic' },
  hypnotic: { mild: 'mesmerizing', moderate: 'hypnotic', intense: 'entrancing' },
  cosmic: { mild: 'spacey', moderate: 'cosmic', intense: 'transcendent' },

  // Seasonal category
  autumnal: { mild: 'crisp', moderate: 'autumnal', intense: 'deeply autumnal' },
  wintry: { mild: 'cool', moderate: 'wintry', intense: 'frigid' },
  summery: { mild: 'warm', moderate: 'summery', intense: 'scorching' },
  nocturnal: { mild: 'evening', moderate: 'nocturnal', intense: 'midnight' },

  // Social category
  celebratory: { mild: 'festive', moderate: 'celebratory', intense: 'ecstatic' },
  joyful: { mild: 'happy', moderate: 'joyful', intense: 'elated' },
  festive: { mild: 'cheerful', moderate: 'festive', intense: 'raucous' },

  // Sophisticated category
  elegant: { mild: 'refined', moderate: 'elegant', intense: 'opulent' },
  sophisticated: { mild: 'polished', moderate: 'sophisticated', intense: 'exquisite' },
  majestic: { mild: 'stately', moderate: 'majestic', intense: 'regal' },
  graceful: { mild: 'poised', moderate: 'graceful', intense: 'sublime' },

  // Gritty category
  gritty: { mild: 'rough', moderate: 'gritty', intense: 'raw and unpolished' },
  rough: { mild: 'textured', moderate: 'rough', intense: 'abrasive' },
  earthy: { mild: 'grounded', moderate: 'earthy', intense: 'primal' },
  authentic: { mild: 'genuine', moderate: 'authentic', intense: 'unflinchingly real' },

  // Epic category
  epic: { mild: 'grand', moderate: 'epic', intense: 'monumental' },
  heroic: { mild: 'noble', moderate: 'heroic', intense: 'legendary' },
  cinematic: { mild: 'dramatic', moderate: 'cinematic', intense: 'blockbuster' },
  anthemic: { mild: 'rousing', moderate: 'anthemic', intense: 'stadium-sized' },

  // Vulnerable category
  vulnerable: { mild: 'open', moderate: 'vulnerable', intense: 'deeply exposed' },
  intimate: { mild: 'personal', moderate: 'intimate', intense: 'confessional' },
  heartfelt: { mild: 'sincere', moderate: 'heartfelt', intense: 'deeply moving' },
  introspective: { mild: 'thoughtful', moderate: 'introspective', intense: 'soul-searching' },

  // Tense category
  tense: { mild: 'uneasy', moderate: 'tense', intense: 'nail-biting' },
  anxious: { mild: 'restless', moderate: 'anxious', intense: 'paranoid' },
  suspenseful: { mild: 'anticipating', moderate: 'suspenseful', intense: 'nerve-wracking' },
  eerie: { mild: 'unsettling', moderate: 'eerie', intense: 'chilling' },

  // Groove category
  groovy: { mild: 'rhythmic', moderate: 'groovy', intense: 'funky as hell' },
  funky: { mild: 'bouncy', moderate: 'funky', intense: 'deeply funky' },
  danceable: { mild: 'rhythmic', moderate: 'danceable', intense: 'irresistible' },

  // Spiritual category
  spiritual: { mild: 'reflective', moderate: 'spiritual', intense: 'transcendent' },
  sacred: { mild: 'reverent', moderate: 'sacred', intense: 'divine' },
  mystical: { mild: 'enigmatic', moderate: 'mystical', intense: 'otherworldly' },
  healing: { mild: 'soothing', moderate: 'healing', intense: 'transformative' },

  // Eclectic category
  experimental: { mild: 'unconventional', moderate: 'experimental', intense: 'avant-garde' },
  eccentric: { mild: 'quirky', moderate: 'eccentric', intense: 'wildly unconventional' },
  abstract: { mild: 'unconventional', moderate: 'abstract', intense: 'completely abstract' },

  // Attitude category
  defiant: { mild: 'resolute', moderate: 'defiant', intense: 'rebellious' },
  hopeful: { mild: 'optimistic', moderate: 'hopeful', intense: 'triumphant' },
  confident: { mild: 'assured', moderate: 'confident', intense: 'bold' },

  // Texture category
  lush: { mild: 'warm', moderate: 'lush', intense: 'richly layered' },
  sparse: { mild: 'minimal', moderate: 'sparse', intense: 'stark' },
  layered: { mild: 'textured', moderate: 'layered', intense: 'densely layered' },

  // Movement category
  flowing: { mild: 'gentle', moderate: 'flowing', intense: 'surging' },
  driving: { mild: 'propulsive', moderate: 'driving', intense: 'relentless' },
  pulsating: { mild: 'rhythmic', moderate: 'pulsating', intense: 'throbbing' },
};

/**
 * Get the intensity variant for a mood.
 * Falls back to the base mood if no mapping exists.
 *
 * @param baseMood - The base mood word to look up
 * @param intensity - The desired intensity level
 * @returns The mood word adjusted for intensity
 */
export function getIntensityVariant(baseMood: string, intensity: MoodIntensity): string {
  const variants = MOOD_INTENSITY_MAP[baseMood.toLowerCase()];
  if (variants) {
    return variants[intensity];
  }
  // Fall back to base mood if no mapping exists
  return baseMood;
}

/**
 * Check if a mood has intensity variants defined.
 *
 * @param mood - The mood word to check
 * @returns True if intensity variants exist for this mood
 */
export function hasIntensityVariants(mood: string): boolean {
  return mood.toLowerCase() in MOOD_INTENSITY_MAP;
}
