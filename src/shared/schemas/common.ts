/**
 * Common schema definitions shared across multiple feature schemas.
 * Consolidates duplicate schemas and constants to ensure single source of truth.
 *
 * @module @shared/schemas/common
 */
import { z } from 'zod';

/**
 * Maximum number of Suno V5 styles that can be selected.
 * Used by validation handlers and schema constraints.
 */
export const MAX_SUNO_STYLES = 4;

/**
 * Maximum number of seed genres that can be selected.
 * Used by Creative Boost schema and validation.
 */
export const MAX_SEED_GENRES = 4;

/**
 * Schema for validating Suno V5 style selections.
 * Enforces maximum array length constraint.
 *
 * @example
 * ```ts
 * SunoStylesSchema.parse(['dreampop', 'synthwave']); // Valid
 * SunoStylesSchema.parse(['a', 'b', 'c', 'd', 'e']); // Throws - exceeds limit
 * ```
 */
export const SunoStylesSchema = z
  .array(z.string())
  .max(MAX_SUNO_STYLES, `Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`);

/**
 * Schema for validating seed genre selections.
 * Enforces maximum array length constraint.
 *
 * @example
 * ```ts
 * SeedGenresSchema.parse(['jazz', 'funk']); // Valid
 * SeedGenresSchema.parse(['a', 'b', 'c', 'd', 'e']); // Throws - exceeds limit
 * ```
 */
export const SeedGenresSchema = z
  .array(z.string())
  .max(MAX_SEED_GENRES, `Maximum ${MAX_SEED_GENRES} seed genres allowed`);

/**
 * Quick Vibes category values - 16 total preset categories.
 * Used by QuickVibesCategorySchema to ensure type and schema stay in sync.
 *
 * Note: Named differently from QUICK_VIBES_CATEGORIES in quick-vibes-categories.ts
 * which is a Record<QuickVibesCategory, QuickVibesCategoryDefinition> for UI labels.
 */
export const QUICK_VIBES_CATEGORY_VALUES = [
  // Original 6 categories
  'lofi-study',
  'cafe-coffeeshop',
  'ambient-focus',
  'latenight-chill',
  'cozy-rainy',
  'lofi-chill',
  // New 10 categories (v3.0)
  'workout-energy',
  'morning-sunshine',
  'sunset-golden',
  'dinner-party',
  'road-trip',
  'gaming-focus',
  'romantic-evening',
  'meditation-zen',
  'creative-flow',
  'party-night',
] as const;

/**
 * Schema for Quick Vibes category values (non-nullable).
 * Used for indexing into category-keyed objects.
 */
export const QuickVibesCategoryValueSchema = z.enum(QUICK_VIBES_CATEGORY_VALUES);

/**
 * Schema for Quick Vibes category selection in forms.
 * Nullable to allow "no category" state when using custom description or Suno styles.
 */
export const QuickVibesCategorySchema = QuickVibesCategoryValueSchema.nullable();

/**
 * Non-nullable Quick Vibes category type - for indexing into objects.
 * Derived from schema to ensure type and schema stay in sync.
 */
export type QuickVibesCategory = z.infer<typeof QuickVibesCategoryValueSchema>;

/**
 * Nullable Quick Vibes category type - for form state.
 * Allows null when using custom description or Suno styles.
 */
export type QuickVibesCategoryNullable = z.infer<typeof QuickVibesCategorySchema>;
