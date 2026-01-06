/**
 * Quick Vibes Deterministic Templates
 *
 * Provides genre/instrument/mood pools for each Quick Vibes category,
 * enabling fully deterministic generation without LLM calls.
 *
 * @module prompt/quick-vibes-templates
 */

import type { QuickVibesCategory } from '@shared/types';

// =============================================================================
// Types
// =============================================================================

export type QuickVibesTemplate = {
  /** Genre options for this category */
  genres: readonly string[];
  /** Instrument combination options */
  instruments: readonly (readonly string[])[];
  /** Mood options */
  moods: readonly string[];
  /** Title word pools by position */
  titleWords: {
    adjectives: readonly string[];
    nouns: readonly string[];
    contexts: readonly string[];
  };
};

// =============================================================================
// Category Templates
// =============================================================================

const LOFI_STUDY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'lo-fi',
    'lo-fi hip hop',
    'chillhop',
    'lo-fi beats',
    'study beats',
    'lo-fi jazz',
    'downtempo',
    'trip hop',
  ],
  instruments: [
    ['Rhodes piano', 'vinyl crackle', 'soft drums'],
    ['mellow synth pad', 'boom bap drums', 'bass'],
    ['jazz guitar', 'lo-fi drums', 'warm bass'],
    ['electric piano', 'tape hiss', 'snare'],
    ['soft keys', 'vinyl texture', 'kick drum'],
    ['Wurlitzer', 'ambient pad', 'brushed drums'],
  ],
  moods: [
    'relaxed',
    'focused',
    'mellow',
    'dreamy',
    'calm',
    'peaceful',
    'nostalgic',
    'cozy',
  ],
  titleWords: {
    adjectives: ['Warm', 'Soft', 'Mellow', 'Dreamy', 'Gentle', 'Quiet', 'Hazy', 'Dusty'],
    nouns: ['Beats', 'Vibes', 'Session', 'Study', 'Notes', 'Pages', 'Thoughts', 'Moments'],
    contexts: ['to Study To', 'for Focus', 'Late Night', 'Afternoon', 'Rainy Day', 'Sunday'],
  },
};

const CAFE_COFFEESHOP_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'cafe jazz',
    'bossa nova',
    'acoustic jazz',
    'smooth jazz',
    'coffee shop',
    'easy listening',
    'soft jazz',
    'jazz lounge',
  ],
  instruments: [
    ['acoustic guitar', 'upright bass', 'brushed drums'],
    ['piano', 'double bass', 'soft percussion'],
    ['nylon guitar', 'stand-up bass', 'light drums'],
    ['jazz guitar', 'acoustic bass', 'bongos'],
    ['grand piano', 'bass', 'shaker'],
    ['classical guitar', 'cello', 'light cymbals'],
  ],
  moods: [
    'cozy',
    'warm',
    'intimate',
    'relaxed',
    'sophisticated',
    'gentle',
    'inviting',
    'mellow',
  ],
  titleWords: {
    adjectives: ['Cozy', 'Warm', 'Sunny', 'Morning', 'Golden', 'Soft', 'Gentle', 'Sweet'],
    nouns: ['Cafe', 'Coffee', 'Espresso', 'Latte', 'Morning', 'Corner', 'Brew', 'Jazz'],
    contexts: ['Sunday Morning', 'Afternoon', 'by the Window', 'Downtown', 'in Paris', 'Sessions'],
  },
};

const AMBIENT_FOCUS_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'ambient',
    'atmospheric',
    'drone ambient',
    'space ambient',
    'dark ambient',
    'minimal ambient',
    'ethereal',
    'soundscape',
  ],
  instruments: [
    ['synthesizer pad', 'reverb textures', 'soft drones'],
    ['ambient synth', 'field recordings', 'subtle bells'],
    ['pad layers', 'atmospheric textures', 'gentle hum'],
    ['warm drone', 'glassy synth', 'distant chimes'],
    ['evolving pad', 'granular textures', 'soft noise'],
    ['modular synth', 'tape delay', 'subtle harmonics'],
  ],
  moods: [
    'meditative',
    'focused',
    'spacious',
    'ethereal',
    'deep',
    'contemplative',
    'serene',
    'expansive',
  ],
  titleWords: {
    adjectives: ['Deep', 'Floating', 'Drifting', 'Endless', 'Quiet', 'Still', 'Vast', 'Soft'],
    nouns: ['Space', 'Drift', 'Flow', 'Waves', 'Horizons', 'Depths', 'Light', 'Air'],
    contexts: ['for Focus', 'in Space', 'at Dawn', 'Through Clouds', 'Beyond', 'Within'],
  },
};

const LATENIGHT_CHILL_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'chill',
    'downtempo',
    'chillout',
    'late night',
    'nocturnal',
    'night drive',
    'nu jazz',
    'lounge',
  ],
  instruments: [
    ['electric piano', 'bass synth', 'soft drums'],
    ['Rhodes', 'sub bass', 'electronic drums'],
    ['synth pad', 'warm bass', 'brushed snare'],
    ['mellow keys', 'deep bass', 'light percussion'],
    ['jazz organ', 'fretless bass', 'rim clicks'],
    ['ambient pad', 'bass guitar', 'hi-hats'],
  ],
  moods: [
    'nocturnal',
    'mellow',
    'smooth',
    'sultry',
    'relaxed',
    'intimate',
    'cool',
    'laid-back',
  ],
  titleWords: {
    adjectives: ['Late', 'Midnight', 'Night', 'Dark', 'Quiet', 'Neon', 'Cool', 'Slow'],
    nouns: ['Drive', 'City', 'Streets', 'Lights', 'Hours', 'Moon', 'Shadows', 'Vibes'],
    contexts: ['at 2AM', 'Downtown', 'After Hours', 'in the City', 'on Empty Streets', 'Alone'],
  },
};

