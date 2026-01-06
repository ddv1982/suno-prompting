/**
 * Section Template Definitions
 *
 * Contains template strings for each section type with placeholders
 * for dynamic content interpolation.
 *
 * @module prompt/sections/templates
 */

import type { SectionTemplate, SectionType } from './types';

// =============================================================================
// Template Definitions
// =============================================================================

/**
 * INTRO templates - sparse instrumentation setting the scene.
 * Placeholders: {instrument1}, {mood}, {descriptor}
 */
const INTRO_TEMPLATES: readonly string[] = [
  'Sparse {instrument1} setting a {mood} scene',
  '{descriptor} {instrument1} introduces the {mood} atmosphere',
  'Ambient {instrument1} fades in with {mood} undertones',
  '{mood} {instrument1} opens with {descriptor} tones',
  'Gentle {instrument1} establishes {mood} mood',
  '{instrument1} sets the stage with {descriptor} textures',
];

/**
 * VERSE templates - narrative with instruments and emotion.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const VERSE_TEMPLATES: readonly string[] = [
  '{instrument1} enters as {instrument2} weaves {mood} melodic lines',
  '{descriptor} {instrument1} drives the narrative with {instrument2} support',
  '{mood} groove builds with {instrument1} and {instrument2}',
  '{instrument1} lays the foundation while {instrument2} adds {descriptor} color',
  'Storytelling {instrument1} leads with {mood} {instrument2} phrases',
  '{descriptor} interplay between {instrument1} and {instrument2}',
];

/**
 * CHORUS templates - peak energy, full arrangement.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const CHORUS_TEMPLATES: readonly string[] = [
  'Full arrangement peaks with {descriptor} {instrument1} and {instrument2}',
  '{mood} energy surges as {instrument1} and {instrument2} unite',
  'Layered {instrument1} drives the {mood} hook with {instrument2}',
  'Anthemic {instrument1} soars over {descriptor} {instrument2}',
  '{mood} climax with powerful {instrument1} and {instrument2}',
  '{descriptor} full ensemble featuring {instrument1} and {instrument2}',
];

/**
 * BRIDGE templates - contrasting texture, optional.
 * Placeholders: {instrument1}, {mood}, {descriptor}
 */
const BRIDGE_TEMPLATES: readonly string[] = [
  'Stripped down {instrument1} creates {mood} contrast',
  '{descriptor} {instrument1} solo offers introspection',
  '{mood} breakdown featuring intimate {instrument1}',
  'Contrasting {instrument1} provides {descriptor} texture',
  'Reflective {instrument1} moment with {mood} undertones',
  '{instrument1} break shifts to {descriptor} territory',
];

/**
 * OUTRO templates - resolution and fade.
 * Placeholders: {instrument1}, {instrument2}, {mood}, {descriptor}
 */
const OUTRO_TEMPLATES: readonly string[] = [
  'Gentle fade with {mood} {instrument1} and {instrument2} swells',
  '{instrument1} resolves as {instrument2} provides {descriptor} closure',
  '{mood} resolution with lingering {instrument1}',
  '{descriptor} {instrument1} fades into {instrument2} echoes',
  'Peaceful {instrument1} brings {mood} conclusion',
  '{instrument1} and {instrument2} create {descriptor} final moments',
];

// =============================================================================
// Exports
// =============================================================================

/**
 * Section template definitions with energy levels.
 */
export const SECTION_TEMPLATES: Record<SectionType, SectionTemplate> = {
  INTRO: {
    type: 'INTRO',
    templates: INTRO_TEMPLATES,
    instrumentCount: 1,
    energy: 'low',
  },
  VERSE: {
    type: 'VERSE',
    templates: VERSE_TEMPLATES,
    instrumentCount: 2,
    energy: 'medium',
  },
  CHORUS: {
    type: 'CHORUS',
    templates: CHORUS_TEMPLATES,
    instrumentCount: 2,
    energy: 'high',
  },
  BRIDGE: {
    type: 'BRIDGE',
    templates: BRIDGE_TEMPLATES,
    instrumentCount: 1,
    energy: 'low',
  },
  OUTRO: {
    type: 'OUTRO',
    templates: OUTRO_TEMPLATES,
    instrumentCount: 2,
    energy: 'low',
  },
};

/**
 * Generic mood descriptors used when genre lacks specific moods.
 */
export const GENERIC_MOODS: readonly string[] = [
  'expressive',
  'dynamic',
  'emotional',
  'compelling',
  'atmospheric',
  'evocative',
];

/**
 * Generic descriptors for instrument qualities.
 */
export const GENERIC_DESCRIPTORS: readonly string[] = [
  'rich',
  'warm',
  'bright',
  'smooth',
  'textured',
  'resonant',
  'subtle',
  'bold',
  'delicate',
  'expansive',
];
