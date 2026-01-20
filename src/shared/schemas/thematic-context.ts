import { z } from 'zod';

/**
 * Schema for LLM-extracted thematic context (raw from LLM).
 *
 * Used to validate structured output from thematic extraction LLM calls.
 * Allows 1-5 themes for flexibility with LLM outputs; normalization to
 * exactly 3 themes happens in parseThematicResponse().
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
  /** 1-5 thematic keywords (normalized to exactly 3 after parsing) */
  themes: z.array(z.string()).min(1).max(5),
  /** 2-3 emotional mood descriptors */
  moods: z.array(z.string()).min(2).max(3),
  /** 5-10 word scene/setting phrase (10-100 chars) */
  scene: z.string().min(10).max(100),
});

/** Thematic context with exactly 3 themes (after normalization) */
export interface ThematicContext {
  themes: [string, string, string];
  moods: string[];
  scene: string;
}
