/**
 * Section Templates for Deterministic Standard Mode
 *
 * Generates section-specific prompts (INTRO, VERSE, CHORUS, BRIDGE, OUTRO)
 * with genre-appropriate instrumentation and mood descriptors.
 *
 * @module prompt/sections
 */

// Public API - Builder Functions
export { buildSection, buildAllSections, getSectionTypes, getSectionTemplate } from './builder';

// Public API - Types
export type {
  SectionType,
  SectionTemplate,
  SectionContext,
  SectionResult,
  AllSectionsResult,
} from './types';
