/**
 * Section Templates for Deterministic Standard Mode
 *
 * Generates section-specific prompts (INTRO, VERSE, CHORUS, BRIDGE, OUTRO)
 * with genre-appropriate instrumentation and mood descriptors.
 *
 * Supports contrast-based section building when ThematicContext contrast
 * data is available, applying mood overrides and dynamics-influenced
 * articulations per section.
 *
 * Supports narrative arc mapping when ThematicContext narrativeArc
 * data is available, converting emotional journey into section progression.
 *
 * @module prompt/sections
 */

// Public API - Builder Functions
export {
  buildSection,
  buildAllSections,
  buildSectionsWithContrast,
  getSectionTypes,
  getSectionTemplate,
} from './builder';

// Public API - Narrative Arc Functions
export {
  buildSectionsWithNarrativeArc,
  narrativeArcToContrast,
  mergeContrastWithNarrativeArc,
  inferDynamicsFromArc,
  type SectionContextWithNarrativeArc,
} from './section-builder';

// Public API - Types
export type {
  SectionType,
  SectionTemplate,
  SectionContext,
  SectionContextWithContrast,
  SectionOverride,
  SectionResult,
  AllSectionsResult,
} from './types';
