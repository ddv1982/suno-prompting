/**
 * Thematic Fields Tests
 *
 * Tests for vocal, energy, and spatial schema fields and their integrations:
 * - VocalCharacterSchema, EnergyLevelSchema, SpatialHintSchema validation
 * - selectVocalTagsWithCharacter() vocal character integration
 * - adjustWeightsForEnergyLevel() energy level weight adjustment
 * - selectReverbWithSpatialHint() spatial hint reverb selection
 *
 * @module tests/unit/thematic-fields
 */

import { describe, expect, test } from 'bun:test';

import { adjustWeightsForEnergyLevel } from '@bun/prompt/deterministic/weights';
import { selectReverbWithSpatialHint } from '@bun/prompt/production-elements';
import { selectVocalTagsWithCharacter } from '@bun/prompt/tags/vocal';
import {
  EnergyLevelSchema,
  SpatialHintSchema,
  ThematicContextSchema,
  VocalCharacterSchema,
} from '@shared/schemas/thematic-context';

import type { TagCategoryWeights } from '@bun/prompt/deterministic/types';
import type { EnergyLevel, SpatialHint, VocalCharacter } from '@shared/schemas/thematic-context';

// ============================================
// Schema Validation Tests
// ============================================

describe('VocalCharacterSchema', () => {
  test('validates empty object (all fields optional)', () => {
    const result = VocalCharacterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  test('validates with style only', () => {
    const result = VocalCharacterSchema.safeParse({ style: 'breathy' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe('breathy');
    }
  });

  test('validates with layering only', () => {
    const result = VocalCharacterSchema.safeParse({ layering: 'harmonies' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layering).toBe('harmonies');
    }
  });

  test('validates with technique only', () => {
    const result = VocalCharacterSchema.safeParse({ technique: 'falsetto' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.technique).toBe('falsetto');
    }
  });

  test('validates with all fields', () => {
    const result = VocalCharacterSchema.safeParse({
      style: 'powerful',
      layering: 'choir',
      technique: 'belt',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        style: 'powerful',
        layering: 'choir',
        technique: 'belt',
      });
    }
  });
});

describe('EnergyLevelSchema', () => {
  test.each(['ambient', 'relaxed', 'moderate', 'energetic', 'intense'] as const)(
    'validates "%s"',
    (level) => {
      const result = EnergyLevelSchema.safeParse(level);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(level);
      }
    }
  );

  test('rejects invalid value', () => {
    const result = EnergyLevelSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('SpatialHintSchema', () => {
  test('validates empty object (all fields optional)', () => {
    const result = SpatialHintSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  test.each(['intimate', 'room', 'hall', 'vast'] as const)('validates space "%s"', (space) => {
    const result = SpatialHintSchema.safeParse({ space });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.space).toBe(space);
    }
  });

  test.each(['dry', 'natural', 'wet', 'cavernous'] as const)('validates reverb "%s"', (reverb) => {
    const result = SpatialHintSchema.safeParse({ reverb });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reverb).toBe(reverb);
    }
  });

  test('validates with both space and reverb', () => {
    const result = SpatialHintSchema.safeParse({
      space: 'vast',
      reverb: 'cavernous',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        space: 'vast',
        reverb: 'cavernous',
      });
    }
  });

  test('rejects invalid space', () => {
    const result = SpatialHintSchema.safeParse({ space: 'invalid' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid reverb', () => {
    const result = SpatialHintSchema.safeParse({ reverb: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('ThematicContextSchema with vocal/energy/spatial fields', () => {
  const baseContext = {
    themes: ['alien', 'bioluminescent', 'discovery'],
    moods: ['wondrous', 'curious'],
    scene: 'first steps into an alien jungle',
  };

  test('validates with vocalCharacter', () => {
    const result = ThematicContextSchema.safeParse({
      ...baseContext,
      vocalCharacter: { style: 'ethereal', layering: 'harmonies' },
    });
    expect(result.success).toBe(true);
  });

  test('validates with energyLevel', () => {
    const result = ThematicContextSchema.safeParse({
      ...baseContext,
      energyLevel: 'energetic',
    });
    expect(result.success).toBe(true);
  });

  test('validates with spatialHint', () => {
    const result = ThematicContextSchema.safeParse({
      ...baseContext,
      spatialHint: { space: 'hall', reverb: 'wet' },
    });
    expect(result.success).toBe(true);
  });

  test('validates with all vocal/energy/spatial fields', () => {
    const result = ThematicContextSchema.safeParse({
      ...baseContext,
      vocalCharacter: { style: 'powerful', technique: 'belt' },
      energyLevel: 'intense',
      spatialHint: { space: 'vast', reverb: 'cavernous' },
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// selectVocalTagsWithCharacter Tests
// ============================================

describe('selectVocalTagsWithCharacter', () => {
  // Fixed RNG for deterministic tests
  const createFixedRng = (value: number) => () => value;

  test('returns empty array when probability check fails', () => {
    // RNG returns 0.99, which is > 0.95 (pop vocal probability)
    const rng = createFixedRng(0.99);
    const result = selectVocalTagsWithCharacter('pop', 3, rng);
    expect(result).toEqual([]);
  });

  test('returns tags when probability check passes', () => {
    // RNG returns 0.1, which is < 0.95 (pop vocal probability)
    const rng = createFixedRng(0.1);
    const result = selectVocalTagsWithCharacter('pop', 3, rng);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('character-derived tags appear first with style', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      // First call is for probability check
      if (callCount === 1) return 0.1;
      // Subsequent calls for shuffling
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = { style: 'breathy' };
    const result = selectVocalTagsWithCharacter('pop', 3, rng, vocalCharacter);

    expect(result[0]).toBe('breathy delivery');
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('character-derived tags appear first with layering', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.1;
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = { layering: 'harmonies' };
    const result = selectVocalTagsWithCharacter('pop', 3, rng, vocalCharacter);

    expect(result[0]).toBe('harmony layers');
  });

  test('character-derived tags appear first with technique', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.1;
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = { technique: 'falsetto' };
    const result = selectVocalTagsWithCharacter('pop', 3, rng, vocalCharacter);

    expect(result[0]).toBe('falsetto sections');
  });

  test('multiple character fields add multiple priority tags', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.1;
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = {
      style: 'powerful',
      layering: 'choir',
      technique: 'belt',
    };
    const result = selectVocalTagsWithCharacter('pop', 5, rng, vocalCharacter);

    // All three character-derived tags should be present
    expect(result).toContain('powerful vocals');
    expect(result).toContain('choir stacking');
    expect(result).toContain('belt technique');
  });

  test('falls back to random selection when character undefined', () => {
    const rng = createFixedRng(0.1);
    const result = selectVocalTagsWithCharacter('pop', 3, rng);

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('respects max count with character', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.1;
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = {
      style: 'powerful',
      layering: 'choir',
      technique: 'belt',
    };
    const result = selectVocalTagsWithCharacter('pop', 2, rng, vocalCharacter);

    expect(result.length).toBe(2);
  });

  test('handles unknown style gracefully', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.1;
      return 0.5;
    };

    const vocalCharacter: VocalCharacter = { style: 'unknown_style' };
    const result = selectVocalTagsWithCharacter('pop', 3, rng, vocalCharacter);

    // Should still return tags from random pool
    expect(result.length).toBeGreaterThan(0);
    // Unknown style should not add any priority tags
    expect(result).not.toContain('unknown_style');
  });
});

// ============================================
// adjustWeightsForEnergyLevel Tests
// ============================================

describe('adjustWeightsForEnergyLevel', () => {
  const baseWeights: TagCategoryWeights = {
    vocal: 0.7,
    spatial: 0.5,
    harmonic: 0.4,
    dynamic: 0.5,
    temporal: 0.4,
  };

  test('returns unchanged weights for undefined energyLevel', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, undefined);
    expect(result).toEqual(baseWeights);
  });

  test('returns unchanged weights for moderate energyLevel', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, 'moderate');
    expect(result).toEqual(baseWeights);
  });

  test('reduces dynamic and temporal weights for ambient', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, 'ambient');

    // dynamic * 0.3 = 0.5 * 0.3 = 0.15
    expect(result.dynamic).toBeCloseTo(0.15);
    // temporal * 0.5 = 0.4 * 0.5 = 0.2
    expect(result.temporal).toBeCloseTo(0.2);
    // Other weights unchanged
    expect(result.vocal).toBe(baseWeights.vocal);
    expect(result.spatial).toBe(baseWeights.spatial);
    expect(result.harmonic).toBe(baseWeights.harmonic);
  });

  test('reduces weights moderately for relaxed', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, 'relaxed');

    // dynamic * 0.6 = 0.5 * 0.6 = 0.3
    expect(result.dynamic).toBeCloseTo(0.3);
    // temporal * 0.7 = 0.4 * 0.7 = 0.28
    expect(result.temporal).toBeCloseTo(0.28);
  });

  test('boosts weights for energetic', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, 'energetic');

    // dynamic * 1.4 = 0.5 * 1.4 = 0.7
    expect(result.dynamic).toBeCloseTo(0.7);
    // temporal * 1.2 = 0.4 * 1.2 = 0.48
    expect(result.temporal).toBeCloseTo(0.48);
  });

  test('significantly boosts weights for intense', () => {
    const result = adjustWeightsForEnergyLevel(baseWeights, 'intense');

    // dynamic * 1.8 = 0.5 * 1.8 = 0.9
    expect(result.dynamic).toBeCloseTo(0.9);
    // temporal * 1.5 = 0.4 * 1.5 = 0.6
    expect(result.temporal).toBeCloseTo(0.6);
    // vocal * 1.2 = 0.7 * 1.2 = 0.84
    expect(result.vocal).toBeCloseTo(0.84);
  });

  test('preserves unchanged weights for all levels', () => {
    const levels: EnergyLevel[] = ['ambient', 'relaxed', 'moderate', 'energetic', 'intense'];

    for (const level of levels) {
      const result = adjustWeightsForEnergyLevel(baseWeights, level);
      // spatial and harmonic are never adjusted
      expect(result.spatial).toBe(baseWeights.spatial);
      expect(result.harmonic).toBe(baseWeights.harmonic);
    }
  });
});

// ============================================
// selectReverbWithSpatialHint Tests
// ============================================

describe('selectReverbWithSpatialHint', () => {
  // Fixed RNG for deterministic tests
  const createFixedRng = (value: number) => () => value;

  test('returns random reverb when spatialHint undefined', () => {
    const rng = createFixedRng(0.5);
    const result = selectReverbWithSpatialHint(rng, undefined);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Should be lowercase
    expect(result).toBe(result.toLowerCase());
  });

  test('returns random reverb when spatialHint has no space', () => {
    const rng = createFixedRng(0.5);
    const result = selectReverbWithSpatialHint(rng, {});

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  test('returns intimate reverb for space "intimate"', () => {
    const rng = createFixedRng(0);
    const result = selectReverbWithSpatialHint(rng, { space: 'intimate' });

    // First item in intimate pool: 'Tight Dry Room'
    expect(result).toBe('tight dry room');
  });

  test('returns room reverb for space "room"', () => {
    const rng = createFixedRng(0);
    const result = selectReverbWithSpatialHint(rng, { space: 'room' });

    // First item in room pool: 'Short Room Reverb'
    expect(result).toBe('short room reverb');
  });

  test('returns hall reverb for space "hall"', () => {
    const rng = createFixedRng(0);
    const result = selectReverbWithSpatialHint(rng, { space: 'hall' });

    // First item in hall pool: 'Long Hall Reverb'
    expect(result).toBe('long hall reverb');
  });

  test('returns vast reverb for space "vast"', () => {
    const rng = createFixedRng(0);
    const result = selectReverbWithSpatialHint(rng, { space: 'vast' });

    // First item in vast pool: 'Cathedral Reverb'
    expect(result).toBe('cathedral reverb');
  });

  test('all 4 space sizes have mapped reverb types', () => {
    const spaces: SpatialHint['space'][] = ['intimate', 'room', 'hall', 'vast'];
    const rng = createFixedRng(0);

    for (const space of spaces) {
      const result = selectReverbWithSpatialHint(rng, { space });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  test('returns lowercase reverb', () => {
    const rng = createFixedRng(0.5);
    const result = selectReverbWithSpatialHint(rng, { space: 'hall' });

    expect(result).toBe(result.toLowerCase());
  });

  test('falls back to random when only reverb hint provided (no space)', () => {
    const rng = createFixedRng(0.5);
    const result = selectReverbWithSpatialHint(rng, { reverb: 'wet' });

    // Should return something from the full pool since space is not set
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
