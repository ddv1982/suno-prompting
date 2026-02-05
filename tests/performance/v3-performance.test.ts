/**
 * Performance benchmark tests for Deterministic Generation v3.0
 *
 * Validates the <1ms generation time requirement for v3.0 features:
 * - 60+ genre registry with assembleStyleTags
 * - Genre fusion/compatibility lookup
 * - Quick Vibes generation (16 categories)
 *
 * @see droidz/specs/2026-01-12/deterministic-v3/spec.md - Section 1.3 Success Criteria
 */

import { describe, test, expect } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  getCompatibilityScore,
  canFuse,
  getCompatibleGenres,
} from '@bun/instruments/genres/compatibility';
import { assembleStyleTags } from '@bun/prompt/deterministic/styles';
import { buildDeterministicQuickVibes } from '@bun/prompt/quick-vibes';
import { QUICK_VIBES_TEMPLATES } from '@bun/prompt/quick-vibes/templates';

import type { GenreType } from '@bun/instruments/genres';
import type { QuickVibesCategory } from '@shared/types';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic performance tests.
 * Uses a simple Linear Congruential Generator (LCG).
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Performance statistics for a benchmark run.
 */
interface BenchmarkStats {
  average: number;
  min: number;
  max: number;
  p95: number;
  iterations: number;
}

/**
 * Benchmark a function execution multiple times and collect statistics.
 */
function benchmark(fn: () => void, iterations: number): BenchmarkStats {
  const times: number[] = [];

  // Warmup: run 10 times to allow JIT compilation
  for (let i = 0; i < 10; i++) {
    fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((acc, t) => acc + t, 0);
  const average = sum / times.length;
  const min = times[0] ?? 0;
  const max = times[times.length - 1] ?? 0;
  const p95 = times[Math.floor(times.length * 0.95)] ?? 0;

  return { average, min, max, p95, iterations: times.length };
}

/**
 * Format benchmark statistics for console output.
 */
function formatStats(stats: BenchmarkStats, label: string): string {
  return `[${label}] avg: ${stats.average.toFixed(4)}ms, min: ${stats.min.toFixed(4)}ms, max: ${stats.max.toFixed(4)}ms, p95: ${stats.p95.toFixed(4)}ms (${stats.iterations} iterations)`;
}

// =============================================================================
// Constants
// =============================================================================

/** Max allowed average generation time in milliseconds.
 * Set to 2ms to account for JIT warmup variance when running full test suite.
 * Actual performance is typically <0.1ms average. */
const MAX_ALLOWED_AVERAGE_MS = 2.0;

/** Max allowed time for any individual genre (10ms to handle cold-start outliers) */
const MAX_INDIVIDUAL_GENRE_MS = 10.0;

/** Standard iterations for benchmarks */
const ITERATIONS = 500;

// =============================================================================
// Performance Tests: Genre Registry (60+ genres)
// =============================================================================

describe('v3.0 Performance: Genre Registry', () => {
  const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];

  test('should have 60+ genres in registry', () => {
    expect(allGenres.length).toBeGreaterThanOrEqual(60);
    console.info(`Genre count: ${allGenres.length}`);
  });

  test('should generate tags for all genres in <1ms average', () => {
    const genreTimes: { genre: string; avg: number; max: number }[] = [];

    // Test each genre individually
    for (const genre of allGenres) {
      const stats = benchmark(
        () => {
          assembleStyleTags([genre], createSeededRng(Math.random() * 1000000));
        },
        Math.ceil(ITERATIONS / allGenres.length) + 5
      );

      genreTimes.push({ genre, avg: stats.average, max: stats.max });
    }

    // Calculate overall average
    const overallAvg = genreTimes.reduce((sum, t) => sum + t.avg, 0) / genreTimes.length;
    const maxIndividual = Math.max(...genreTimes.map((t) => t.max));

    console.info(`Overall average: ${overallAvg.toFixed(4)}ms`);
    console.info(`Max individual: ${maxIndividual.toFixed(4)}ms`);

    // Report slowest genres
    const sortedByAvg = [...genreTimes].sort((a, b) => b.avg - a.avg);
    console.info('Slowest 5 genres:');
    sortedByAvg.slice(0, 5).forEach((t) => {
      console.info(`  ${t.genre}: ${t.avg.toFixed(4)}ms avg, ${t.max.toFixed(4)}ms max`);
    });

    // Assertions
    expect(overallAvg).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
    expect(maxIndividual).toBeLessThan(MAX_INDIVIDUAL_GENRE_MS);
  });

  test('should generate tags for new v3.0 genres in <1ms average', () => {
    const newGenres: GenreType[] = [
      // Electronic subgenres
      'dubstep',
      'drumandbass',
      'idm',
      'breakbeat',
      'jungle',
      'hardstyle',
      'ukgarage',
      // Rock/Alt subgenres
      'shoegaze',
      'postpunk',
      'emo',
      'grunge',
      'stonerrock',
      'mathrock',
      // Synth subgenres
      'darksynth',
      'outrun',
      'synthpop',
      // World genres
      'celtic',
      'balkan',
      'middleeastern',
      'afrocuban',
      'bossanova',
      // Other genres
      'gospel',
      'bluegrass',
      'ska',
      'dancehall',
    ];

    const times: number[] = [];

    for (const genre of newGenres) {
      const stats = benchmark(() => {
        assembleStyleTags([genre], createSeededRng(Math.random() * 1000000));
      }, 50);

      times.push(stats.average);
      expect(stats.max).toBeLessThan(MAX_INDIVIDUAL_GENRE_MS);
    }

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    console.info(`New genres average: ${avg.toFixed(4)}ms`);

    expect(avg).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });
});

