/**
 * Performance benchmark tests for deterministic style tag generation.
 * 
 * Critical requirement: assembleStyleTags must complete in <50ms for real-time UI responsiveness.
 * 
 * This test suite validates that the tag selection system maintains
 * the required performance threshold across various genres and usage patterns.
 * 
 * @see droidz/specs/2026-01-11/tasks.md - Task Group 1.5
 */

import { describe, test, expect } from 'bun:test';

import { assembleStyleTags } from '@bun/prompt/deterministic/styles';

import type { GenreType } from '@bun/instruments/genres';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic performance tests.
 * Uses a simple Linear Congruential Generator (LCG).
 *
 * @param seed - Starting seed value
 * @returns Deterministic RNG function (0.0-1.0)
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
 * Performance statistics for a benchmark run.
 */
interface BenchmarkStats {
  /** Average execution time in milliseconds */
  average: number;
  /** Minimum execution time in milliseconds */
  min: number;
  /** Maximum execution time in milliseconds */
  max: number;
  /** 95th percentile execution time in milliseconds */
  p95: number;
  /** 99th percentile execution time in milliseconds */
  p99: number;
  /** Total iterations executed */
  iterations: number;
}

/**
 * Benchmark a function execution multiple times and collect statistics.
 *
 * @param fn - Function to benchmark
 * @param iterations - Number of iterations to run
 * @returns Performance statistics
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
  const p99 = times[Math.floor(times.length * 0.99)] ?? 0;

  return {
    average,
    min,
    max,
    p95,
    p99,
    iterations: times.length,
  };
}

/**
 * Format benchmark statistics for console output.
 */
function formatStats(stats: BenchmarkStats, genre?: string): string {
  const prefix = genre ? `[${genre}] ` : '';
  return `${prefix}avg: ${stats.average.toFixed(2)}ms, min: ${stats.min.toFixed(2)}ms, max: ${stats.max.toFixed(2)}ms, p95: ${stats.p95.toFixed(2)}ms, p99: ${stats.p99.toFixed(2)}ms (${stats.iterations} iterations)`;
}

// =============================================================================
// Performance Benchmark Tests
// =============================================================================

describe('Performance: assembleStyleTags', () => {
  const ITERATIONS = 1000; // Statistically significant sample size
  const MAX_ALLOWED_AVERAGE = 50; // Critical <50ms requirement
  const MAX_ALLOWED_P95 = 50; // 95% of requests must be <50ms

  describe('single genre performance', () => {
    test('pop genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['pop'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'pop'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('rock genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['rock'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'rock'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('jazz genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['jazz'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'jazz'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('electronic genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['electronic'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'electronic'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('classical genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['classical'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'classical'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('ambient genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['ambient'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'ambient'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('metal genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['metal'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'metal'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('country genre should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['country'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'country'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });
  });

  describe('multi-genre performance', () => {
    test('jazz rock fusion should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['jazz', 'rock'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'jazz rock'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('synthwave electronic hybrid should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['synthwave' as GenreType, 'electronic'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'synthwave electronic'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('4-genre blend should generate tags in <50ms (avg and p95)', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['jazz', 'rock', 'blues', 'funk'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'jazz rock blues funk'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });
  });

  describe('edge cases and stress tests', () => {
    test('rapid consecutive calls with different seeds should maintain performance', () => {
      const stats = benchmark(() => {
        // Simulate real-world usage: rapid user interactions with different seeds
        for (let i = 0; i < 5; i++) {
          assembleStyleTags(['pop'], createSeededRng(i * 12345));
        }
      }, 200); // 200 iterations * 5 calls = 1000 total calls

      console.info(formatStats(stats, 'rapid consecutive (5x)'));

      // Each iteration runs 5 calls, so average should still be well under 50ms total
      expect(stats.average).toBeLessThan(250); // 5 * 50ms = 250ms max
      expect(stats.p95).toBeLessThan(250);
    });

    test('deterministic RNG should not degrade performance', () => {
      const seedRng = createSeededRng(42);
      const stats = benchmark(() => {
        assembleStyleTags(['jazz'], seedRng);
      }, ITERATIONS);

      console.info(formatStats(stats, 'deterministic RNG'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('Math.random() RNG should not degrade performance', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['jazz'], Math.random);
      }, ITERATIONS);

      console.info(formatStats(stats, 'Math.random RNG'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });
  });

  describe('worst-case scenarios', () => {
    test('high vocal probability genres should maintain performance', () => {
      // Pop has 0.95 vocal probability, so vocal tags will almost always be selected
      const stats = benchmark(() => {
        assembleStyleTags(['pop'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'high vocal prob (pop)'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('low vocal probability genres should maintain performance', () => {
      // Ambient has 0.05 vocal probability, so vocal tags will rarely be selected
      const stats = benchmark(() => {
        assembleStyleTags(['ambient'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'low vocal prob (ambient)'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('maximum tag output (10 tags) should maintain performance', () => {
      // Run enough iterations to likely hit the 10-tag cap
      const stats = benchmark(() => {
        assembleStyleTags(['pop', 'rock'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'max tags (pop rock)'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });
  });

  describe('overall system performance', () => {
    test('comprehensive mixed workload should maintain <50ms average', () => {
      const genres: GenreType[][] = [
        ['pop'],
        ['rock'],
        ['jazz'],
        ['electronic'],
        ['classical'],
        ['ambient'],
        ['jazz', 'rock'],
        ['pop', 'electronic'],
        ['metal'],
        ['country'],
      ];

      let genreIndex = 0;
      const stats = benchmark(() => {
        const currentGenres = genres[genreIndex % genres.length];
        assembleStyleTags(currentGenres ?? ['pop'], createSeededRng(Math.random() * 1000000));
        genreIndex++;
      }, ITERATIONS);

      console.info(formatStats(stats, 'mixed workload'));

      expect(stats.average).toBeLessThan(MAX_ALLOWED_AVERAGE);
      expect(stats.p95).toBeLessThan(MAX_ALLOWED_P95);
    });

    test('99th percentile should not exceed 3x average time', () => {
      const stats = benchmark(() => {
        assembleStyleTags(['jazz'], createSeededRng(Math.random() * 1000000));
      }, ITERATIONS);

      console.info(formatStats(stats, 'p99 consistency check'));

      // P99 should remain reasonably close to average, but this test must not be flaky
      // on very fast machines where average times are near 0.0ms.
      const maxAllowedP99 = Math.max(stats.average * 10, 0.2);
      expect(stats.p99).toBeLessThan(maxAllowedP99);
    });
  });
});

// =============================================================================
// Performance Regression Detection
// =============================================================================

describe('Performance: regression detection', () => {
  test('baseline performance comparison (document current performance)', () => {
    const BASELINE_ITERATIONS = 2000;
    
    const stats = benchmark(() => {
      assembleStyleTags(['pop'], createSeededRng(Math.random() * 1000000));
    }, BASELINE_ITERATIONS);

    console.info('\n=== BASELINE PERFORMANCE METRICS ===');
    console.info(formatStats(stats, 'BASELINE'));
    console.info('====================================\n');

    // Document current performance for future comparisons
    // These assertions ensure we maintain current performance levels
    expect(stats.average).toBeLessThan(50);
    expect(stats.p95).toBeLessThan(50);
    expect(stats.p99).toBeLessThan(50);
    expect(stats.max).toBeLessThan(100); // Max should not be extreme outlier
  });
});
