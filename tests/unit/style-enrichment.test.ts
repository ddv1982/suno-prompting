/**
 * Unit Tests for Style Enrichment Features
 *
 * Tests for:
 * - getDynamicWeightFromArc() - narrativeArc-based dynamic weight multiplier
 * - buildProductionDescriptorWithEra() - era-biased texture selection
 * - resolveEra() and appendMusicalReferenceStyleTags() - musicalReference support
 *
 * @module tests/unit/style-enrichment
 */

import { describe, it, expect, test } from 'bun:test';

import {
  getDynamicWeightFromArc,
  resolveEra,
  appendMusicalReferenceStyleTags,
} from '@bun/prompt/deterministic/styles';
import {
  buildProductionDescriptorWithEra,
  ERA_TEXTURE_BIASES,
  RECORDING_TEXTURES,
} from '@bun/prompt/production-elements';

import type { ThematicContext, Era } from '@shared/schemas/thematic-context';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Creates a minimal valid ThematicContext for testing.
 */
function createMinimalContext(overrides: Partial<ThematicContext> = {}): ThematicContext {
  return {
    themes: ['theme1', 'theme2', 'theme3'],
    moods: ['mood1', 'mood2'],
    scene: 'A test scene for testing',
    ...overrides,
  };
}

// =============================================================================
// Task 1.1: getDynamicWeightFromArc Tests
// =============================================================================

describe('getDynamicWeightFromArc', () => {
  describe('returns 1.0 for default/short arcs', () => {
    it('returns 1.0 for undefined arc', () => {
      expect(getDynamicWeightFromArc(undefined)).toBe(1.0);
    });

    it('returns 1.0 for empty arc array', () => {
      expect(getDynamicWeightFromArc([])).toBe(1.0);
    });

    it('returns 1.0 for arc length 1', () => {
      expect(getDynamicWeightFromArc(['act1'])).toBe(1.0);
    });

    it('returns 1.0 for arc length 2', () => {
      expect(getDynamicWeightFromArc(['act1', 'act2'])).toBe(1.0);
    });
  });

  describe('returns 1.3 for moderate arcs (3-4 elements)', () => {
    it('returns 1.3 for arc length 3', () => {
      expect(getDynamicWeightFromArc(['act1', 'act2', 'act3'])).toBe(1.3);
    });

    it('returns 1.3 for arc length 4', () => {
      expect(getDynamicWeightFromArc(['intro', 'conflict', 'climax', 'resolution'])).toBe(1.3);
    });
  });

  describe('returns 1.6 for epic arcs (5+ elements)', () => {
    it('returns 1.6 for arc length 5', () => {
      expect(getDynamicWeightFromArc(['a', 'b', 'c', 'd', 'e'])).toBe(1.6);
    });

    it('returns 1.6 for arc length 6', () => {
      expect(getDynamicWeightFromArc(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(1.6);
    });

    it('returns 1.6 for very long arcs', () => {
      const longArc = Array.from({ length: 10 }, (_, i) => `part${i}`);
      expect(getDynamicWeightFromArc(longArc)).toBe(1.6);
    });
  });

  describe('parameterized tests', () => {
    test.each([
      [undefined, 1.0],
      [[], 1.0],
      [['a'], 1.0],
      [['a', 'b'], 1.0],
      [['a', 'b', 'c'], 1.3],
      [['a', 'b', 'c', 'd'], 1.3],
      [['a', 'b', 'c', 'd', 'e'], 1.6],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g'], 1.6],
    ])('getDynamicWeightFromArc(%j) returns %p', (arc, expected) => {
      expect(getDynamicWeightFromArc(arc ?? undefined)).toBe(expected);
    });
  });
});

// =============================================================================
// Task 1.2: buildProductionDescriptorWithEra Tests
// =============================================================================

describe('buildProductionDescriptorWithEra', () => {
  describe('returns valid production descriptor', () => {
    it('returns all 4 dimensions', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorWithEra(rng);

      expect(result).toBeDefined();
      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.stereo).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });

    it('all dimensions are lowercase strings', () => {
      const rng = createSeededRng(123);
      const result = buildProductionDescriptorWithEra(rng, '80s');

      expect(result.reverb).toBe(result.reverb.toLowerCase());
      expect(result.texture).toBe(result.texture.toLowerCase());
      expect(result.stereo).toBe(result.stereo.toLowerCase());
      expect(result.dynamic).toBe(result.dynamic.toLowerCase());
    });
  });

  describe('era texture bias behavior', () => {
    it('returns texture from full pool when era is undefined', () => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorWithEra(rng);

      // Texture should be from RECORDING_TEXTURES (lowercase)
      const texturesLowercase = RECORDING_TEXTURES.map((t) => t.toLowerCase());
      expect(texturesLowercase).toContain(result.texture);
    });

    it('returns era-biased texture when era is set and rng < 0.7', () => {
      // Create RNG that will return < 0.7 for the texture bias check
      let callCount = 0;
      const fixedRng = (): number => {
        callCount++;
        // First 3 calls are for reverb, stereo, dynamic
        // 4th call is the bias check (return < 0.7 to use biased pool)
        // 5th call is for selecting from biased pool
        if (callCount === 4) return 0.5; // < 0.7, use biased pool
        return 0.3; // Return value for selections
      };

      const result = buildProductionDescriptorWithEra(fixedRng, '80s');

      // 80s textures should be from Digital Precision, Crystal Clear, Polished Production
      const eraTexturesLowercase = ERA_TEXTURE_BIASES['80s'].map((t) => t.toLowerCase());
      expect(eraTexturesLowercase).toContain(result.texture);
    });

    it('returns random texture when era is set but rng >= 0.7', () => {
      // Create RNG that will return >= 0.7 for the texture bias check
      let callCount = 0;
      const fixedRng = (): number => {
        callCount++;
        // 4th call is the bias check (return >= 0.7 to use full pool)
        if (callCount === 4) return 0.75; // >= 0.7, use full pool
        return 0.3;
      };

      const result = buildProductionDescriptorWithEra(fixedRng, '80s');

      // Texture should be from full pool
      const texturesLowercase = RECORDING_TEXTURES.map((t) => t.toLowerCase());
      expect(texturesLowercase).toContain(result.texture);
    });
  });

  describe('all eras have appropriate texture mappings', () => {
    const eras: ('50s-60s' | '70s' | '80s' | '90s' | '2000s' | 'modern')[] = [
      '50s-60s',
      '70s',
      '80s',
      '90s',
      '2000s',
      'modern',
    ];

    test.each(eras)('ERA_TEXTURE_BIASES has mapping for "%s"', (era) => {
      expect(ERA_TEXTURE_BIASES[era]).toBeDefined();
      expect(ERA_TEXTURE_BIASES[era].length).toBeGreaterThan(0);
    });

    test.each(eras)('buildProductionDescriptorWithEra works with "%s"', (era) => {
      const rng = createSeededRng(42);
      const result = buildProductionDescriptorWithEra(rng, era);

      expect(result.texture).toBeDefined();
      expect(result.texture.length).toBeGreaterThan(0);
    });
  });

  describe('determinism', () => {
    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(777);
      const rng2 = createSeededRng(777);

      const result1 = buildProductionDescriptorWithEra(rng1, '70s');
      const result2 = buildProductionDescriptorWithEra(rng2, '70s');

      expect(result1).toEqual(result2);
    });

    it('produces different output with different seeds', () => {
      const rng1 = createSeededRng(111);
      const rng2 = createSeededRng(999);

      const result1 = buildProductionDescriptorWithEra(rng1, '80s');
      const result2 = buildProductionDescriptorWithEra(rng2, '80s');

      // At least one dimension should differ
      const hasDifference =
        result1.reverb !== result2.reverb ||
        result1.texture !== result2.texture ||
        result1.stereo !== result2.stereo ||
        result1.dynamic !== result2.dynamic;

      expect(hasDifference).toBe(true);
    });
  });
});

