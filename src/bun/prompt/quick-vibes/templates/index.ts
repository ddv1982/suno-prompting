/**
 * Quick Vibes Templates
 *
 * Re-exports all Quick Vibes category templates and provides the template registry.
 *
 * @module prompt/quick-vibes/templates
 */

// Existing 6 templates
import {
  LOFI_STUDY_TEMPLATE,
  CAFE_COFFEESHOP_TEMPLATE,
  AMBIENT_FOCUS_TEMPLATE,
  LATENIGHT_CHILL_TEMPLATE,
  COZY_RAINY_TEMPLATE,
  LOFI_CHILL_TEMPLATE,
} from './existing';
// New v3.0 templates (10 categories)
import {
  WORKOUT_ENERGY_TEMPLATE,
  MORNING_SUNSHINE_TEMPLATE,
  SUNSET_GOLDEN_TEMPLATE,
  DINNER_PARTY_TEMPLATE,
  ROAD_TRIP_TEMPLATE,
  GAMING_FOCUS_TEMPLATE,
  ROMANTIC_EVENING_TEMPLATE,
  MEDITATION_ZEN_TEMPLATE,
  CREATIVE_FLOW_TEMPLATE,
  PARTY_NIGHT_TEMPLATE,
} from './new';

import type { QuickVibesTemplate } from '../types';
import type { QuickVibesCategory } from '@shared/types';

// =============================================================================
// Template Registry
// =============================================================================

/**
 * Complete registry of all 16 Quick Vibes category templates.
 */
export const QUICK_VIBES_TEMPLATES: Record<QuickVibesCategory, QuickVibesTemplate> = {
  // Existing 6 categories
  'lofi-study': LOFI_STUDY_TEMPLATE,
  'cafe-coffeeshop': CAFE_COFFEESHOP_TEMPLATE,
  'ambient-focus': AMBIENT_FOCUS_TEMPLATE,
  'latenight-chill': LATENIGHT_CHILL_TEMPLATE,
  'cozy-rainy': COZY_RAINY_TEMPLATE,
  'lofi-chill': LOFI_CHILL_TEMPLATE,
  // New 10 categories (v3.0)
  'workout-energy': WORKOUT_ENERGY_TEMPLATE,
  'morning-sunshine': MORNING_SUNSHINE_TEMPLATE,
  'sunset-golden': SUNSET_GOLDEN_TEMPLATE,
  'dinner-party': DINNER_PARTY_TEMPLATE,
  'road-trip': ROAD_TRIP_TEMPLATE,
  'gaming-focus': GAMING_FOCUS_TEMPLATE,
  'romantic-evening': ROMANTIC_EVENING_TEMPLATE,
  'meditation-zen': MEDITATION_ZEN_TEMPLATE,
  'creative-flow': CREATIVE_FLOW_TEMPLATE,
  'party-night': PARTY_NIGHT_TEMPLATE,
};

// Re-export individual templates for direct imports if needed
export {
  // Existing
  LOFI_STUDY_TEMPLATE,
  CAFE_COFFEESHOP_TEMPLATE,
  AMBIENT_FOCUS_TEMPLATE,
  LATENIGHT_CHILL_TEMPLATE,
  COZY_RAINY_TEMPLATE,
  LOFI_CHILL_TEMPLATE,
  // New v3.0
  WORKOUT_ENERGY_TEMPLATE,
  MORNING_SUNSHINE_TEMPLATE,
  SUNSET_GOLDEN_TEMPLATE,
  DINNER_PARTY_TEMPLATE,
  ROAD_TRIP_TEMPLATE,
  GAMING_FOCUS_TEMPLATE,
  ROMANTIC_EVENING_TEMPLATE,
  MEDITATION_ZEN_TEMPLATE,
  CREATIVE_FLOW_TEMPLATE,
  PARTY_NIGHT_TEMPLATE,
};
