/**
 * Creative Boost Pools
 *
 * Genre pools, mood pools, and title word pools for each creativity level.
 *
 * @module prompt/creative-boost/pools
 */

import type { CreativityPool } from './types';
import type { CreativityLevel } from '@shared/types';

// =============================================================================
// Genre Pools by Creativity Level
// =============================================================================

/** Low creativity: Pure, single genres only */
const LOW_GENRES: readonly string[] = [
  'ambient',
  'jazz',
  'rock',
  'electronic',
  'classical',
  'folk',
  'blues',
  'soul',
  'pop',
  'country',
  'reggae',
  'funk',
];

/** Safe creativity: Established, well-known combinations */
const SAFE_GENRES: readonly string[] = [
  'jazz fusion',
  'trip hop',
  'electro pop',
  'indie folk',
  'neo soul',
  'synth pop',
  'acid jazz',
  'folk rock',
  'dream pop',
  'post rock',
  'art rock',
  'nu jazz',
  'chamber pop',
  'shoegaze',
  'downtempo',
];

/** Normal creativity: Mix of single and established combinations */
const NORMAL_GENRES: readonly string[] = [
  ...LOW_GENRES,
  ...SAFE_GENRES.slice(0, 8),
];

/** Adventurous creativity: Cross-genre blends */
const ADVENTUROUS_BASE_GENRES: readonly string[] = [
  'ambient',
  'jazz',
  'electronic',
  'rock',
  'classical',
  'folk',
  'hip hop',
  'r&b',
  'metal',
  'punk',
  'world',
  'experimental',
];

/** High creativity: Experimental fusion bases */
const HIGH_BASE_GENRES: readonly string[] = [
  'doom metal',
  'hyperpop',
  'noise',
  'industrial',
  'vaporwave',
  'glitch',
  'drone',
  'breakcore',
  'darkwave',
  'math rock',
];

/** Secondary genres for experimental fusion */
export const HIGH_FUSION_GENRES: readonly string[] = [
  'bossa nova',
  'bluegrass',
  'baroque',
  'reggae',
  'polka',
  'tango',
  'flamenco',
  'celtic',
  'gospel',
  'surf rock',
];

// =============================================================================
// Creativity Level Pools
// =============================================================================

export const CREATIVITY_POOLS: Record<CreativityLevel, CreativityPool> = {
  low: {
    genres: LOW_GENRES,
    allowBlending: false,
    maxGenres: 1,
  },
  safe: {
    genres: SAFE_GENRES,
    allowBlending: false,
    maxGenres: 1,
  },
  normal: {
    genres: NORMAL_GENRES,
    allowBlending: true,
    maxGenres: 2,
  },
  adventurous: {
    genres: ADVENTUROUS_BASE_GENRES,
    allowBlending: true,
    maxGenres: 3,
  },
  high: {
    genres: HIGH_BASE_GENRES,
    allowBlending: true,
    maxGenres: 2,
  },
};

// =============================================================================
// Mood Pools
// =============================================================================

export const MOOD_POOLS: Record<CreativityLevel, readonly string[]> = {
  low: ['calm', 'peaceful', 'relaxed', 'mellow', 'gentle', 'serene'],
  safe: ['dreamy', 'nostalgic', 'warm', 'intimate', 'cozy', 'soulful'],
  normal: ['energetic', 'uplifting', 'melancholic', 'euphoric', 'contemplative', 'bittersweet'],
  adventurous: ['intense', 'chaotic', 'transcendent', 'primal', 'haunting', 'explosive'],
  high: ['apocalyptic', 'surreal', 'dystopian', 'psychedelic', 'otherworldly', 'feral'],
};

// =============================================================================
// Title Templates
// =============================================================================

export const CREATIVE_TITLE_WORDS = {
  adjectives: [
    'Cosmic', 'Electric', 'Neon', 'Crystal', 'Velvet', 'Golden', 'Silver',
    'Midnight', 'Infinite', 'Ethereal', 'Wild', 'Savage', 'Gentle', 'Fierce',
    'Ancient', 'Future', 'Digital', 'Analog', 'Sacred', 'Mystic',
  ],
  nouns: [
    'Dreams', 'Echoes', 'Shadows', 'Waves', 'Spirits', 'Visions', 'Horizons',
    'Thunder', 'Lightning', 'Storm', 'Ocean', 'Mountain', 'Desert', 'Forest',
    'City', 'Universe', 'Galaxy', 'Pulse', 'Rhythm', 'Soul',
  ],
  suffixes: [
    'Rising', 'Falling', 'Awakening', 'Ascending', 'Descending', 'Burning',
    'Fading', 'Glowing', 'Dancing', 'Calling', 'Dreaming', 'Wandering',
  ],
} as const;

// =============================================================================
// Exported pools for HIGH creativity level
// =============================================================================

export { HIGH_BASE_GENRES };
