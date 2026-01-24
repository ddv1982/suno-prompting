import { z } from 'zod';

/**
 * Production era for inferred context from description.
 */
export const EraSchema = z.enum(['50s-60s', '70s', '80s', '90s', '2000s', 'modern']);

// ============================================
// Vocal & Energy Schema Additions
// ============================================

/**
 * Vocal character extraction for style enhancement.
 *
 * Captures vocal style characteristics for more targeted vocal tag selection.
 * All fields are optional; include only those clearly indicated in description.
 *
 * @example
 * ```typescript
 * const character: VocalCharacter = {
 *   style: 'breathy',
 *   layering: 'harmonies',
 *   technique: 'falsetto',
 * };
 * ```
 */
export const VocalCharacterSchema = z.object({
  /** Primary vocal style (e.g., "breathy", "powerful", "raspy", "smooth", "ethereal") */
  style: z.string().optional(),
  /** Vocal layering approach (e.g., "harmonies", "double-tracked", "choir", "solo") */
  layering: z.string().optional(),
  /** Special vocal techniques (e.g., "falsetto", "growl", "scat", "belt", "whisper") */
  technique: z.string().optional(),
});

/**
 * Energy level classification for dynamic weighting.
 *
 * Used to adjust tag category weights based on overall energy level.
 * Higher energy levels boost dynamic/temporal weights; lower levels reduce them.
 */
export const EnergyLevelSchema = z.enum([
  'ambient',     // Very low energy, atmospheric
  'relaxed',     // Low energy, gentle
  'moderate',    // Medium energy, balanced
  'energetic',   // High energy, driving
  'intense',     // Very high energy, powerful
]);

/**
 * Spatial hint for reverb/environment inference.
 *
 * Guides reverb selection based on perceived spatial context in the description.
 * Both fields are optional; include only when spatial context is clear.
 *
 * @example
 * ```typescript
 * const hint: SpatialHint = {
 *   space: 'vast',
 *   reverb: 'cavernous',
 * };
 * ```
 */
export const SpatialHintSchema = z.object({
  /** Perceived space size */
  space: z.enum(['intimate', 'room', 'hall', 'vast']).optional(),
  /** Reverb character */
  reverb: z.enum(['dry', 'natural', 'wet', 'cavernous']).optional(),
});

/**
 * Tempo curve types for energy progression.
 */
export const TempoCurveSchema = z.enum(['steady', 'gradual-rise', 'gradual-fall', 'explosive']);

/**
 * Section type for contrast definitions.
 */
export const SectionTypeSchema = z.enum([
  'intro',
  'verse',
  'pre-chorus',
  'chorus',
  'bridge',
  'breakdown',
  'outro',
]);

/**
 * Dynamics level for section intensity.
 */
export const DynamicsSchema = z.enum(['soft', 'building', 'powerful', 'explosive']);

/**
 * Tempo adjustment schema for BPM modification based on scene energy.
 */
export const TempoSchema = z.object({
  /** BPM adjustment: -30 (much slower) to +30 (much faster) */
  adjustment: z.number().min(-30).max(30),
  /** Tempo curve across the song */
  curve: TempoCurveSchema,
});

/**
 * Contrast section schema for dynamic mood shifts.
 */
export const ContrastSectionSchema = z.object({
  /** Section type */
  type: SectionTypeSchema,
  /** Mood for this section */
  mood: z.string(),
  /** Dynamic level */
  dynamics: DynamicsSchema,
});

/**
 * Contrast schema for section-by-section mood progression.
 */
export const ContrastSchema = z.object({
  sections: z.array(ContrastSectionSchema),
});

/**
 * Listening intent classification for optimizing output.
 */
export const IntentSchema = z.enum([
  'background',
  'focal',
  'cinematic',
  'dancefloor',
  'emotional',
]);

/**
 * Musical reference schema for style characteristics extraction (NO artist names).
 */
export const MusicalReferenceSchema = z.object({
  /** Style descriptors extracted from references */
  style: z.array(z.string()),
  /** Era if mentioned in reference */
  era: z.string().optional(),
  /** Signature production elements */
  signature: z.array(z.string()),
});

