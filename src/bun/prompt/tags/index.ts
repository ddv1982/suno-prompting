/**
 * Realism and style tags for Suno Max Mode
 * 
 * Re-exports all tag categories for backward compatibility.
 * This barrel export maintains the original @bun/prompt/realism-tags import path.
 * 
 * @module prompt/tags
 */

// Re-export MAX_MODE_HEADER from shared for backwards compatibility
export { MAX_MODE_HEADER } from '@shared/max-format';

// Recording context tags
export {
  RECORDING_DESCRIPTORS,
  selectRecordingDescriptors,
  GENRE_RECORDING_CONTEXTS,
  selectRecordingContext,
} from './recording-context';

// Vocal performance tags
export {
  VOCAL_PERFORMANCE_TAGS,
  GENRE_VOCAL_PROBABILITY,
  selectVocalTags,
} from './vocal';

// Spatial audio tags
export {
  SPATIAL_AUDIO_TAGS,
  selectSpatialTags,
} from './spatial';

// Harmonic descriptor tags
export {
  HARMONIC_DESCRIPTORS,
  selectHarmonicTags,
} from './harmonic';

// Dynamic range tags
export {
  DYNAMIC_RANGE_TAGS,
  selectDynamicTags,
} from './dynamic';

// Temporal effect tags
export {
  TEMPORAL_EFFECT_TAGS,
  selectTemporalTags,
} from './temporal';

// Texture descriptor tags
export {
  TEXTURE_DESCRIPTORS,
  selectTextureTags,
} from './texture';

// Genre mappings
export {
  GENRE_ELECTRONIC_RATIO,
} from './genre-mappings';

// Import tag constants for test helpers
import { DYNAMIC_RANGE_TAGS as DYNAMIC_TAGS } from './dynamic';
import { GENRE_ELECTRONIC_RATIO as ELECTRONIC_RATIO } from './genre-mappings';
import { HARMONIC_DESCRIPTORS as HARMONIC_DESC } from './harmonic';
import { GENRE_RECORDING_CONTEXTS as RECORDING_CONTEXTS } from './recording-context';
import { SPATIAL_AUDIO_TAGS as SPATIAL_TAGS } from './spatial';
import { TEMPORAL_EFFECT_TAGS as TEMPORAL_TAGS } from './temporal';
import { TEXTURE_DESCRIPTORS as TEXTURE_DESC } from './texture';
import { VOCAL_PERFORMANCE_TAGS as VOCAL_PERF_TAGS, GENRE_VOCAL_PROBABILITY as VOCAL_PROB } from './vocal';

/**
 * @internal
 * Test helpers for unit testing internal constants.
 * Do not use in production code.
 */
export const _testHelpers = {
  VOCAL_PERFORMANCE_TAGS: VOCAL_PERF_TAGS,
  SPATIAL_AUDIO_TAGS: SPATIAL_TAGS,
  HARMONIC_DESCRIPTORS: HARMONIC_DESC,
  DYNAMIC_RANGE_TAGS: DYNAMIC_TAGS,
  TEMPORAL_EFFECT_TAGS: TEMPORAL_TAGS,
  TEXTURE_DESCRIPTORS: TEXTURE_DESC,
  GENRE_VOCAL_PROBABILITY: VOCAL_PROB,
  GENRE_ELECTRONIC_RATIO: ELECTRONIC_RATIO,
  GENRE_RECORDING_CONTEXTS: RECORDING_CONTEXTS,
} as const;
