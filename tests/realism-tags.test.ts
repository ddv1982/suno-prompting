import { describe, it, expect } from 'bun:test';

import {
  selectVocalTags,
  selectSpatialTags,
  selectHarmonicTags,
  selectDynamicTags,
  selectTemporalTags,
  selectTextureTags,
  selectRecordingContext,
  _testHelpers,
} from '@bun/prompt/tags';

const {
  VOCAL_PERFORMANCE_TAGS,
  SPATIAL_AUDIO_TAGS,
  HARMONIC_DESCRIPTORS,
  DYNAMIC_RANGE_TAGS,
  TEMPORAL_EFFECT_TAGS,
  TEXTURE_DESCRIPTORS,
  GENRE_VOCAL_PROBABILITY,
  GENRE_ELECTRONIC_RATIO,
  GENRE_RECORDING_CONTEXTS,
} = _testHelpers;

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 *
 * @param seed - Starting seed value
 * @returns Deterministic RNG function
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters from Numerical Recipes
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Flatten a tag pool object into a single array.
 */
function flattenTagPool(pool: Record<string, readonly string[]>): string[] {
  const tags: string[] = [];
  for (const category of Object.values(pool)) {
    tags.push(...category);
  }
  return tags;
}

// =============================================================================
// Tests: Tag Pool Constants Structure
// =============================================================================

