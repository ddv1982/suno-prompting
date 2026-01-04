import { APP_CONSTANTS } from '@shared/constants';

import type { QuickVibesCategory } from '@shared/types';

export type QuickVibesCategoryDefinition = {
  label: string;
  description: string;
  keywords: string[];
  exampleOutput: string;
};

export const QUICK_VIBES_CATEGORIES: Record<QuickVibesCategory, QuickVibesCategoryDefinition> = {
  'lofi-study': {
    label: 'Lo-fi / Study',
    description: 'Chill beats for studying and focus',
    keywords: ['lo-fi', 'study', 'beats', 'chill', 'relaxed'],
    exampleOutput: 'warm lo-fi beats to study to'
  },
  'cafe-coffeeshop': {
    label: 'Cafe / Coffee shop',
    description: 'Cozy acoustic and jazz vibes',
    keywords: ['cafe', 'coffee shop', 'jazz', 'acoustic', 'cozy'],
    exampleOutput: 'relaxing cafe jazz on a sunday morning'
  },
  'ambient-focus': {
    label: 'Ambient / Focus',
    description: 'Atmospheric soundscapes for deep work',
    keywords: ['ambient', 'focus', 'soundscape', 'atmospheric', 'meditative'],
    exampleOutput: 'dreamy ambient soundscape for deep focus'
  },
  'latenight-chill': {
    label: 'Late night / Chill',
    description: 'Mellow late-night listening',
    keywords: ['late night', 'chill', 'mellow', 'nocturnal', 'relaxed'],
    exampleOutput: 'late night chill hop vibes'
  },
  'cozy-rainy': {
    label: 'Cozy / Rainy day',
    description: 'Warm sounds for rainy days',
    keywords: ['cozy', 'rainy', 'warm', 'mellow', 'soft'],
    exampleOutput: 'cozy acoustic music for a rainy afternoon'
  },
  'lofi-chill': {
    label: 'Lo-fi chill',
    description: 'Classic lo-fi chill beats',
    keywords: ['lo-fi', 'chill', 'beats', 'relaxed', 'downtempo'],
    exampleOutput: 'chill lo-fi beats with soft piano'
  }
};

export const QUICK_VIBES_MAX_CHARS = APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;
export const QUICK_VIBES_GENERATION_LIMIT = APP_CONSTANTS.QUICK_VIBES_GENERATION_LIMIT;

// Helper to get category list for UI
export const QUICK_VIBES_CATEGORY_LIST = Object.entries(QUICK_VIBES_CATEGORIES).map(
  ([id, def]) => ({ id: id as QuickVibesCategory, ...def })
);