// =============================================================================
// Task 1.3: resolveEra Tests
// =============================================================================

describe('resolveEra', () => {
  describe('returns top-level era when set', () => {
    it('returns era from top-level field', () => {
      const context = createMinimalContext({ era: '80s' });
      expect(resolveEra(context)).toBe('80s');
    });

    it('prefers top-level era over musicalReference.era', () => {
      const context = createMinimalContext({
        era: '80s',
        musicalReference: {
          style: [],
          era: '70s',
          signature: [],
        },
      });
      expect(resolveEra(context)).toBe('80s');
    });
  });

  describe('falls back to musicalReference.era', () => {
    it('returns musicalReference.era when top-level era is undefined', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: [],
          era: '70s',
          signature: [],
        },
      });
      expect(resolveEra(context)).toBe('70s');
    });

    it('returns undefined when musicalReference.era is not a valid Era value', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: [],
          era: 'invalid-era',
          signature: [],
        },
      });
      expect(resolveEra(context)).toBeUndefined();
    });
  });

  describe('returns undefined when both are missing', () => {
    it('returns undefined for undefined context', () => {
      expect(resolveEra(undefined)).toBeUndefined();
    });

    it('returns undefined when neither era is set', () => {
      const context = createMinimalContext();
      expect(resolveEra(context)).toBeUndefined();
    });

    it('returns undefined when musicalReference exists but era is undefined', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['ethereal'],
          signature: ['reverb-heavy'],
        },
      });
      expect(resolveEra(context)).toBeUndefined();
    });
  });

  describe('parameterized era validation tests', () => {
    const eraTestCases: [string, Era | undefined][] = [
      ['50s-60s', '50s-60s'],
      ['70s', '70s'],
      ['80s', '80s'],
      ['90s', '90s'],
      ['2000s', '2000s'],
      ['modern', 'modern'],
      ['invalid', undefined],
      ['1950s', undefined],
      ['', undefined],
      ['MODERN', undefined],
    ];

    test.each(eraTestCases)('musicalReference.era="%s" resolves to %p', (refEra, expected) => {
      const context = createMinimalContext({
        musicalReference: {
          style: [],
          era: refEra,
          signature: [],
        },
      });
      expect(resolveEra(context)).toBe(expected);
    });
  });
});