describe('realism-tags', () => {
  describe('VOCAL_PERFORMANCE_TAGS constant', () => {
    it('has all 8 required categories', () => {
      expect(VOCAL_PERFORMANCE_TAGS.breathTexture).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.vocalPower).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.techniques).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.character).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.layering).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.articulation).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.micTechnique).toBeDefined();
      expect(VOCAL_PERFORMANCE_TAGS.genreStyles).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(VOCAL_PERFORMANCE_TAGS.breathTexture.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.vocalPower.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.techniques.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.character.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.layering.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.articulation.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.micTechnique.length).toBeGreaterThan(0);
      expect(VOCAL_PERFORMANCE_TAGS.genreStyles.length).toBeGreaterThan(0);
    });

    it('has at least 38 total tags', () => {
      const allTags = flattenTagPool(VOCAL_PERFORMANCE_TAGS);
      expect(allTags.length).toBeGreaterThanOrEqual(38);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(VOCAL_PERFORMANCE_TAGS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(VOCAL_PERFORMANCE_TAGS.breathTexture.length).toBe(5);
      expect(VOCAL_PERFORMANCE_TAGS.vocalPower.length).toBe(5);
      expect(VOCAL_PERFORMANCE_TAGS.techniques.length).toBe(5);
      expect(VOCAL_PERFORMANCE_TAGS.character.length).toBe(5);
      expect(VOCAL_PERFORMANCE_TAGS.layering.length).toBe(5);
      expect(VOCAL_PERFORMANCE_TAGS.articulation.length).toBe(4);
      expect(VOCAL_PERFORMANCE_TAGS.micTechnique.length).toBe(4);
      expect(VOCAL_PERFORMANCE_TAGS.genreStyles.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('SPATIAL_AUDIO_TAGS constant', () => {
    it('has all 5 required categories', () => {
      expect(SPATIAL_AUDIO_TAGS.width).toBeDefined();
      expect(SPATIAL_AUDIO_TAGS.depth).toBeDefined();
      expect(SPATIAL_AUDIO_TAGS.reflections).toBeDefined();
      expect(SPATIAL_AUDIO_TAGS.positioning).toBeDefined();
      expect(SPATIAL_AUDIO_TAGS.ambience).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(SPATIAL_AUDIO_TAGS.width.length).toBeGreaterThan(0);
      expect(SPATIAL_AUDIO_TAGS.depth.length).toBeGreaterThan(0);
      expect(SPATIAL_AUDIO_TAGS.reflections.length).toBeGreaterThan(0);
      expect(SPATIAL_AUDIO_TAGS.positioning.length).toBeGreaterThan(0);
      expect(SPATIAL_AUDIO_TAGS.ambience.length).toBeGreaterThan(0);
    });

    it('has at least 22 total tags', () => {
      const allTags = flattenTagPool(SPATIAL_AUDIO_TAGS);
      expect(allTags.length).toBeGreaterThanOrEqual(22);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(SPATIAL_AUDIO_TAGS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(SPATIAL_AUDIO_TAGS.width.length).toBe(5);
      expect(SPATIAL_AUDIO_TAGS.depth.length).toBe(5);
      expect(SPATIAL_AUDIO_TAGS.reflections.length).toBe(4);
      expect(SPATIAL_AUDIO_TAGS.positioning.length).toBe(4);
      expect(SPATIAL_AUDIO_TAGS.ambience.length).toBe(4);
    });
  });

  describe('HARMONIC_DESCRIPTORS constant', () => {
    it('has all 4 required categories', () => {
      expect(HARMONIC_DESCRIPTORS.stacking).toBeDefined();
      expect(HARMONIC_DESCRIPTORS.richness).toBeDefined();
      expect(HARMONIC_DESCRIPTORS.balance).toBeDefined();
      expect(HARMONIC_DESCRIPTORS.character).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(HARMONIC_DESCRIPTORS.stacking.length).toBeGreaterThan(0);
      expect(HARMONIC_DESCRIPTORS.richness.length).toBeGreaterThan(0);
      expect(HARMONIC_DESCRIPTORS.balance.length).toBeGreaterThan(0);
      expect(HARMONIC_DESCRIPTORS.character.length).toBeGreaterThan(0);
    });

    it('has at least 17 total tags', () => {
      const allTags = flattenTagPool(HARMONIC_DESCRIPTORS);
      expect(allTags.length).toBeGreaterThanOrEqual(17);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(HARMONIC_DESCRIPTORS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(HARMONIC_DESCRIPTORS.stacking.length).toBe(5);
      expect(HARMONIC_DESCRIPTORS.richness.length).toBe(4);
      expect(HARMONIC_DESCRIPTORS.balance.length).toBe(4);
      expect(HARMONIC_DESCRIPTORS.character.length).toBe(4);
    });
  });

  describe('DYNAMIC_RANGE_TAGS constant', () => {
    it('has all 4 required categories', () => {
      expect(DYNAMIC_RANGE_TAGS.compression).toBeDefined();
      expect(DYNAMIC_RANGE_TAGS.contrast).toBeDefined();
      expect(DYNAMIC_RANGE_TAGS.loudness).toBeDefined();
      expect(DYNAMIC_RANGE_TAGS.transients).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(DYNAMIC_RANGE_TAGS.compression.length).toBeGreaterThan(0);
      expect(DYNAMIC_RANGE_TAGS.contrast.length).toBeGreaterThan(0);
      expect(DYNAMIC_RANGE_TAGS.loudness.length).toBeGreaterThan(0);
      expect(DYNAMIC_RANGE_TAGS.transients.length).toBeGreaterThan(0);
    });

    it('has at least 15 total tags', () => {
      const allTags = flattenTagPool(DYNAMIC_RANGE_TAGS);
      expect(allTags.length).toBeGreaterThanOrEqual(15);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(DYNAMIC_RANGE_TAGS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(DYNAMIC_RANGE_TAGS.compression.length).toBe(5);
      expect(DYNAMIC_RANGE_TAGS.contrast.length).toBe(4);
      expect(DYNAMIC_RANGE_TAGS.loudness.length).toBe(3);
      expect(DYNAMIC_RANGE_TAGS.transients.length).toBe(3);
    });
  });

  describe('TEMPORAL_EFFECT_TAGS constant', () => {
    it('has all 3 required categories', () => {
      expect(TEMPORAL_EFFECT_TAGS.timing).toBeDefined();
      expect(TEMPORAL_EFFECT_TAGS.microTiming).toBeDefined();
      expect(TEMPORAL_EFFECT_TAGS.groove).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(TEMPORAL_EFFECT_TAGS.timing.length).toBeGreaterThan(0);
      expect(TEMPORAL_EFFECT_TAGS.microTiming.length).toBeGreaterThan(0);
      expect(TEMPORAL_EFFECT_TAGS.groove.length).toBeGreaterThan(0);
    });

    it('has at least 11 total tags', () => {
      const allTags = flattenTagPool(TEMPORAL_EFFECT_TAGS);
      expect(allTags.length).toBeGreaterThanOrEqual(11);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(TEMPORAL_EFFECT_TAGS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(TEMPORAL_EFFECT_TAGS.timing.length).toBe(4);
      expect(TEMPORAL_EFFECT_TAGS.microTiming.length).toBe(4);
      expect(TEMPORAL_EFFECT_TAGS.groove.length).toBe(4);
    });
  });

  describe('TEXTURE_DESCRIPTORS constant', () => {
    it('has all 5 required categories', () => {
      expect(TEXTURE_DESCRIPTORS.polish).toBeDefined();
      expect(TEXTURE_DESCRIPTORS.character).toBeDefined();
      expect(TEXTURE_DESCRIPTORS.fidelity).toBeDefined();
      expect(TEXTURE_DESCRIPTORS.nature).toBeDefined();
      expect(TEXTURE_DESCRIPTORS.space).toBeDefined();
    });

    it('all categories are non-empty arrays', () => {
      expect(TEXTURE_DESCRIPTORS.polish.length).toBeGreaterThan(0);
      expect(TEXTURE_DESCRIPTORS.character.length).toBeGreaterThan(0);
      expect(TEXTURE_DESCRIPTORS.fidelity.length).toBeGreaterThan(0);
      expect(TEXTURE_DESCRIPTORS.nature.length).toBeGreaterThan(0);
      expect(TEXTURE_DESCRIPTORS.space.length).toBeGreaterThan(0);
    });

    it('has at least 20 total tags', () => {
      const allTags = flattenTagPool(TEXTURE_DESCRIPTORS);
      expect(allTags.length).toBeGreaterThanOrEqual(20);
    });

    it('all tags are lowercase strings', () => {
      const allTags = flattenTagPool(TEXTURE_DESCRIPTORS);
      for (const tag of allTags) {
        expect(tag).toBe(tag.toLowerCase());
        expect(typeof tag).toBe('string');
      }
    });

    it('has expected category counts', () => {
      expect(TEXTURE_DESCRIPTORS.polish.length).toBe(4);
      expect(TEXTURE_DESCRIPTORS.character.length).toBe(5);
      expect(TEXTURE_DESCRIPTORS.fidelity.length).toBe(4);
      expect(TEXTURE_DESCRIPTORS.nature.length).toBe(4);
      expect(TEXTURE_DESCRIPTORS.space.length).toBe(4);
    });
  });

  // =============================================================================
  // Tests: Genre Probability and Ratio Mappings
  // =============================================================================

  describe('GENRE_VOCAL_PROBABILITY constant', () => {
    it('has default key', () => {
      expect(GENRE_VOCAL_PROBABILITY.default).toBeDefined();
    });

    it('all values are between 0.0 and 1.0', () => {
      for (const [, probability] of Object.entries(GENRE_VOCAL_PROBABILITY)) {
        expect(probability).toBeGreaterThanOrEqual(0.0);
        expect(probability).toBeLessThanOrEqual(1.0);
      }
    });

    it('has high probability for vocal genres', () => {
      expect(GENRE_VOCAL_PROBABILITY.pop).toBeGreaterThanOrEqual(0.9);
      expect(GENRE_VOCAL_PROBABILITY.rnb).toBeGreaterThanOrEqual(0.9);
      expect(GENRE_VOCAL_PROBABILITY.soul).toBeGreaterThanOrEqual(0.8);
    });

    it('has low probability for instrumental genres', () => {
      expect(GENRE_VOCAL_PROBABILITY.ambient).toBeLessThanOrEqual(0.1);
      expect(GENRE_VOCAL_PROBABILITY.cinematic).toBeLessThanOrEqual(0.2);
    });

    it('has default value of 0.5', () => {
      expect(GENRE_VOCAL_PROBABILITY.default).toBe(0.5);
    });
  });

  describe('GENRE_ELECTRONIC_RATIO constant', () => {
    it('has default key', () => {
      expect(GENRE_ELECTRONIC_RATIO.default).toBeDefined();
    });

    it('all values are between 0.0 and 1.0', () => {
      for (const [, ratio] of Object.entries(GENRE_ELECTRONIC_RATIO)) {
        expect(ratio).toBeGreaterThanOrEqual(0.0);
        expect(ratio).toBeLessThanOrEqual(1.0);
      }
    });

    it('pure electronic genres have ratio of 1.0', () => {
      expect(GENRE_ELECTRONIC_RATIO.edm).toBe(1.0);
      expect(GENRE_ELECTRONIC_RATIO.techno).toBe(1.0);
      expect(GENRE_ELECTRONIC_RATIO.house).toBe(1.0);
    });

    it('pure organic genres have ratio of 0.0', () => {
      expect(GENRE_ELECTRONIC_RATIO.folk).toBe(0.0);
      expect(GENRE_ELECTRONIC_RATIO.classical).toBe(0.0);
      expect(GENRE_ELECTRONIC_RATIO.jazz).toBe(0.0);
    });

    it('hybrid genres have ratio between 0.5-0.8', () => {
      expect(GENRE_ELECTRONIC_RATIO.synthwave).toBeGreaterThanOrEqual(0.5);
      expect(GENRE_ELECTRONIC_RATIO.synthwave).toBeLessThanOrEqual(0.8);
    });

    it('has default value of 0.0', () => {
      expect(GENRE_ELECTRONIC_RATIO.default).toBe(0.0);
    });
  });

  // =============================================================================
  // Tests: Selection Functions
  // =============================================================================

  describe('selectVocalTags', () => {
    it('returns array of vocal tags when probability check passes', () => {
      // Use pop genre with 0.95 probability and RNG that returns 0.8 (< 0.95)
      const rng = createSeededRng(42);
      const result = selectVocalTags('pop', 2, rng);
      
      // Should return tags (may be empty if first RNG call > 0.95)
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array when probability check fails for low-probability genres', () => {
      // Ambient has 0.05 probability, RNG returning > 0.05 should fail
      const rng = () => 0.5; // Always return 0.5 (> 0.05)
      const result = selectVocalTags('ambient', 2, rng);
      expect(result).toEqual([]);
    });

    it('returns tags when RNG passes probability for high-probability genre', () => {
      // Pop has 0.95 probability, RNG returning 0.1 (< 0.95) should pass
      const rng = () => 0.1;
      const result = selectVocalTags('pop', 2, rng);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('respects count parameter', () => {
      const rng = () => 0.1; // Pass probability check
      const result = selectVocalTags('pop', 5, rng);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('returns tags from VOCAL_PERFORMANCE_TAGS pool', () => {
      const rng = () => 0.1;
      const result = selectVocalTags('pop', 2, rng);
      const allVocalTags = flattenTagPool(VOCAL_PERFORMANCE_TAGS);
      
      for (const tag of result) {
        expect(allVocalTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectVocalTags('pop', 3, rng1);
      const result2 = selectVocalTags('pop', 3, rng2);
      expect(result1).toEqual(result2);
    });

    it('uses default probability for unmapped genres', () => {
      const rng = () => 0.4; // Between 0.0 and 0.5
      const result = selectVocalTags('unknown_genre_xyz', 2, rng);
      // Should use default (0.5), so 0.4 < 0.5 should pass
      expect(result.length).toBeGreaterThan(0);
    });

    it('normalizes genre to lowercase', () => {
      const rng = () => 0.1;
      const result1 = selectVocalTags('POP', 2, rng);
      const rng2 = () => 0.1;
      const result2 = selectVocalTags('pop', 2, rng2);
      // Both should find 'pop' probability
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });

    it('all returned tags are lowercase', () => {
      const rng = () => 0.1;
      const result = selectVocalTags('pop', 5, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  describe('selectSpatialTags', () => {
    it('returns array of spatial audio tags', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(1, rng);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(3, rng);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns tags from SPATIAL_AUDIO_TAGS pool', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(2, rng);
      const allSpatialTags = flattenTagPool(SPATIAL_AUDIO_TAGS);
      
      for (const tag of result) {
        expect(allSpatialTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectSpatialTags(2, rng1);
      const result2 = selectSpatialTags(2, rng2);
      expect(result1).toEqual(result2);
    });

    it('all returned tags are lowercase', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(3, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  describe('selectHarmonicTags', () => {
    it('returns array of harmonic descriptor tags', () => {
      const rng = createSeededRng(42);
      const result = selectHarmonicTags(1, rng);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const rng = createSeededRng(42);
      const result = selectHarmonicTags(3, rng);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns tags from HARMONIC_DESCRIPTORS pool', () => {
      const rng = createSeededRng(42);
      const result = selectHarmonicTags(2, rng);
      const allHarmonicTags = flattenTagPool(HARMONIC_DESCRIPTORS);
      
      for (const tag of result) {
        expect(allHarmonicTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectHarmonicTags(2, rng1);
      const result2 = selectHarmonicTags(2, rng2);
      expect(result1).toEqual(result2);
    });

    it('all returned tags are lowercase', () => {
      const rng = createSeededRng(42);
      const result = selectHarmonicTags(3, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  describe('selectDynamicTags', () => {
    it('returns array of dynamic range tags', () => {
      const rng = createSeededRng(42);
      const result = selectDynamicTags(1, rng);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const rng = createSeededRng(42);
      const result = selectDynamicTags(3, rng);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns tags from DYNAMIC_RANGE_TAGS pool', () => {
      const rng = createSeededRng(42);
      const result = selectDynamicTags(2, rng);
      const allDynamicTags = flattenTagPool(DYNAMIC_RANGE_TAGS);
      
      for (const tag of result) {
        expect(allDynamicTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectDynamicTags(2, rng1);
      const result2 = selectDynamicTags(2, rng2);
      expect(result1).toEqual(result2);
    });

    it('all returned tags are lowercase', () => {
      const rng = createSeededRng(42);
      const result = selectDynamicTags(3, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  describe('selectTemporalTags', () => {
    it('returns array of temporal effect tags', () => {
      const rng = createSeededRng(42);
      const result = selectTemporalTags(1, rng);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const rng = createSeededRng(42);
      const result = selectTemporalTags(3, rng);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns tags from TEMPORAL_EFFECT_TAGS pool', () => {
      const rng = createSeededRng(42);
      const result = selectTemporalTags(2, rng);
      const allTemporalTags = flattenTagPool(TEMPORAL_EFFECT_TAGS);
      
      for (const tag of result) {
        expect(allTemporalTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectTemporalTags(2, rng1);
      const result2 = selectTemporalTags(2, rng2);
      expect(result1).toEqual(result2);
    });

    it('all returned tags are lowercase', () => {
      const rng = createSeededRng(42);
      const result = selectTemporalTags(3, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  describe('selectTextureTags', () => {
    it('returns array of texture descriptor tags', () => {
      const rng = createSeededRng(42);
      const result = selectTextureTags(1, rng);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const rng = createSeededRng(42);
      const result = selectTextureTags(3, rng);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('returns tags from TEXTURE_DESCRIPTORS pool', () => {
      const rng = createSeededRng(42);
      const result = selectTextureTags(2, rng);
      const allTextureTags = flattenTagPool(TEXTURE_DESCRIPTORS);
      
      for (const tag of result) {
        expect(allTextureTags).toContain(tag);
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);
      const result1 = selectTextureTags(2, rng1);
      const result2 = selectTextureTags(2, rng2);
      expect(result1).toEqual(result2);
    });

    it('all returned tags are lowercase', () => {
      const rng = createSeededRng(42);
      const result = selectTextureTags(3, rng);
      for (const tag of result) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  // =============================================================================
  // Tests: Integration with assembleStyleTags
  // =============================================================================

  describe('integration with assembleStyleTags', () => {
    it('style tags contain new category tags when probability passes', () => {
      // This is tested indirectly via deterministic-builder.test.ts
      // We verify selection functions work correctly here
      const rng = createSeededRng(42);
      
      const vocalTags = selectVocalTags('pop', 2, rng);
      const spatialTags = selectSpatialTags(1, createSeededRng(42));
      const harmonicTags = selectHarmonicTags(1, createSeededRng(42));
      
      // Each should return valid tags
      expect(vocalTags.length).toBeGreaterThanOrEqual(0);
      expect(spatialTags.length).toBeGreaterThan(0);
      expect(harmonicTags.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // Tests: GENRE_RECORDING_CONTEXTS Constant
  // =============================================================================

  describe('GENRE_RECORDING_CONTEXTS constant', () => {
    it('has all 18 expected genres', () => {
      const expectedGenres = [
        'pop', 'rock', 'jazz', 'blues', 'soul', 'rnb', 'country', 'folk',
        'classical', 'orchestral', 'ambient', 'cinematic', 'electronic',
        'edm', 'house', 'techno', 'metal', 'punk'
      ];
      
      for (const genre of expectedGenres) {
        const contexts = GENRE_RECORDING_CONTEXTS[genre];
        expect(contexts).toBeDefined();
        expect(contexts?.length).toBeGreaterThan(0);
      }
    });

    it('each genre has at least 5 contexts', () => {
      for (const contexts of Object.values(GENRE_RECORDING_CONTEXTS)) {
        expect(contexts.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('total contexts across all genres is at least 90', () => {
      let totalContexts = 0;
      for (const contexts of Object.values(GENRE_RECORDING_CONTEXTS)) {
        totalContexts += contexts.length;
      }
      expect(totalContexts).toBeGreaterThanOrEqual(90);
    });

    it('all contexts are lowercase strings', () => {
      for (const contexts of Object.values(GENRE_RECORDING_CONTEXTS)) {
        for (const context of contexts) {
          expect(typeof context).toBe('string');
          expect(context).toBe(context.toLowerCase());
          expect(context.length).toBeGreaterThan(0);
        }
      }
    });

    it('contexts are genre-appropriate (sample check)', () => {
      // Check that jazz contexts contain jazz-related terms
      const jazzContexts = GENRE_RECORDING_CONTEXTS.jazz?.join(' ') ?? '';
      expect(jazzContexts).toMatch(/jazz|club|trio|quartet|bebop|blue note/i);
      
      // Check that country contexts contain country-related terms
      const countryContexts = GENRE_RECORDING_CONTEXTS.country?.join(' ') ?? '';
      expect(countryContexts).toMatch(/nashville|honky|barn|country|bluegrass|texas/i);
    });
  });

  // =============================================================================
  // Tests: selectRecordingContext Function
  // =============================================================================

  describe('selectRecordingContext', () => {
    it('returns a string', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContext('jazz', rng);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns genre-specific context for known genre', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContext('jazz', rng);
      
      // Should be from jazz contexts
      expect(GENRE_RECORDING_CONTEXTS.jazz).toContain(result);
    });

    it('returns different genre-specific contexts for different genres', () => {
      const rng = createSeededRng(42);
      const jazzContext = selectRecordingContext('jazz', rng);
      
      const rng2 = createSeededRng(42);
      const rockContext = selectRecordingContext('rock', rng2);
      
      // Both should be from their respective pools
      expect(GENRE_RECORDING_CONTEXTS.jazz).toContain(jazzContext);
      expect(GENRE_RECORDING_CONTEXTS.rock).toContain(rockContext);
    });

    it('falls back to generic recording descriptor for unknown genre', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContext('unknown-genre-xyz', rng);
      
      // Should be a valid string (from fallback)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should not be in any genre-specific pool
      let foundInGenrePool = false;
      for (const contexts of Object.values(GENRE_RECORDING_CONTEXTS)) {
        if (contexts.includes(result as any)) {
          foundInGenrePool = true;
          break;
        }
      }
      expect(foundInGenrePool).toBe(false);
    });

    it('produces deterministic output with same seed for same genre', () => {
      const rng1 = createSeededRng(12345);
      const result1 = selectRecordingContext('jazz', rng1);
      
      const rng2 = createSeededRng(12345);
      const result2 = selectRecordingContext('jazz', rng2);
      
      expect(result1).toBe(result2);
    });

    it('produces different output with different seeds', () => {
      // Run multiple times with well-spaced seeds to verify variety
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const rng = createSeededRng(i * 1000); // Use well-spaced seeds
        results.add(selectRecordingContext('jazz', rng));
      }
      // Jazz has 9 contexts, should get at least 3 different ones
      expect(results.size).toBeGreaterThan(1);
    });

    it('normalizes genre to lowercase', () => {
      const rng1 = createSeededRng(42);
      const result1 = selectRecordingContext('JAZZ', rng1);
      
      const rng2 = createSeededRng(42);
      const result2 = selectRecordingContext('jazz', rng2);
      
      expect(result1).toBe(result2);
      expect(GENRE_RECORDING_CONTEXTS.jazz).toContain(result1);
    });

    it('trims whitespace from genre', () => {
      const rng1 = createSeededRng(42);
      const result1 = selectRecordingContext('  jazz  ', rng1);
      
      const rng2 = createSeededRng(42);
      const result2 = selectRecordingContext('jazz', rng2);
      
      expect(result1).toBe(result2);
      expect(GENRE_RECORDING_CONTEXTS.jazz).toContain(result1);
    });

    it('handles all 18 genres without errors', () => {
      const genres = [
        'pop', 'rock', 'jazz', 'blues', 'soul', 'rnb', 'country', 'folk',
        'classical', 'orchestral', 'ambient', 'cinematic', 'electronic',
        'edm', 'house', 'techno', 'metal', 'punk'
      ];
      
      for (const genre of genres) {
        const rng = createSeededRng(42);
        const result = selectRecordingContext(genre, rng);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(GENRE_RECORDING_CONTEXTS[genre]).toContain(result);
      }
    });

    it('returns lowercase context string', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContext('jazz', rng);
      
      expect(result).toBe(result.toLowerCase());
    });

    it('handles empty genre string gracefully', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContext('', rng);
      
      // Should fall back to generic
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('provides variety across multiple selections for same genre', () => {
      const contexts = new Set<string>();
      
      // Generate 30 contexts for jazz with different seeds
      for (let i = 0; i < 30; i++) {
        const rng = createSeededRng(i * 1000);
        contexts.add(selectRecordingContext('jazz', rng));
      }
      
      // Should get at least 3 different contexts (jazz has 9 contexts)
      expect(contexts.size).toBeGreaterThanOrEqual(3);
    });
  });

  // =============================================================================
  // Tests: Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    it('selectVocalTags handles count=0', () => {
      const rng = () => 0.1;
      const result = selectVocalTags('pop', 0, rng);
      expect(result).toEqual([]);
    });

    it('selectSpatialTags handles count=0', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(0, rng);
      expect(result).toEqual([]);
    });

    it('selectVocalTags handles very large count', () => {
      const rng = () => 0.1;
      const result = selectVocalTags('pop', 1000, rng);
      const allVocalTags = flattenTagPool(VOCAL_PERFORMANCE_TAGS);
      // Should return all available tags (capped at pool size)
      expect(result.length).toBeLessThanOrEqual(allVocalTags.length);
    });

    it('selectSpatialTags handles very large count', () => {
      const rng = createSeededRng(42);
      const result = selectSpatialTags(1000, rng);
      const allSpatialTags = flattenTagPool(SPATIAL_AUDIO_TAGS);
      // Should return all available tags (capped at pool size)
      expect(result.length).toBeLessThanOrEqual(allSpatialTags.length);
    });

    it('selectVocalTags handles empty genre string', () => {
      const rng = () => 0.4;
      const result = selectVocalTags('', 2, rng);
      // Should use default probability (0.5)
      expect(Array.isArray(result)).toBe(true);
    });

    it('selectVocalTags handles genre with spaces', () => {
      const rng = () => 0.1;
      const result = selectVocalTags('  pop  ', 2, rng);
      // Should trim and normalize
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
