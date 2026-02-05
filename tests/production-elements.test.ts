import { describe, it, expect } from 'bun:test';

import {
  REVERB_TYPES,
  RECORDING_TEXTURES,
  STEREO_IMAGING,
  DYNAMIC_DESCRIPTORS,
  GENRE_PRODUCTION_STYLES,
  DEFAULT_PRODUCTION_STYLE,
  getProductionSuggestionsForGenre,
  buildProductionDescriptorMulti,
} from '@bun/prompt/production-elements';

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

// =============================================================================
// Tests: Expanded Production Pools
// =============================================================================

describe('production-elements', () => {
  describe('REVERB_TYPES constant', () => {
    it('has exactly 15 reverb types (expanded from 12)', () => {
      expect(REVERB_TYPES.length).toBe(15);
    });

    it('includes new reverb types', () => {
      expect(REVERB_TYPES).toContain('Vintage Echo Chamber');
      expect(REVERB_TYPES).toContain('Convolution Hall');
      expect(REVERB_TYPES).toContain('Natural Space Reverb');
    });

    it('preserves existing reverb types', () => {
      expect(REVERB_TYPES).toContain('Long Hall Reverb');
      expect(REVERB_TYPES).toContain('Plate Reverb');
      expect(REVERB_TYPES).toContain('Spring Reverb');
      expect(REVERB_TYPES).toContain('Chamber Reverb');
      expect(REVERB_TYPES).toContain('Studio Reverb');
    });

    it('all reverb types are properly formatted', () => {
      for (const reverb of REVERB_TYPES) {
        expect(typeof reverb).toBe('string');
        expect(reverb.length).toBeGreaterThan(0);
        // Check title case formatting
        expect(reverb[0]).toBe(reverb[0]?.toUpperCase());
      }
    });
  });

  describe('RECORDING_TEXTURES constant', () => {
    it('has exactly 17 texture types', () => {
      expect(RECORDING_TEXTURES.length).toBe(17);
    });

    it('includes research-backed Suno V5 textures', () => {
      expect(RECORDING_TEXTURES).toContain('Layered Depth');
      expect(RECORDING_TEXTURES).toContain('Atmospheric Space');
      expect(RECORDING_TEXTURES).toContain('Cinematic Width');
      expect(RECORDING_TEXTURES).toContain('Dynamic Presence');
      expect(RECORDING_TEXTURES).toContain('Rich Saturation');
    });

    it('preserves existing texture types', () => {
      expect(RECORDING_TEXTURES).toContain('Polished Production');
      expect(RECORDING_TEXTURES).toContain('Analog Warmth');
      expect(RECORDING_TEXTURES).toContain('Lo-Fi Dusty');
      expect(RECORDING_TEXTURES).toContain('Crystal Clear');
    });

    it('all texture types are properly formatted', () => {
      for (const texture of RECORDING_TEXTURES) {
        expect(typeof texture).toBe('string');
        expect(texture.length).toBeGreaterThan(0);
        // Check title case formatting
        expect(texture[0]).toBe(texture[0]?.toUpperCase());
      }
    });
  });

  describe('STEREO_IMAGING constant', () => {
    it('has exactly 10 stereo imaging types (expanded from 7)', () => {
      expect(STEREO_IMAGING.length).toBe(10);
    });

    it('includes new stereo imaging types', () => {
      expect(STEREO_IMAGING).toContain('Binaural Width');
      expect(STEREO_IMAGING).toContain('Mono-Compatible Stereo');
      expect(STEREO_IMAGING).toContain('Mid-Side Enhanced');
    });

    it('preserves existing stereo imaging types', () => {
      expect(STEREO_IMAGING).toContain('Wide Stereo');
      expect(STEREO_IMAGING).toContain('Narrow Mono');
      expect(STEREO_IMAGING).toContain('Centered Focus');
      expect(STEREO_IMAGING).toContain('Panned Elements');
    });

    it('all stereo imaging types are properly formatted', () => {
      for (const imaging of STEREO_IMAGING) {
        expect(typeof imaging).toBe('string');
        expect(imaging.length).toBeGreaterThan(0);
        // Check title case formatting
        expect(imaging[0]).toBe(imaging[0]?.toUpperCase());
      }
    });
  });

  describe('DYNAMIC_DESCRIPTORS constant', () => {
    it('has exactly 12 dynamic descriptor types (expanded from 7)', () => {
      expect(DYNAMIC_DESCRIPTORS.length).toBe(12);
    });

    it('includes new dynamic descriptor types', () => {
      expect(DYNAMIC_DESCRIPTORS).toContain('Vintage Compression Warmth');
      expect(DYNAMIC_DESCRIPTORS).toContain('Transparent Limiting');
      expect(DYNAMIC_DESCRIPTORS).toContain('Analog Compression Character');
      expect(DYNAMIC_DESCRIPTORS).toContain('Modern Mastering Loudness');
      expect(DYNAMIC_DESCRIPTORS).toContain('Uncompressed Raw Dynamics');
    });

    it('preserves existing dynamic descriptor types', () => {
      expect(DYNAMIC_DESCRIPTORS).toContain('Dynamic Range');
      expect(DYNAMIC_DESCRIPTORS).toContain('Compressed Punch');
      expect(DYNAMIC_DESCRIPTORS).toContain('Natural Dynamics');
      expect(DYNAMIC_DESCRIPTORS).toContain('Limiting for Loudness');
    });

    it('all dynamic descriptors are properly formatted', () => {
      for (const dynamic of DYNAMIC_DESCRIPTORS) {
        expect(typeof dynamic).toBe('string');
        expect(dynamic.length).toBeGreaterThan(0);
        // Check title case formatting
        expect(dynamic[0]).toBe(dynamic[0]?.toUpperCase());
      }
    });
  });

  // =============================================================================
  // Tests: Production Combination Calculations
  // =============================================================================

  describe('production combination variety', () => {
    it('calculates to 30,600 total combinations (15 × 17 × 10 × 12)', () => {
      const totalCombinations =
        REVERB_TYPES.length *
        RECORDING_TEXTURES.length *
        STEREO_IMAGING.length *
        DYNAMIC_DESCRIPTORS.length;

      expect(totalCombinations).toBe(30600);
    });

    it('reverb pool has 15 options', () => {
      expect(REVERB_TYPES.length).toBe(15);
    });

    it('texture pool has 17 options', () => {
      expect(RECORDING_TEXTURES.length).toBe(17);
    });

    it('stereo pool has 10 options', () => {
      expect(STEREO_IMAGING.length).toBe(10);
    });

    it('dynamic pool has 12 options', () => {
      expect(DYNAMIC_DESCRIPTORS.length).toBe(12);
    });
  });

  // =============================================================================
  // Tests: buildProductionDescriptorMulti Function
  // =============================================================================

  describe('buildProductionDescriptorMulti', () => {
    it('returns ProductionDescriptor with all 4 dimensions', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      expect(result).toBeDefined();
      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.stereo).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });

    it('all 4 dimensions are non-empty strings', () => {
      const rng = createSeededRng(12345);
      const result = buildProductionDescriptorMulti(rng);

      expect(typeof result.reverb).toBe('string');
      expect(typeof result.texture).toBe('string');
      expect(typeof result.stereo).toBe('string');
      expect(typeof result.dynamic).toBe('string');

      expect(result.reverb.length).toBeGreaterThan(0);
      expect(result.texture.length).toBeGreaterThan(0);
      expect(result.stereo.length).toBeGreaterThan(0);
      expect(result.dynamic.length).toBeGreaterThan(0);
    });

    it('all tags are lowercase', () => {
      const rng = createSeededRng(999);
      const result = buildProductionDescriptorMulti(rng);

      expect(result.reverb).toBe(result.reverb.toLowerCase());
      expect(result.texture).toBe(result.texture.toLowerCase());
      expect(result.stereo).toBe(result.stereo.toLowerCase());
      expect(result.dynamic).toBe(result.dynamic.toLowerCase());
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(777);
      const rng2 = createSeededRng(777);

      const result1 = buildProductionDescriptorMulti(rng1);
      const result2 = buildProductionDescriptorMulti(rng2);

      expect(result1).toEqual(result2);
    });

    it('produces different output with different seeds', () => {
      const rng1 = createSeededRng(111);
      const rng2 = createSeededRng(999);

      const result1 = buildProductionDescriptorMulti(rng1);
      const result2 = buildProductionDescriptorMulti(rng2);

      // At least one dimension should differ
      const hasDifference =
        result1.reverb !== result2.reverb ||
        result1.texture !== result2.texture ||
        result1.stereo !== result2.stereo ||
        result1.dynamic !== result2.dynamic;

      expect(hasDifference).toBe(true);
    });

    it('reverb comes from REVERB_TYPES pool', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      const reverbsLowercase = REVERB_TYPES.map((r) => r.toLowerCase());
      expect(reverbsLowercase).toContain(result.reverb);
    });

    it('texture comes from RECORDING_TEXTURES pool', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      const texturesLowercase = RECORDING_TEXTURES.map((t) => t.toLowerCase());
      expect(texturesLowercase).toContain(result.texture);
    });

    it('stereo comes from STEREO_IMAGING pool', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      const stereoLowercase = STEREO_IMAGING.map((s) => s.toLowerCase());
      expect(stereoLowercase).toContain(result.stereo);
    });

    it('dynamic comes from DYNAMIC_DESCRIPTORS pool', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      const dynamicLowercase = DYNAMIC_DESCRIPTORS.map((d) => d.toLowerCase());
      expect(dynamicLowercase).toContain(result.dynamic);
    });

    it('generates diverse output across multiple calls', () => {
      const results = new Set<string>();

      // Generate 100 different descriptors
      for (let i = 0; i < 100; i++) {
        const rng = createSeededRng(i);
        const result = buildProductionDescriptorMulti(rng);
        const serialized = JSON.stringify(result);
        results.add(serialized);
      }

      // Should have at least 90 unique combinations out of 100
      expect(results.size).toBeGreaterThanOrEqual(90);
    });

    it('works with default Math.random RNG', () => {
      const result = buildProductionDescriptorMulti();

      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.stereo).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });
  });

  // =============================================================================
  // Tests: Genre Production Styles
  // =============================================================================

  describe('GENRE_PRODUCTION_STYLES', () => {
    const EXPECTED_GENRES = [
      'jazz',
      'pop',
      'rock',
      'electronic',
      'ambient',
      'classical',
      'lofi',
      'blues',
      'rnb',
      'soul',
      'country',
      'folk',
      'metal',
      'punk',
      'synthwave',
      'cinematic',
      'trap',
      'latin',
      'retro',
      'videogame',
      'symphonic',
    ];

    it('has styles for all major genres', () => {
      for (const genre of EXPECTED_GENRES) {
        const style = GENRE_PRODUCTION_STYLES[genre];
        expect(style).toBeDefined();
        expect(style!.reverbs.length).toBeGreaterThan(0);
        expect(style!.textures.length).toBeGreaterThan(0);
        expect(style!.dynamics.length).toBeGreaterThan(0);
      }
    });

    it('jazz has appropriate production characteristics', () => {
      const jazz = GENRE_PRODUCTION_STYLES.jazz;
      expect(jazz).toBeDefined();
      expect(jazz!.reverbs).toContain('Long Hall Reverb');
      expect(jazz!.textures).toContain('Analog Warmth');
      expect(jazz!.dynamics).toContain('Natural Dynamics');
    });

    it('lofi has characteristic dusty texture', () => {
      const lofi = GENRE_PRODUCTION_STYLES.lofi;
      expect(lofi).toBeDefined();
      expect(lofi!.textures).toContain('Lo-Fi Dusty');
      expect(lofi!.textures).toContain('Vintage Warmth');
    });

    it('metal has tight dry room reverb', () => {
      const metal = GENRE_PRODUCTION_STYLES.metal;
      expect(metal).toBeDefined();
      expect(metal!.reverbs).toContain('Tight Dry Room');
      expect(metal!.dynamics).toContain('Compressed Punch');
    });

    it('ambient has spacious reverb', () => {
      const ambient = GENRE_PRODUCTION_STYLES.ambient;
      expect(ambient).toBeDefined();
      expect(ambient!.reverbs).toContain('Long Hall Reverb');
      expect(ambient!.reverbs).toContain('Cathedral Reverb');
      expect(ambient!.dynamics).toContain('Natural Dynamics');
    });

    it('electronic has polished digital production', () => {
      const electronic = GENRE_PRODUCTION_STYLES.electronic;
      expect(electronic).toBeDefined();
      expect(electronic!.textures).toContain('Digital Precision');
      expect(electronic!.dynamics).toContain('Compressed Punch');
    });

    it('classical has natural hall reverb', () => {
      const classical = GENRE_PRODUCTION_STYLES.classical;
      expect(classical).toBeDefined();
      expect(classical!.reverbs).toContain('Concert Hall Reverb');
      expect(classical!.dynamics).toContain('Dynamic Range');
    });
  });

  describe('DEFAULT_PRODUCTION_STYLE', () => {
    it('exists as fallback for unmapped genres', () => {
      expect(DEFAULT_PRODUCTION_STYLE).toBeDefined();
      expect(DEFAULT_PRODUCTION_STYLE.reverbs.length).toBeGreaterThan(0);
      expect(DEFAULT_PRODUCTION_STYLE.textures.length).toBeGreaterThan(0);
      expect(DEFAULT_PRODUCTION_STYLE.dynamics.length).toBeGreaterThan(0);
    });

    it('has sensible defaults', () => {
      expect(DEFAULT_PRODUCTION_STYLE.reverbs).toContain('Studio Reverb');
      expect(DEFAULT_PRODUCTION_STYLE.textures).toContain('Polished Production');
      expect(DEFAULT_PRODUCTION_STYLE.dynamics).toContain('Natural Dynamics');
    });
  });

  describe('getProductionSuggestionsForGenre', () => {
    it('returns valid suggestions for known genre', () => {
      const rng = createSeededRng(42);
      const result = getProductionSuggestionsForGenre('jazz', rng);

      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });

    it('returns default suggestions for unknown genre', () => {
      const rng = createSeededRng(42);
      const result = getProductionSuggestionsForGenre('unknown_xyz', rng);

      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.dynamic).toBeDefined();

      // Should come from DEFAULT_PRODUCTION_STYLE
      expect(DEFAULT_PRODUCTION_STYLE.reverbs).toContain(result.reverb);
    });

    it('is deterministic with seeded RNG', () => {
      const rng1 = createSeededRng(123);
      const rng2 = createSeededRng(123);

      const result1 = getProductionSuggestionsForGenre('rock', rng1);
      const result2 = getProductionSuggestionsForGenre('rock', rng2);

      expect(result1).toEqual(result2);
    });

    it('suggestions come from genre-specific pools', () => {
      const rng = createSeededRng(42);
      const result = getProductionSuggestionsForGenre('jazz', rng);

      const jazzStyle = GENRE_PRODUCTION_STYLES.jazz;
      expect(jazzStyle!.reverbs).toContain(result.reverb);
      expect(jazzStyle!.textures).toContain(result.texture);
      expect(jazzStyle!.dynamics).toContain(result.dynamic);
    });

    it('generates variety across multiple calls for same genre', () => {
      const results = new Set<string>();

      // Generate 50 different suggestions for jazz
      for (let i = 0; i < 50; i++) {
        const rng = createSeededRng(i);
        const result = getProductionSuggestionsForGenre('jazz', rng);
        const serialized = JSON.stringify(result);
        results.add(serialized);
      }

      // Jazz has 4 reverbs × 4 textures × 3 dynamics = 48 combinations
      // Should have at least 20 unique combinations (realistic given genre-specific pools)
      expect(results.size).toBeGreaterThanOrEqual(20);
    });

    it('is case insensitive for genre lookup', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const lower = getProductionSuggestionsForGenre('jazz', rng1);
      const upper = getProductionSuggestionsForGenre('JAZZ', rng2);

      expect(lower).toEqual(upper);
    });

    it('works with default Math.random RNG', () => {
      const result = getProductionSuggestionsForGenre('pop');

      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });
  });

  // =============================================================================
  // Tests: Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    it('buildProductionDescriptorMulti handles edge RNG values', () => {
      // RNG always returns 0.0 (first item)
      const rng1 = () => 0.0;
      const result1 = buildProductionDescriptorMulti(rng1);

      expect(result1.reverb).toBe(REVERB_TYPES[0]?.toLowerCase());
      expect(result1.texture).toBe(RECORDING_TEXTURES[0]?.toLowerCase());
      expect(result1.stereo).toBe(STEREO_IMAGING[0]?.toLowerCase());
      expect(result1.dynamic).toBe(DYNAMIC_DESCRIPTORS[0]?.toLowerCase());
    });

    it('buildProductionDescriptorMulti handles high RNG values', () => {
      // RNG always returns 0.99 (last item)
      const rng = () => 0.99;
      const result = buildProductionDescriptorMulti(rng);

      // Should select last items from each pool
      const lastReverb = REVERB_TYPES[REVERB_TYPES.length - 1]?.toLowerCase() ?? '';
      const lastTexture = RECORDING_TEXTURES[RECORDING_TEXTURES.length - 1]?.toLowerCase() ?? '';
      const lastStereo = STEREO_IMAGING[STEREO_IMAGING.length - 1]?.toLowerCase() ?? '';
      const lastDynamic = DYNAMIC_DESCRIPTORS[DYNAMIC_DESCRIPTORS.length - 1]?.toLowerCase() ?? '';

      expect(result.reverb).toBe(lastReverb);
      expect(result.texture).toBe(lastTexture);
      expect(result.stereo).toBe(lastStereo);
      expect(result.dynamic).toBe(lastDynamic);
    });

    it('getProductionSuggestionsForGenre handles empty genre string', () => {
      const rng = createSeededRng(42);
      const result = getProductionSuggestionsForGenre('', rng);

      // Should use default style
      expect(DEFAULT_PRODUCTION_STYLE.reverbs).toContain(result.reverb);
    });

    it('getProductionSuggestionsForGenre handles whitespace genre', () => {
      const rng = createSeededRng(42);
      const result = getProductionSuggestionsForGenre('   ', rng);

      // Should use default style
      expect(result.reverb).toBeDefined();
    });

    it('pools have no duplicate entries', () => {
      const reverbSet = new Set(REVERB_TYPES);
      const textureSet = new Set(RECORDING_TEXTURES);
      const stereoSet = new Set(STEREO_IMAGING);
      const dynamicSet = new Set(DYNAMIC_DESCRIPTORS);

      expect(reverbSet.size).toBe(REVERB_TYPES.length);
      expect(textureSet.size).toBe(RECORDING_TEXTURES.length);
      expect(stereoSet.size).toBe(STEREO_IMAGING.length);
      expect(dynamicSet.size).toBe(DYNAMIC_DESCRIPTORS.length);
    });
  });

  // =============================================================================
  // Tests: Integration with assembleStyleTags
  // =============================================================================

  describe('integration scenarios', () => {
    it('multi-dimensional production enables variety explosion', () => {
      const uniqueDescriptors = new Set<string>();

      // Generate 1000 descriptors
      for (let i = 0; i < 1000; i++) {
        const rng = createSeededRng(i);
        const result = buildProductionDescriptorMulti(rng);
        const serialized = JSON.stringify(result);
        uniqueDescriptors.add(serialized);
      }

      // With 30,600 possible combinations, we should easily get 900+ unique in 1000 tries
      expect(uniqueDescriptors.size).toBeGreaterThanOrEqual(900);
    });

    it('production descriptors are suitable for Suno V5 prompts', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorMulti(rng);

      // All tags should be lowercase (Suno requirement)
      expect(result.reverb).toBe(result.reverb.toLowerCase());
      expect(result.texture).toBe(result.texture.toLowerCase());
      expect(result.stereo).toBe(result.stereo.toLowerCase());
      expect(result.dynamic).toBe(result.dynamic.toLowerCase());

      // All tags should be non-empty
      expect(result.reverb.length).toBeGreaterThan(0);
      expect(result.texture.length).toBeGreaterThan(0);
      expect(result.stereo.length).toBeGreaterThan(0);
      expect(result.dynamic.length).toBeGreaterThan(0);
    });
  });
});