/**
 * Cultural/regional context schema for authentic production choices.
 */
export const CulturalContextSchema = z.object({
  /** Region identifier */
  region: z.string().optional(),
  /** Region-specific instruments */
  instruments: z.array(z.string()).optional(),
  /** Region-specific scale/mode */
  scale: z.string().optional(),
});

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
 *   era: '80s',
 *   tempo: { adjustment: 10, curve: 'gradual-rise' },
 * });
 * ```
 */
export const ThematicContextSchema = z.object({
  // === EXISTING (Required) ===
  /** 1-5 thematic keywords (normalized to exactly 3 after parsing) */
  themes: z.array(z.string()).min(1).max(5),
  /** 2-3 emotional mood descriptors */
  moods: z.array(z.string()).min(2).max(3),
  /** 5-10 word scene/setting phrase (10-100 chars) */
  scene: z.string().min(10).max(100),

  // === Core Enrichment (Optional) ===
  /** Production era inferred from context clues */
  era: EraSchema.optional(),
  /** Tempo adjustment based on scene energy */
  tempo: TempoSchema.optional(),
  /** Contrast detection for dynamic mood shifts */
  contrast: ContrastSchema.optional(),

  // === Intent & Reference (Optional) ===
  /** Listening intent classification */
  intent: IntentSchema.optional(),
  /** Musical reference extraction (NO artist names) */
  musicalReference: MusicalReferenceSchema.optional(),

  // === Vocal & Spatial (Optional) ===
  /** Vocal character extraction for style enhancement */
  vocalCharacter: VocalCharacterSchema.optional(),
  /** Energy level classification for dynamic weighting */
  energyLevel: EnergyLevelSchema.optional(),
  /** Spatial hint from scene for reverb selection */
  spatialHint: SpatialHintSchema.optional(),

  // === Narrative & Cultural (Optional) ===
  /** Emotional arc for narrative-driven songs */
  narrativeArc: z.array(z.string()).optional(),
  /** Cultural/regional context for authentic production */
  culturalContext: CulturalContextSchema.optional(),
});

/** Production era type */
export type Era = z.infer<typeof EraSchema>;

/** Tempo curve type */
export type TempoCurve = z.infer<typeof TempoCurveSchema>;

/** Section type */
export type SectionType = z.infer<typeof SectionTypeSchema>;

/** Dynamics level type */
export type Dynamics = z.infer<typeof DynamicsSchema>;

/** Tempo adjustment type */
export type Tempo = z.infer<typeof TempoSchema>;

/** Contrast section type */
export type ContrastSection = z.infer<typeof ContrastSectionSchema>;

/** Contrast type */
export type Contrast = z.infer<typeof ContrastSchema>;

/** Listening intent type */
export type Intent = z.infer<typeof IntentSchema>;

/** Musical reference type */
export type MusicalReference = z.infer<typeof MusicalReferenceSchema>;

/** Cultural context type */
export type CulturalContext = z.infer<typeof CulturalContextSchema>;

/** Vocal character type */
export type VocalCharacter = z.infer<typeof VocalCharacterSchema>;

/** Energy level type */
export type EnergyLevel = z.infer<typeof EnergyLevelSchema>;

/** Spatial hint type */
export type SpatialHint = z.infer<typeof SpatialHintSchema>;

/** Thematic context with exactly 3 themes (after normalization) */
export interface ThematicContext {
  themes: [string, string, string];
  moods: string[];
  scene: string;

  // Core enrichment fields
  era?: Era;
  tempo?: Tempo;
  contrast?: Contrast;

  // Intent and reference fields
  intent?: Intent;
  musicalReference?: MusicalReference;

  // Vocal and spatial fields
  vocalCharacter?: VocalCharacter;
  energyLevel?: EnergyLevel;
  spatialHint?: SpatialHint;

  // Narrative and cultural fields
  narrativeArc?: string[];
  culturalContext?: CulturalContext;
}
