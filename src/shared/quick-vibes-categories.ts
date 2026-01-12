import { APP_CONSTANTS } from '@shared/constants';

import type { QuickVibesCategory } from '@shared/types';

export type QuickVibesCategoryDefinition = {
  label: string;
  description: string;
  keywords: string[];
  exampleOutput: string;
};

export const QUICK_VIBES_CATEGORIES: Record<QuickVibesCategory, QuickVibesCategoryDefinition> = {
  // Existing 6 categories
  'lofi-study': {
    label: 'Lo-fi / Study',
    description: 'Chill beats for studying and focus',
    keywords: ['lo-fi', 'study', 'beats', 'chill', 'relaxed'],
    exampleOutput: 'warm lo-fi beats to study to',
  },
  'cafe-coffeeshop': {
    label: 'Cafe / Coffee shop',
    description: 'Cozy acoustic and jazz vibes',
    keywords: ['cafe', 'coffee shop', 'jazz', 'acoustic', 'cozy'],
    exampleOutput: 'relaxing cafe jazz on a sunday morning',
  },
  'ambient-focus': {
    label: 'Ambient / Focus',
    description: 'Atmospheric soundscapes for deep work',
    keywords: ['ambient', 'focus', 'soundscape', 'atmospheric', 'meditative'],
    exampleOutput: 'dreamy ambient soundscape for deep focus',
  },
  'latenight-chill': {
    label: 'Late night / Chill',
    description: 'Mellow late-night listening',
    keywords: ['late night', 'chill', 'mellow', 'nocturnal', 'relaxed'],
    exampleOutput: 'late night chill hop vibes',
  },
  'cozy-rainy': {
    label: 'Cozy / Rainy day',
    description: 'Warm sounds for rainy days',
    keywords: ['cozy', 'rainy', 'warm', 'mellow', 'soft'],
    exampleOutput: 'cozy acoustic music for a rainy afternoon',
  },
  'lofi-chill': {
    label: 'Lo-fi chill',
    description: 'Classic lo-fi chill beats',
    keywords: ['lo-fi', 'chill', 'beats', 'relaxed', 'downtempo'],
    exampleOutput: 'chill lo-fi beats with soft piano',
  },
  // New 10 categories (v3.0) - placeholder definitions for type safety
  // Full template implementations will be added in Phase 4
  'workout-energy': {
    label: 'Workout / Energy',
    description: 'High-energy beats for workouts',
    keywords: ['workout', 'energy', 'pump', 'intense', 'powerful'],
    exampleOutput: 'powerful driving beats for your workout',
  },
  'morning-sunshine': {
    label: 'Morning / Sunshine',
    description: 'Uplifting sounds for morning vibes',
    keywords: ['morning', 'sunshine', 'bright', 'fresh', 'optimistic'],
    exampleOutput: 'bright uplifting music for a fresh morning',
  },
  'sunset-golden': {
    label: 'Sunset / Golden hour',
    description: 'Warm sounds for golden hour',
    keywords: ['sunset', 'golden', 'warm', 'nostalgic', 'peaceful'],
    exampleOutput: 'warm nostalgic vibes for golden hour',
  },
  'dinner-party': {
    label: 'Dinner Party',
    description: 'Sophisticated background music',
    keywords: ['dinner', 'party', 'elegant', 'sophisticated', 'jazz'],
    exampleOutput: 'elegant jazz for a sophisticated dinner',
  },
  'road-trip': {
    label: 'Road Trip',
    description: 'Driving anthems for the open road',
    keywords: ['road trip', 'driving', 'adventure', 'free', 'open'],
    exampleOutput: 'anthemic rock for the open road',
  },
  'gaming-focus': {
    label: 'Gaming / Focus',
    description: 'Immersive sounds for gaming',
    keywords: ['gaming', 'focus', 'epic', 'intense', 'immersive'],
    exampleOutput: 'epic immersive music for gaming sessions',
  },
  'romantic-evening': {
    label: 'Romantic Evening',
    description: 'Intimate sounds for romance',
    keywords: ['romantic', 'intimate', 'sensual', 'tender', 'smooth'],
    exampleOutput: 'smooth intimate R&B for a romantic evening',
  },
  'meditation-zen': {
    label: 'Meditation / Zen',
    description: 'Peaceful sounds for meditation',
    keywords: ['meditation', 'zen', 'peaceful', 'calm', 'healing'],
    exampleOutput: 'peaceful ambient soundscape for meditation',
  },
  'creative-flow': {
    label: 'Creative Flow',
    description: 'Inspiring sounds for creativity',
    keywords: ['creative', 'flow', 'inspired', 'focused', 'productive'],
    exampleOutput: 'inspiring ambient beats for creative work',
  },
  'party-night': {
    label: 'Party Night',
    description: 'Dance beats for party vibes',
    keywords: ['party', 'dance', 'fun', 'energetic', 'celebratory'],
    exampleOutput: 'energetic dance beats for a party night',
  },
};

export const QUICK_VIBES_MAX_CHARS = APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;
export const QUICK_VIBES_GENERATION_LIMIT = APP_CONSTANTS.QUICK_VIBES_GENERATION_LIMIT;

// Helper to get category list for UI
export const QUICK_VIBES_CATEGORY_LIST = Object.entries(QUICK_VIBES_CATEGORIES).map(
  ([id, def]) => ({ id: id as QuickVibesCategory, ...def })
);
