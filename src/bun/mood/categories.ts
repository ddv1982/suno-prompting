/**
 * Mood Categories Registry
 *
 * Contains all mood category definitions with their individual moods.
 * Compatible genres are populated at initialization via reverse lookup.
 *
 * @module mood/categories
 *
 * @standards-exception
 * This file intentionally exceeds the 300-line guideline.
 * Reason: Pure data registry - contains static mood category definitions, not logic.
 * Approved: 2026-01-12
 */

import type {
  MoodCategory,
  MoodCategoryOption,
  MoodCategoryRegistry,
} from './types';

/**
 * Mood category definitions.
 * Moods are extracted from MOOD_POOL semantic groupings.
 * compatibleGenres are populated at module initialization via reverse lookup.
 */
export const MOOD_CATEGORIES: MoodCategoryRegistry = {
  energetic: {
    name: 'Energetic',
    moods: [
      'euphoric',
      'explosive',
      'triumphant',
      'exhilarating',
      'electrifying',
      'uplifting',
      'ecstatic',
      'exuberant',
      'effervescent',
      'spirited',
      'animated',
      'lively',
      'energetic',
      'vibrant',
      'dynamic',
      'rousing',
      'thrilling',
    ] as const,
    compatibleGenres: [],
  },
  calm: {
    name: 'Calm',
    moods: [
      'serene',
      'peaceful',
      'tranquil',
      'meditative',
      'soothing',
      'gentle',
      'calming',
      'relaxed',
      'mellow',
      'languid',
      'soft',
      'quiet',
    ] as const,
    compatibleGenres: [],
  },
  dark: {
    name: 'Dark',
    moods: [
      'haunting',
      'sinister',
      'ominous',
      'menacing',
      'foreboding',
      'brooding',
      'gloomy',
      'bleak',
      'somber',
      'grim',
      'macabre',
    ] as const,
    compatibleGenres: [],
  },
  emotional: {
    name: 'Emotional',
    moods: [
      'melancholic',
      'wistful',
      'bittersweet',
      'yearning',
      'nostalgic',
      'tender',
      'poignant',
      'sentimental',
      'mournful',
      'longing',
      'regretful',
    ] as const,
    compatibleGenres: [],
  },
  playful: {
    name: 'Playful',
    moods: [
      'whimsical',
      'mischievous',
      'carefree',
      'lighthearted',
      'jovial',
      'quirky',
      'playful',
      'cheerful',
      'silly',
      'fun',
      'gleeful',
      'perky',
    ] as const,
    compatibleGenres: [],
  },
  intense: {
    name: 'Intense',
    moods: [
      'passionate',
      'fierce',
      'relentless',
      'urgent',
      'raw',
      'visceral',
      'aggressive',
      'powerful',
      'ferocious',
      'savage',
      'volatile',
    ] as const,
    compatibleGenres: [],
  },
  atmospheric: {
    name: 'Atmospheric',
    moods: [
      'ethereal',
      'dreamy',
      'mysterious',
      'hypnotic',
      'otherworldly',
      'cosmic',
      'atmospheric',
      'surreal',
      'luminous',
      'shimmering',
      'immersive',
      'spacey',
      'hazy',
      'misty',
      'vaporous',
    ] as const,
    compatibleGenres: [],
  },
  seasonal: {
    name: 'Seasonal',
    moods: [
      'autumnal',
      'wintry',
      'summery',
      'springlike',
      'nocturnal',
      'late-night',
    ] as const,
    compatibleGenres: [],
  },
  social: {
    name: 'Social',
    moods: [
      'celebratory',
      'joyful',
      'boisterous',
      'rowdy',
      'raucous',
      'festive',
    ] as const,
    compatibleGenres: [],
  },
  sophisticated: {
    name: 'Sophisticated',
    moods: [
      'sophisticated',
      'elegant',
      'refined',
      'graceful',
      'stately',
      'opulent',
      'majestic',
      'regal',
      'dignified',
      'noble',
      'classy',
    ] as const,
    compatibleGenres: [],
  },
  gritty: {
    name: 'Gritty',
    moods: [
      'gritty',
      'smoky',
      'rough',
      'rugged',
      'earthy',
      'organic',
      'rustic',
      'tough',
      'street-smart',
      'authentic',
      'unpolished',
    ] as const,
    compatibleGenres: [],
  },
  epic: {
    name: 'Epic',
    moods: [
      'epic',
      'grand',
      'monumental',
      'sweeping',
      'soaring',
      'sprawling',
      'bombastic',
      'heroic',
      'cinematic',
      'anthemic',
    ] as const,
    compatibleGenres: [],
  },
  vulnerable: {
    name: 'Vulnerable',
    moods: [
      'vulnerable',
      'intimate',
      'confessional',
      'heartfelt',
      'honest',
      'earnest',
      'sincere',
      'introspective',
      'contemplative',
    ] as const,
    compatibleGenres: [],
  },
  tense: {
    name: 'Tense',
    moods: [
      'tense',
      'suspenseful',
      'anxious',
      'paranoid',
      'unsettling',
      'eerie',
      'spooky',
      'threatening',
    ] as const,
    compatibleGenres: [],
  },
  groove: {
    name: 'Groove',
    moods: [
      'groovy',
      'funky',
      'bouncy',
      'tight',
      'syncopated',
      'swinging',
      'danceable',
      'rhythmic',
      'pulsing',
    ] as const,
    compatibleGenres: [],
  },
  spiritual: {
    name: 'Spiritual',
    moods: [
      'spiritual',
      'devotional',
      'sacred',
      'transcendent',
      'reverent',
      'healing',
      'mystical',
      'divine',
    ] as const,
    compatibleGenres: [],
  },
  eclectic: {
    name: 'Eclectic',
    moods: [
      'eccentric',
      'offbeat',
      'unconventional',
      'experimental',
      'abstract',
      'avant-garde',
    ] as const,
    compatibleGenres: [],
  },
  attitude: {
    name: 'Attitude',
    moods: [
      'defiant',
      'hopeful',
      'rebellious',
      'confident',
      'bold',
      'assertive',
      'determined',
      'resolute',
    ] as const,
    compatibleGenres: [],
  },
  texture: {
    name: 'Texture',
    moods: [
      'layered',
      'textured',
      'dense',
      'crisp',
      'airy',
      'fluid',
      'lush',
      'rich',
      'sparse',
      'minimal',
    ] as const,
    compatibleGenres: [],
  },
  movement: {
    name: 'Movement',
    moods: [
      'flowing',
      'pulsating',
      'evolving',
      'building',
      'swelling',
      'driving',
      'propulsive',
      'kinetic',
    ] as const,
    compatibleGenres: [],
  },
} as const;

/**
 * All mood category keys for iteration.
 */
export const MOOD_CATEGORY_KEYS = Object.keys(MOOD_CATEGORIES) as MoodCategory[];

/**
 * Get all mood category options for combobox.
 * Includes empty option for "None/Auto" selection.
 *
 * @returns Array of mood category options with "None (Auto)" as first option
 */
export function getMoodCategoryOptions(): MoodCategoryOption[] {
  return [
    { value: '', label: 'None (Auto)' },
    ...MOOD_CATEGORY_KEYS.map((key) => ({
      value: key,
      label: MOOD_CATEGORIES[key].name,
    })),
  ];
}