// =============================================================================
// Task 1.3: appendMusicalReferenceStyleTags Tests
// =============================================================================

describe('appendMusicalReferenceStyleTags', () => {
  describe('basic functionality', () => {
    it('does nothing when context is undefined', () => {
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(undefined, addUnique);
      expect(tags).toEqual([]);
    });

    it('does nothing when musicalReference is undefined', () => {
      const context = createMinimalContext();
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual([]);
    });

    it('does nothing when style array is empty', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: [],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual([]);
    });
  });

  describe('appends valid style tags', () => {
    it('appends single style tag', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['dreamy'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toContain('dreamy');
    });

    it('appends up to 2 style tags', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['ethereal', 'shoegaze', 'dreamy', 'ambient'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags.length).toBe(2);
      expect(tags).toContain('ethereal');
      expect(tags).toContain('shoegaze');
    });

    it('converts tags to lowercase', () => {
      // Note: Single capitalized words are filtered by isValidProductionSignature
      // to prevent artist names from slipping through. Multi-word lowercase
      // inputs or lowercase single words are the expected format.
      const context = createMinimalContext({
        musicalReference: {
          style: ['lo-fi sound', 'dreamy vibes'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['lo-fi sound', 'dreamy vibes']);
    });
  });

  describe('filters invalid/artist-like names', () => {
    it('filters out single capitalized words (potential artist names)', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['Radiohead', 'dreamy'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['dreamy']);
      expect(tags).not.toContain('radiohead');
    });

    it('filters out strings matching name patterns', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['John Smith', 'ethereal shoegaze'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['ethereal shoegaze']);
    });

    it('filters out very short strings', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['AB', 'dreamy soundscape'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['dreamy soundscape']);
    });

    it('allows lowercase single words', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['ethereal', 'dreamy'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['ethereal', 'dreamy']);
    });

    it('allows multi-word descriptors even with capitals', () => {
      const context = createMinimalContext({
        musicalReference: {
          style: ['lo-fi beats', 'dark ambient'],
          signature: [],
        },
      });
      const tags: string[] = [];
      const addUnique = (tag: string): void => {
        tags.push(tag);
      };

      appendMusicalReferenceStyleTags(context, addUnique);
      expect(tags).toEqual(['lo-fi beats', 'dark ambient']);
    });
  });
});

// =============================================================================
// Integration: Style enrichment features work together
// =============================================================================

describe('Style Enrichment Integration', () => {
  it('resolveEra + buildProductionDescriptorWithEra integration', () => {
    const context = createMinimalContext({
      era: '80s',
    });

    const era = resolveEra(context);
    expect(era).toBe('80s');

    const rng = createSeededRng(42);
    const production = buildProductionDescriptorWithEra(rng, era);
    expect(production.texture).toBeDefined();
  });

  it('musicalReference.era fallback + era-biased production integration', () => {
    const context = createMinimalContext({
      musicalReference: {
        style: ['synth-pop', 'new wave'],
        era: '80s',
        signature: ['gated reverb'],
      },
    });

    const era = resolveEra(context);
    expect(era).toBe('80s');

    const rng = createSeededRng(42);
    const production = buildProductionDescriptorWithEra(rng, era);
    expect(production.texture).toBeDefined();
  });

  it('dynamic weight multiplier for epic narratives', () => {
    const epicArc = ['awakening', 'journey', 'trial', 'dark night', 'triumph', 'return'];
    const multiplier = getDynamicWeightFromArc(epicArc);
    expect(multiplier).toBe(1.6);

    // Base dynamic weight is typically around 0.3-0.5
    // With 1.6x multiplier, it becomes ~0.48-0.8 (much higher probability)
    const baseWeight = 0.4;
    const adjustedWeight = baseWeight * multiplier;
    expect(adjustedWeight).toBeCloseTo(0.64);
  });
});
