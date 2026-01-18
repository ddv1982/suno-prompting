import { z } from 'zod';

/**
 * Schema for LLM-extracted thematic context.
 *
 * Used to validate structured output from thematic extraction LLM calls.
 * The schema enforces strict constraints to ensure high-quality context.
 *
 * @example
 * ```typescript
 * const context = ThematicContextSchema.parse({
 *   themes: ['alien', 'bioluminescent', 'discovery'],
 *   moods: ['wondrous', 'awe-struck'],
 *   scene: 'first steps into an alien jungle',
 * });
 * ```
 */
export const ThematicContextSchema = z.object({
  /** Exactly 3 thematic keywords capturing the essence */
  themes: z.tuple([z.string(), z.string(), z.string()]),
  /** 2-3 emotional mood descriptors */
  moods: z.array(z.string()).min(2).max(3),
  /** 5-10 word scene/setting phrase (10-100 chars) */
  scene: z.string().min(10).max(100),
});

export type ThematicContext = z.infer<typeof ThematicContextSchema>;
