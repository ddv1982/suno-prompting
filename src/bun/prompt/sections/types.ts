/**
 * Type definitions for Section Templates
 *
 * Contains type definitions for section building and templates.
 *
 * @module prompt/sections/types
 */

import type { GenreType } from '@bun/instruments/genres';
import type {
  Contrast,
  Dynamics,
  SectionType as SchemaSectionType,
} from '@shared/schemas/thematic-context';

/**
 * Section types available for prompt generation.
 */
export type SectionType = 'INTRO' | 'VERSE' | 'CHORUS' | 'BRIDGE' | 'OUTRO';

/**
 * Template definition for a single section.
 * Contains multiple template variations for variety.
 */
export interface SectionTemplate {
  /** Section type identifier */
  readonly type: SectionType;
  /** Array of template strings with placeholders */
  readonly templates: readonly string[];
  /** Number of instruments to select for this section */
  readonly instrumentCount: number;
  /** Energy level of the section (affects instrument selection) */
  readonly energy: 'low' | 'medium' | 'high';
}

/**
 * Override settings for a single section from contrast detection.
 */
export interface SectionOverride {
  /** Mood override from contrast section */
  readonly mood: string;
  /** Dynamics level from contrast section */
  readonly dynamics: Dynamics;
}

/**
 * Context for building sections, containing genre-specific data.
 */
export interface SectionContext {
  /** Target genre for instrument and mood selection */
  readonly genre: GenreType;
  /** Random number generator for deterministic output */
  readonly rng: () => number;
  /** Pre-selected instruments for the track (to ensure variety) */
  readonly trackInstruments?: readonly string[];
  /** Optional section overrides from contrast detection */
  readonly sectionOverride?: SectionOverride;
}

/**
 * Context for building sections with contrast support.
 * Extends SectionContext with optional contrast data.
 */
export interface SectionContextWithContrast extends Omit<SectionContext, 'sectionOverride'> {
  /** Optional contrast data from ThematicContext */
  readonly contrast?: Contrast;
}

/**
 * Result from building a single section.
 */
export interface SectionResult {
  /** The section type */
  readonly type: SectionType;
  /** Formatted section string ready for prompt */
  readonly text: string;
  /** Instruments used in this section */
  readonly instruments: readonly string[];
  /** Mood descriptors used */
  readonly moods: readonly string[];
}

/**
 * Result from building all sections.
 */
export interface AllSectionsResult {
  /** Array of all section results */
  readonly sections: readonly SectionResult[];
  /** Combined formatted text for all sections */
  readonly text: string;
  /** All instruments used across sections */
  readonly allInstruments: readonly string[];
}

// Re-export SchemaSectionType for use in mappings
export type { SchemaSectionType, Contrast, Dynamics };