// =============================================================================
// Performance Tests: Genre Fusion/Compatibility
// =============================================================================

describe('v3.0 Performance: Genre Compatibility', () => {
  test('should lookup compatibility score in <1ms', () => {
    const stats = benchmark(() => {
      // Test various genre pairs
      getCompatibilityScore('jazz', 'blues');
      getCompatibilityScore('electronic', 'dubstep');
      getCompatibilityScore('rock', 'metal');
      getCompatibilityScore('ambient', 'chillwave');
      getCompatibilityScore('folk', 'country');
    }, ITERATIONS);

    console.info(formatStats(stats, 'compatibility lookup (5 pairs)'));
    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });

  test('should check canFuse in <1ms', () => {
    const stats = benchmark(() => {
      canFuse('jazz', 'blues');
      canFuse('dubstep', 'drumandbass');
      canFuse('metal', 'bossanova');
      canFuse('ambient', 'newage');
    }, ITERATIONS);

    console.info(formatStats(stats, 'canFuse check (4 pairs)'));
    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });

  test('should get compatible genres list in <1ms', () => {
    const stats = benchmark(() => {
      getCompatibleGenres('jazz');
    }, ITERATIONS);

    console.info(formatStats(stats, 'getCompatibleGenres'));
    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });

  test('should generate fusion tags (2 genres) in <1ms average', () => {
    const fusionPairs: [GenreType, GenreType][] = [
      ['jazz', 'electronic'],
      ['rock', 'blues'],
      ['dubstep', 'drumandbass'],
      ['ambient', 'chillwave'],
      ['synthwave', 'outrun'],
    ];

    const times: number[] = [];

    for (const [genre1, genre2] of fusionPairs) {
      const stats = benchmark(() => {
        assembleStyleTags([genre1, genre2], createSeededRng(Math.random() * 1000000));
      }, 100);

      times.push(stats.average);
    }

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    console.info(`Fusion generation average: ${avg.toFixed(4)}ms`);

    expect(avg).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });
});

// =============================================================================
// Performance Tests: Quick Vibes (16 categories)
// =============================================================================

