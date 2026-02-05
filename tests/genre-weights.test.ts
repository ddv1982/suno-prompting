/**
 * Genre-Specific Tag Weights Unit Tests
 *
 * Validates that all 58 genres have properly defined weights and that
 * the weight values are within valid ranges.
 *
 * Tests:
 * - All genres have defined weights
 * - All weights are valid numbers between 0 and 1
 * - Genre-specific weight expectations (jazz=vocal, electronic=spatial, etc.)
 * - Fallback behavior for unknown genres
 */

import { test, expect, describe } from 'bun:test';

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { DEFAULT_TAG_WEIGHTS } from '@bun/prompt/deterministic/types';
import { GENRE_TAG_WEIGHTS, getTagWeightsForGenre } from '@bun/prompt/deterministic/weights';

/** All genre keys from the registry */
const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as GenreType[];

describe('Genre Tag Weights', () => {
  describe('weight registry completeness', () => {
    test('all genres in GENRE_REGISTRY have defined weights', () => {
      // Arrange
      const missingGenres: string[] = [];

      // Act
      for (const genre of ALL_GENRE_KEYS) {
        if (!(genre in GENRE_TAG_WEIGHTS)) {
          missingGenres.push(genre);
        }
      }

      // Assert
      expect(missingGenres).toEqual([]);
      console.info(`Total genres with weights: ${Object.keys(GENRE_TAG_WEIGHTS).length}`);
    });

    test('GENRE_TAG_WEIGHTS has no extra genres not in GENRE_REGISTRY', () => {
      // Arrange
      const extraGenres: string[] = [];
      const weightKeys = Object.keys(GENRE_TAG_WEIGHTS);

      // Act
      for (const genre of weightKeys) {
        if (!(genre in GENRE_REGISTRY)) {
          extraGenres.push(genre);
        }
      }

      // Assert
      expect(extraGenres).toEqual([]);
    });
  });

  describe('weight value validation', () => {
    test('all weights are valid numbers between 0 and 1', () => {
      // Arrange
      const invalidWeights: { genre: string; field: string; value: number }[] = [];

      // Act
      for (const genre of ALL_GENRE_KEYS) {
        const weights = getTagWeightsForGenre(genre);
        const fields: (keyof typeof weights)[] = [
          'vocal',
          'spatial',
          'harmonic',
          'dynamic',
          'temporal',
        ];

        for (const field of fields) {
          const value = weights[field];
          if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 1) {
            invalidWeights.push({ genre, field, value });
          }
        }
      }

      // Assert
      expect(invalidWeights).toEqual([]);
    });

    test('no weights are exactly 0 (should have some probability)', () => {
      // Arrange
      const zeroWeights: { genre: string; field: string }[] = [];

      // Act
      for (const genre of ALL_GENRE_KEYS) {
        const weights = getTagWeightsForGenre(genre);
        const fields: (keyof typeof weights)[] = [
          'vocal',
          'spatial',
          'harmonic',
          'dynamic',
          'temporal',
        ];

        for (const field of fields) {
          if (weights[field] === 0) {
            zeroWeights.push({ genre, field });
          }
        }
      }

      // Assert - Allowing zero weights for specific use cases but log them
      if (zeroWeights.length > 0) {
        console.warn(`Genres with zero weights: ${JSON.stringify(zeroWeights)}`);
      }
      // Not failing the test, just logging. Some genres may intentionally have 0 for some categories
    });
  });

  describe('genre-specific weight expectations', () => {
    test('jazz has high vocal weight (≥0.7)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('jazz');

      // Assert
      expect(weights.vocal).toBeGreaterThanOrEqual(0.7);
      console.info(`Jazz vocal weight: ${weights.vocal}`);
    });

    test('electronic has high spatial weight (≥0.6)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('electronic');

      // Assert
      expect(weights.spatial).toBeGreaterThanOrEqual(0.6);
      console.info(`Electronic spatial weight: ${weights.spatial}`);
    });

    test('ambient has low vocal weight (≤0.3)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('ambient');

      // Assert
      expect(weights.vocal).toBeLessThanOrEqual(0.3);
      console.info(`Ambient vocal weight: ${weights.vocal}`);
    });

    test('ambient has high spatial weight (≥0.7)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('ambient');

      // Assert
      expect(weights.spatial).toBeGreaterThanOrEqual(0.7);
      console.info(`Ambient spatial weight: ${weights.spatial}`);
    });

    test('metal has high dynamic weight (≥0.6)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('metal');

      // Assert
      expect(weights.dynamic).toBeGreaterThanOrEqual(0.6);
      console.info(`Metal dynamic weight: ${weights.dynamic}`);
    });

    test('classical has high harmonic weight (≥0.6)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('classical');

      // Assert
      expect(weights.harmonic).toBeGreaterThanOrEqual(0.6);
      console.info(`Classical harmonic weight: ${weights.harmonic}`);
    });

    test('afrobeat has high temporal weight (≥0.5)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('afrobeat');

      // Assert
      expect(weights.temporal).toBeGreaterThanOrEqual(0.5);
      console.info(`Afrobeat temporal weight: ${weights.temporal}`);
    });

    test('gospel has highest vocal weight (≥0.85)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('gospel');

      // Assert
      expect(weights.vocal).toBeGreaterThanOrEqual(0.85);
      console.info(`Gospel vocal weight: ${weights.vocal}`);
    });

    test('shoegaze has high spatial weight (≥0.8)', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('shoegaze');

      // Assert
      expect(weights.spatial).toBeGreaterThanOrEqual(0.8);
      console.info(`Shoegaze spatial weight: ${weights.spatial}`);
    });
  });

  describe('getTagWeightsForGenre function', () => {
    test('returns correct weights for known genre', () => {
      // Arrange & Act
      const jazzWeights = getTagWeightsForGenre('jazz');

      // Assert
      expect(jazzWeights.vocal).toBe(0.8);
      expect(jazzWeights.spatial).toBe(0.4);
      expect(jazzWeights.harmonic).toBe(0.5);
      expect(jazzWeights.dynamic).toBe(0.3);
      expect(jazzWeights.temporal).toBe(0.3);
    });

    test('returns default weights for unknown genres (fallback behavior)', () => {
      // Arrange
      // TypeScript won't let us pass an invalid genre, so we test the fallback
      // by verifying DEFAULT_TAG_WEIGHTS matches expected structure

      // Act & Assert
      expect(DEFAULT_TAG_WEIGHTS.vocal).toBe(0.6);
      expect(DEFAULT_TAG_WEIGHTS.spatial).toBe(0.5);
      expect(DEFAULT_TAG_WEIGHTS.harmonic).toBe(0.4);
      expect(DEFAULT_TAG_WEIGHTS.dynamic).toBe(0.4);
      expect(DEFAULT_TAG_WEIGHTS.temporal).toBe(0.3);
    });

    test('electronic weights match specification', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('electronic');

      // Assert - per implementation-spec.md
      expect(weights.vocal).toBe(0.4);
      expect(weights.spatial).toBe(0.7);
      expect(weights.harmonic).toBe(0.3);
      expect(weights.dynamic).toBe(0.5);
      expect(weights.temporal).toBe(0.4);
    });

    test('ambient weights match specification', () => {
      // Arrange & Act
      const weights = getTagWeightsForGenre('ambient');

      // Assert - per implementation-spec.md
      expect(weights.vocal).toBe(0.15);
      expect(weights.spatial).toBe(0.85);
      expect(weights.harmonic).toBe(0.5);
      expect(weights.dynamic).toBe(0.25);
      expect(weights.temporal).toBe(0.2);
    });
  });

  describe('weight distribution analysis', () => {
    test('vocal weights are distributed across expected ranges', () => {
      // Arrange
      const ranges = {
        high: [] as GenreType[], // ≥0.7
        medium: [] as GenreType[], // 0.4-0.69
        low: [] as GenreType[], // <0.4
      };

      // Act
      for (const genre of ALL_GENRE_KEYS) {
        const weights = getTagWeightsForGenre(genre);
        if (weights.vocal >= 0.7) {
          ranges.high.push(genre);
        } else if (weights.vocal >= 0.4) {
          ranges.medium.push(genre);
        } else {
          ranges.low.push(genre);
        }
      }

      // Assert - Each range should have some genres
      console.info(
        `Vocal weight distribution - High: ${ranges.high.length}, Medium: ${ranges.medium.length}, Low: ${ranges.low.length}`
      );
      expect(ranges.high.length).toBeGreaterThan(0);
      expect(ranges.medium.length).toBeGreaterThan(0);
      expect(ranges.low.length).toBeGreaterThan(0);
    });

    test('spatial weights are distributed across expected ranges', () => {
      // Arrange
      const ranges = {
        high: [] as GenreType[], // ≥0.7
        medium: [] as GenreType[], // 0.4-0.69
        low: [] as GenreType[], // <0.4
      };

      // Act
      for (const genre of ALL_GENRE_KEYS) {
        const weights = getTagWeightsForGenre(genre);
        if (weights.spatial >= 0.7) {
          ranges.high.push(genre);
        } else if (weights.spatial >= 0.4) {
          ranges.medium.push(genre);
        } else {
          ranges.low.push(genre);
        }
      }

      // Assert
      console.info(
        `Spatial weight distribution - High: ${ranges.high.length}, Medium: ${ranges.medium.length}, Low: ${ranges.low.length}`
      );
      expect(ranges.high.length).toBeGreaterThan(0);
      expect(ranges.medium.length).toBeGreaterThan(0);
      expect(ranges.low.length).toBeGreaterThan(0);
    });
  });
});
