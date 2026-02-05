import { describe, it, expect } from 'bun:test';

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import {
  canFuse,
  getCompatibilityScore,
  FUSION_THRESHOLD,
  getCompatibleGenres,
} from '@bun/instruments/genres/compatibility';

/**
 * Tests for v3.0 Genre Expansion
 *
 * Validates:
 * - Registry size meets 60+ requirement
 * - All 25 new genres have required properties
 * - Compatibility matrix lookups work correctly
 * - canFuse() function works as expected
 */

describe('v3.0 Genre Expansion', () => {
  describe('registry size', () => {
    it('should have 60+ genres', () => {
      const genreCount = Object.keys(GENRE_REGISTRY).length;
      expect(genreCount).toBeGreaterThanOrEqual(60);
    });

    it('should have exactly 60 genres (35 existing + 25 new)', () => {
      const genreCount = Object.keys(GENRE_REGISTRY).length;
      expect(genreCount).toBe(60);
    });
  });

  describe('new genres structure', () => {
    const newElectronicGenres: GenreType[] = [
      'dubstep',
      'drumandbass',
      'idm',
      'breakbeat',
      'jungle',
      'hardstyle',
      'ukgarage',
    ];

    const newRockAltGenres: GenreType[] = [
      'shoegaze',
      'postpunk',
      'emo',
      'grunge',
      'stonerrock',
      'mathrock',
    ];

    const newSynthGenres: GenreType[] = ['darksynth', 'outrun', 'synthpop'];

    const newWorldGenres: GenreType[] = [
      'celtic',
      'balkan',
      'middleeastern',
      'afrocuban',
      'bossanova',
    ];

    const newOtherGenres: GenreType[] = ['gospel', 'bluegrass', 'ska', 'dancehall'];

    const allNewGenres = [
      ...newElectronicGenres,
      ...newRockAltGenres,
      ...newSynthGenres,
      ...newWorldGenres,
      ...newOtherGenres,
    ];

    it('should have all 25 new genres in registry', () => {
      expect(allNewGenres.length).toBe(25);
      allNewGenres.forEach((genre) => {
        expect(GENRE_REGISTRY[genre]).toBeDefined();
      });
    });

    allNewGenres.forEach((genre) => {
      describe(genre, () => {
        const def = GENRE_REGISTRY[genre];

        it('should have a name', () => {
          expect(def.name).toBeTruthy();
          expect(typeof def.name).toBe('string');
        });

        it('should have keywords array with items', () => {
          expect(Array.isArray(def.keywords)).toBe(true);
          expect(def.keywords.length).toBeGreaterThan(0);
        });

        it('should have a description', () => {
          expect(def.description).toBeTruthy();
          expect(typeof def.description).toBe('string');
        });

        it('should have pools object', () => {
          expect(def.pools).toBeDefined();
          expect(Object.keys(def.pools).length).toBeGreaterThan(0);
        });

        it('should have poolOrder array', () => {
          expect(Array.isArray(def.poolOrder)).toBe(true);
          expect(def.poolOrder.length).toBeGreaterThan(0);
        });

        it('should have maxTags greater than 0', () => {
          expect(def.maxTags).toBeGreaterThan(0);
        });

        it('should have BPM range defined', () => {
          expect(def.bpm).toBeDefined();
          expect(def.bpm?.min).toBeGreaterThan(0);
          expect(def.bpm?.max).toBeGreaterThan(def.bpm?.min ?? 0);
          expect(def.bpm?.typical).toBeGreaterThanOrEqual(def.bpm?.min ?? 0);
          expect(def.bpm?.typical).toBeLessThanOrEqual(def.bpm?.max ?? 0);
        });

        it('should have moods array with items', () => {
          expect(def.moods).toBeDefined();
          expect(Array.isArray(def.moods)).toBe(true);
          expect(def.moods?.length).toBeGreaterThan(0);
        });

        it('should have valid pool structure', () => {
          for (const [, pool] of Object.entries(def.pools)) {
            expect(pool.pick).toBeDefined();
            expect(pool.pick.min).toBeGreaterThanOrEqual(0);
            expect(pool.pick.max).toBeGreaterThanOrEqual(pool.pick.min);
            expect(Array.isArray(pool.instruments)).toBe(true);
            expect(pool.instruments.length).toBeGreaterThan(0);
          }
        });
      });
    });

    describe('BPM ranges match spec', () => {
      const expectedBpmRanges: Record<string, { min: number; max: number }> = {
        dubstep: { min: 138, max: 150 },
        drumandbass: { min: 160, max: 180 },
        idm: { min: 100, max: 160 },
        breakbeat: { min: 120, max: 140 },
        jungle: { min: 160, max: 180 },
        hardstyle: { min: 150, max: 160 },
        ukgarage: { min: 130, max: 140 },
        shoegaze: { min: 100, max: 130 },
        postpunk: { min: 120, max: 140 },
        emo: { min: 110, max: 140 },
        grunge: { min: 100, max: 130 },
        stonerrock: { min: 80, max: 120 },
        mathrock: { min: 120, max: 160 },
        darksynth: { min: 100, max: 130 },
        outrun: { min: 110, max: 130 },
        synthpop: { min: 110, max: 130 },
        celtic: { min: 80, max: 140 },
        balkan: { min: 120, max: 160 },
        middleeastern: { min: 80, max: 140 },
        afrocuban: { min: 100, max: 130 },
        bossanova: { min: 70, max: 100 },
        gospel: { min: 80, max: 130 },
        bluegrass: { min: 100, max: 160 },
        ska: { min: 130, max: 160 },
        dancehall: { min: 90, max: 110 },
      };

      Object.entries(expectedBpmRanges).forEach(([genre, expected]) => {
        it(`${genre} should have correct BPM range (${expected.min}-${expected.max})`, () => {
          const def = GENRE_REGISTRY[genre as GenreType];
          expect(def.bpm?.min).toBe(expected.min);
          expect(def.bpm?.max).toBe(expected.max);
        });
      });
    });
  });

  describe('compatibility matrix', () => {
    describe('getCompatibilityScore', () => {
      it('should return 1.0 for same genre', () => {
        expect(getCompatibilityScore('dubstep', 'dubstep')).toBe(1.0);
        expect(getCompatibilityScore('shoegaze', 'shoegaze')).toBe(1.0);
      });

      it('should return scores for related electronic genres', () => {
        expect(getCompatibilityScore('dubstep', 'drumandbass')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('dubstep', 'electronic')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('jungle', 'drumandbass')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
      });

      it('should return scores for related rock genres', () => {
        expect(getCompatibilityScore('shoegaze', 'dreampop')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('grunge', 'rock')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
        expect(getCompatibilityScore('emo', 'punk')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
      });

      it('should return scores for related synth genres', () => {
        expect(getCompatibilityScore('darksynth', 'synthwave')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('outrun', 'synthwave')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('synthpop', 'pop')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
      });

      it('should return scores for related world genres', () => {
        expect(getCompatibilityScore('celtic', 'folk')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
        expect(getCompatibilityScore('bossanova', 'jazz')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
        expect(getCompatibilityScore('afrocuban', 'latin')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
      });

      it('should return scores for related other genres', () => {
        expect(getCompatibilityScore('gospel', 'soul')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
        expect(getCompatibilityScore('bluegrass', 'country')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
        expect(getCompatibilityScore('ska', 'reggae')).toBeGreaterThanOrEqual(FUSION_THRESHOLD);
        expect(getCompatibilityScore('dancehall', 'reggae')).toBeGreaterThanOrEqual(
          FUSION_THRESHOLD
        );
      });

      it('should return low scores for incompatible genres', () => {
        // Metal and bossa nova are very different
        expect(getCompatibilityScore('metal', 'bossanova')).toBeLessThan(FUSION_THRESHOLD);
        // Hardstyle and celtic are very different
        expect(getCompatibilityScore('hardstyle', 'celtic')).toBeLessThan(FUSION_THRESHOLD);
      });

      it('should be symmetric (lookup in both directions)', () => {
        expect(getCompatibilityScore('dubstep', 'drumandbass')).toBe(
          getCompatibilityScore('drumandbass', 'dubstep')
        );
        expect(getCompatibilityScore('shoegaze', 'indie')).toBe(
          getCompatibilityScore('indie', 'shoegaze')
        );
      });
    });

    describe('canFuse', () => {
      it('should return true for same genre', () => {
        expect(canFuse('dubstep', 'dubstep')).toBe(true);
      });

      it('should return true for compatible genres', () => {
        expect(canFuse('electronic', 'dubstep')).toBe(true);
        expect(canFuse('rock', 'grunge')).toBe(true);
        expect(canFuse('jazz', 'bossanova')).toBe(true);
        expect(canFuse('reggae', 'ska')).toBe(true);
      });

      it('should return false for incompatible genres', () => {
        expect(canFuse('gospel', 'hardstyle')).toBe(false);
        expect(canFuse('bluegrass', 'dubstep')).toBe(false);
      });
    });

    describe('getCompatibleGenres', () => {
      it('should return compatible genres for dubstep', () => {
        const compatible = getCompatibleGenres('dubstep');
        expect(compatible.length).toBeGreaterThan(0);
        expect(compatible.some((c) => c.genre === 'electronic')).toBe(true);
        expect(compatible.some((c) => c.genre === 'drumandbass')).toBe(true);
      });

      it('should return compatible genres for shoegaze', () => {
        const compatible = getCompatibleGenres('shoegaze');
        expect(compatible.length).toBeGreaterThan(0);
        expect(compatible.some((c) => c.genre === 'dreampop')).toBe(true);
      });

      it('should return results sorted by score (descending)', () => {
        const compatible = getCompatibleGenres('dubstep');
        for (let i = 1; i < compatible.length; i++) {
          expect(compatible[i]!.score).toBeLessThanOrEqual(compatible[i - 1]!.score);
        }
      });
    });
  });
});