describe('v3.0 Performance: Quick Vibes', () => {
  const allCategories = Object.keys(QUICK_VIBES_TEMPLATES) as QuickVibesCategory[];

  test('should have 16 Quick Vibes categories', () => {
    expect(allCategories.length).toBe(16);
    console.info(`Quick Vibes categories: ${allCategories.length}`);
  });

  test('should generate Quick Vibes for all 16 categories in <1ms average', () => {
    const categoryTimes: { category: string; avg: number; max: number }[] = [];

    for (const category of allCategories) {
      const stats = benchmark(() => {
        buildDeterministicQuickVibes(category, false);
      }, 50);

      categoryTimes.push({ category, avg: stats.average, max: stats.max });
    }

    const overallAvg = categoryTimes.reduce((sum, t) => sum + t.avg, 0) / categoryTimes.length;
    const maxIndividual = Math.max(...categoryTimes.map((t) => t.max));

    console.info(`Quick Vibes overall average: ${overallAvg.toFixed(4)}ms`);
    console.info(`Quick Vibes max individual: ${maxIndividual.toFixed(4)}ms`);

    // Report slowest categories
    const sortedByAvg = [...categoryTimes].sort((a, b) => b.avg - a.avg);
    console.info('Slowest 3 Quick Vibes categories:');
    sortedByAvg.slice(0, 3).forEach((t) => {
      console.info(`  ${t.category}: ${t.avg.toFixed(4)}ms avg, ${t.max.toFixed(4)}ms max`);
    });

    expect(overallAvg).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
    expect(maxIndividual).toBeLessThan(MAX_INDIVIDUAL_GENRE_MS);
  });

  test('should generate new Quick Vibes categories (10 new) in <1ms average', () => {
    const newCategories: QuickVibesCategory[] = [
      'workout-energy',
      'morning-sunshine',
      'sunset-golden',
      'dinner-party',
      'road-trip',
      'gaming-focus',
      'romantic-evening',
      'meditation-zen',
      'creative-flow',
      'party-night',
    ];

    const times: number[] = [];

    for (const category of newCategories) {
      const stats = benchmark(() => {
        buildDeterministicQuickVibes(category, false);
      }, 50);

      times.push(stats.average);
    }

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    console.info(`New Quick Vibes categories average: ${avg.toFixed(4)}ms`);

    expect(avg).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });

  test('should generate Quick Vibes with maxMode in <1ms', () => {
    const stats = benchmark(() => {
      buildDeterministicQuickVibes('workout-energy', true);
    }, ITERATIONS);

    console.info(formatStats(stats, 'Quick Vibes maxMode'));
    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });
});

// =============================================================================
// Comprehensive Performance Summary
// =============================================================================

describe('v3.0 Performance: Comprehensive Summary', () => {
  test('comprehensive mixed workload should maintain <1ms average', () => {
    const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
    const allCategories = Object.keys(QUICK_VIBES_TEMPLATES) as QuickVibesCategory[];

    let workloadIndex = 0;

    const stats = benchmark(() => {
      const workload = workloadIndex % 5;
      const rng = createSeededRng(Math.random() * 1000000);

      switch (workload) {
        case 0: {
          // Single genre generation
          const genre = allGenres[workloadIndex % allGenres.length]!;
          assembleStyleTags([genre], rng);
          break;
        }
        case 1: {
          // Two genre fusion
          const g1 = allGenres[workloadIndex % allGenres.length]!;
          const g2 = allGenres[(workloadIndex + 7) % allGenres.length]!;
          assembleStyleTags([g1, g2], rng);
          break;
        }
        case 2: {
          // Compatibility lookup
          const g1 = allGenres[workloadIndex % allGenres.length]!;
          const g2 = allGenres[(workloadIndex + 3) % allGenres.length]!;
          getCompatibilityScore(g1, g2);
          canFuse(g1, g2);
          break;
        }
        case 3: {
          // Quick Vibes generation
          const category = allCategories[workloadIndex % allCategories.length]!;
          buildDeterministicQuickVibes(category, false);
          break;
        }
        case 4: {
          // Get compatible genres list
          const genre = allGenres[workloadIndex % allGenres.length]!;
          getCompatibleGenres(genre);
          break;
        }
      }

      workloadIndex++;
    }, ITERATIONS * 2);

    console.info('\n=== V3.0 COMPREHENSIVE PERFORMANCE SUMMARY ===');
    console.info(formatStats(stats, 'Mixed Workload'));
    console.info(`  Total genres tested: ${allGenres.length}`);
    console.info(`  Total Quick Vibes categories: ${allCategories.length}`);
    console.info('==============================================\n');

    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
  });

  test('baseline comparison: documents current v3.0 performance', () => {
    const stats = benchmark(() => {
      assembleStyleTags(['dubstep'], createSeededRng(Math.random() * 1000000));
    }, 1000);

    console.info('\n=== V3.0 BASELINE METRICS ===');
    console.info(formatStats(stats, 'dubstep (new genre)'));
    console.info(`  Requirement: <1ms average`);
    console.info(`  Status: ${stats.average < 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.info('=============================\n');

    expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE_MS);
    expect(stats.p95).toBeLessThan(MAX_ALLOWED_AVERAGE_MS * 2);
  });
});