const COZY_RAINY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'acoustic',
    'folk',
    'indie folk',
    'soft rock',
    'chamber folk',
    'singer-songwriter',
    'intimate acoustic',
    'warm acoustic',
  ],
  instruments: [
    ['acoustic guitar', 'soft piano', 'cello'],
    ['fingerpicked guitar', 'strings', 'light percussion'],
    ['piano', 'violin', 'acoustic bass'],
    ['nylon guitar', 'flute', 'soft drums'],
    ['mandolin', 'piano', 'upright bass'],
    ['acoustic guitar', 'clarinet', 'brushed snare'],
  ],
  moods: [
    'cozy',
    'warm',
    'nostalgic',
    'comforting',
    'peaceful',
    'gentle',
    'intimate',
    'tender',
  ],
  titleWords: {
    adjectives: ['Rainy', 'Cozy', 'Warm', 'Quiet', 'Soft', 'Grey', 'Misty', 'Gentle'],
    nouns: ['Window', 'Rain', 'Afternoon', 'Blanket', 'Tea', 'Fireplace', 'Home', 'Comfort'],
    contexts: ['by the Fire', 'at Home', 'on a Sunday', 'in Autumn', 'with Tea', 'Inside'],
  },
};

const LOFI_CHILL_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'lo-fi chill',
    'lo-fi',
    'chill beats',
    'chillhop',
    'lo-fi soul',
    'lo-fi r&b',
    'relaxing beats',
    'bedroom pop',
  ],
  instruments: [
    ['lo-fi piano', 'vinyl crackle', 'mellow drums'],
    ['soft synth', 'tape saturation', 'boom bap'],
    ['electric piano', 'lo-fi texture', 'snare'],
    ['sampled piano', 'warm bass', 'hi-hats'],
    ['Rhodes', 'subtle noise', 'kick drum'],
    ['soft keys', 'ambient texture', 'percussion'],
  ],
  moods: [
    'chill',
    'relaxed',
    'mellow',
    'easy',
    'laid-back',
    'peaceful',
    'dreamy',
    'soft',
  ],
  titleWords: {
    adjectives: ['Chill', 'Easy', 'Soft', 'Mellow', 'Lazy', 'Slow', 'Warm', 'Low'],
    nouns: ['Beats', 'Vibes', 'Days', 'Nights', 'Waves', 'Clouds', 'Dreams', 'Tapes'],
    contexts: ['at Sunset', 'on Repeat', 'Forever', 'for Days', 'All Night', 'Always'],
  },
};

// =============================================================================
// Template Registry
// =============================================================================

export const QUICK_VIBES_TEMPLATES: Record<QuickVibesCategory, QuickVibesTemplate> = {
  'lofi-study': LOFI_STUDY_TEMPLATE,
  'cafe-coffeeshop': CAFE_COFFEESHOP_TEMPLATE,
  'ambient-focus': AMBIENT_FOCUS_TEMPLATE,
  'latenight-chill': LATENIGHT_CHILL_TEMPLATE,
  'cozy-rainy': COZY_RAINY_TEMPLATE,
  'lofi-chill': LOFI_CHILL_TEMPLATE,
};

// =============================================================================
// Generation Functions
// =============================================================================

/** Select a random item from an array using provided RNG */
function selectRandom<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  return items[idx] ?? items[0]!;
}

/**
 * Generate a deterministic title from template word pools.
 *
 * @param template - The category template
 * @param rng - Random number generator
 * @returns Generated title
 */
export function generateQuickVibesTitle(
  template: QuickVibesTemplate,
  rng: () => number
): string {
  const { titleWords } = template;
  const adjective = selectRandom(titleWords.adjectives, rng);
  const noun = selectRandom(titleWords.nouns, rng);

  // 50% chance to add context
  if (rng() < 0.5) {
    const context = selectRandom(titleWords.contexts, rng);
    return `${adjective} ${noun} ${context}`;
  }

  return `${adjective} ${noun}`;
}

/**
 * Build a deterministic Quick Vibes prompt from templates.
 *
 * @param category - Quick Vibes category
 * @param withWordlessVocals - Whether to include wordless vocals
 * @param maxMode - Whether to use MAX mode format
 * @param rng - Random number generator (defaults to Math.random)
 * @returns Generated prompt and title
 */
export function buildDeterministicQuickVibes(
  category: QuickVibesCategory,
  withWordlessVocals: boolean,
  maxMode: boolean,
  rng: () => number = Math.random
): { text: string; title: string } {
  const template = QUICK_VIBES_TEMPLATES[category];

  const genre = selectRandom(template.genres, rng);
  const instruments = selectRandom(template.instruments, rng);
  const mood = selectRandom(template.moods, rng);
  const title = generateQuickVibesTitle(template, rng);

  // Build instrument list
  const instrumentList = [...instruments];
  if (withWordlessVocals) {
    instrumentList.push('wordless vocals');
  }

  // Build the prompt based on mode
  if (maxMode) {
    const lines = [
      `Genre: "${genre}"`,
      `Mood: "${mood}"`,
      `Instruments: "${instrumentList.join(', ')}"`,
    ];
    return {
      text: lines.join('\n'),
      title,
    };
  }

  // Standard mode - simpler format
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instrumentList.join(', ')}`,
  ];
  return {
    text: lines.join('\n'),
    title,
  };
}

/**
 * Get template for a category.
 *
 * @param category - Quick Vibes category
 * @returns Template for the category
 */
export function getQuickVibesTemplate(category: QuickVibesCategory): QuickVibesTemplate {
  return QUICK_VIBES_TEMPLATES[category];
}
