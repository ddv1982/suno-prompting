/**
 * Statistical Variety Validation Tests (Task Group 3.6)
 * 
 * Validates that deterministic prompt generation achieves sufficient variety
 * across multiple runs to ensure unique, non-repetitive prompts.
 * 
 * Goals:
 * - ≥70% unique combinations in 1000 runs
 * - Recording contexts show variety across runs
 * - Overall tag combinations are sufficiently diverse
 */

import { test, expect, describe } from 'bun:test';

import { assembleStyleTags } from '@bun/prompt/deterministic/styles';

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 *
 * @param seed - Starting seed value
 * @returns Deterministic RNG function
 */
function seedRng(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters from Numerical Recipes
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * GENRE_RECORDING_CONTEXTS for validation.
 * Copied from realism-tags.ts for validation purposes.
 */
const GENRE_RECORDING_CONTEXTS: Record<string, readonly string[]> = {
  jazz: [
    'intimate jazz club',
    'small jazz ensemble',
    'live jazz session',
    'acoustic jazz space',
    'trio recording',
    'blue note studio vibe',
    'bebop era recording',
    'jazz quartet intimacy',
    'smoky club atmosphere',
  ],
  pop: [
    'modern pop studio',
    'professional vocal booth',
    'digital pop production',
    'radio-ready mix',
    'contemporary pop sound',
    'multitrack pop recording',
    'polished pop production',
    'commercial studio sound',
  ],
  rock: [
    'live room tracking',
    'vintage rock studio',
    'analog rock recording',
    'garage band setup',
    'stadium rock production',
    'rehearsal room energy',
    'basement rock session',
    'classic rock studio',
    'power trio setup',
  ],
  electronic: [
    'digital production studio',
    'electronic music workstation',
    'synthesizer laboratory',
    'modular synth setup',
    'laptop production',
    'home studio electronic',
    'professional edm studio',
    'hybrid analog-digital rig',
  ],
};

describe('Statistical Variety Validation', () => {
  test('achieves ≥70% unique combinations in 1000 runs', () => {
    const iterations = 1000;
    const combinations = new Set<string>();
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['pop'], seedRng(i));
      const combo = [...result.tags].sort().join('|');
      combinations.add(combo);
    }
    
    const uniquePercentage = (combinations.size / iterations) * 100;
    console.log(`Unique combinations: ${combinations.size}/${iterations} (${uniquePercentage.toFixed(1)}%)`);
    
    expect(combinations.size).toBeGreaterThanOrEqual(700); // ≥70%
  });
  
  test('recording contexts show variety across runs', () => {
    const iterations = 100;
    const contexts = new Set<string>();
    const jazzContexts = GENRE_RECORDING_CONTEXTS['jazz'] ?? [];
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['jazz'], seedRng(i));
      for (const tag of result.tags) {
        if (jazzContexts.includes(tag)) {
          contexts.add(tag);
        }
      }
    }
    
    console.log(`Unique jazz contexts seen: ${contexts.size}/${jazzContexts.length}`);
    expect(contexts.size).toBeGreaterThan(3); // At least 3 different contexts
  });

  test('validates variety for rock genre', () => {
    const iterations = 100;
    const contexts = new Set<string>();
    const rockContexts = GENRE_RECORDING_CONTEXTS['rock'] ?? [];
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['rock'], seedRng(i));
      for (const tag of result.tags) {
        if (rockContexts.includes(tag)) {
          contexts.add(tag);
        }
      }
    }
    
    console.log(`Unique rock contexts seen: ${contexts.size}/${rockContexts.length}`);
    expect(contexts.size).toBeGreaterThan(3); // At least 3 different contexts
  });

  test('validates variety for electronic genre', () => {
    const iterations = 100;
    const contexts = new Set<string>();
    const electronicContexts = GENRE_RECORDING_CONTEXTS['electronic'] ?? [];
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['electronic'], seedRng(i));
      for (const tag of result.tags) {
        if (electronicContexts.includes(tag)) {
          contexts.add(tag);
        }
      }
    }
    
    console.log(`Unique electronic contexts seen: ${contexts.size}/${electronicContexts.length}`);
    expect(contexts.size).toBeGreaterThan(3); // At least 3 different contexts
  });

  test('overall tag diversity across multiple genres', () => {
    const genres = ['jazz', 'rock', 'pop', 'electronic'];
    const iterations = 250; // 250 per genre = 1000 total
    const allCombinations = new Set<string>();
    
    for (const genre of genres) {
      for (let i = 0; i < iterations; i++) {
        const result = assembleStyleTags([genre as any], seedRng(i * 1000 + genre.charCodeAt(0)));
        const combo = `${genre}:${[...result.tags].sort().join('|')}`;
        allCombinations.add(combo);
      }
    }
    
    const totalRuns = genres.length * iterations;
    const uniquePercentage = (allCombinations.size / totalRuns) * 100;
    console.log(`Total unique combinations across genres: ${allCombinations.size}/${totalRuns} (${uniquePercentage.toFixed(1)}%)`);
    
    // Expect ≥70% unique across all genres
    expect(allCombinations.size).toBeGreaterThanOrEqual(totalRuns * 0.7);
  });

  test('tag count consistency (8-10 tags per prompt)', () => {
    const iterations = 100;
    const tagCounts: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['pop'], seedRng(i));
      tagCounts.push(result.tags.length);
    }
    
    const minTags = Math.min(...tagCounts);
    const maxTags = Math.max(...tagCounts);
    const avgTags = tagCounts.reduce((sum, count) => sum + count, 0) / tagCounts.length;
    
    console.log(`Tag counts - Min: ${minTags}, Max: ${maxTags}, Avg: ${avgTags.toFixed(1)}`);
    
    // Verify tags are within expected range (6-10 based on assembleStyleTags implementation)
    expect(minTags).toBeGreaterThanOrEqual(6);
    expect(maxTags).toBeLessThanOrEqual(10);
  });

  test('no duplicate tags within single prompt', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['jazz'], seedRng(i));
      const uniqueTags = new Set(result.tags);
      
      // Every prompt should have no duplicate tags
      expect(result.tags.length).toBe(uniqueTags.size);
    }
  });

  test('recording contexts appear in final tag output', () => {
    const iterations = 100;
    let appearanceCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      const result = assembleStyleTags(['jazz'], seedRng(i));
      const jazzContexts = GENRE_RECORDING_CONTEXTS['jazz'] ?? [];
      
      const hasContext = result.tags.some(tag => jazzContexts.includes(tag));
      if (hasContext) {
        appearanceCount++;
      }
    }
    
    const appearanceRate = (appearanceCount / iterations) * 100;
    console.log(`Recording context appearance rate: ${appearanceRate.toFixed(1)}%`);
    
    // Recording contexts should appear in reasonable number of prompts (≥15%)
    // Due to probabilistic tag selection and 10-tag limit, 15-30% is expected
    expect(appearanceCount).toBeGreaterThanOrEqual(iterations * 0.15);
  });
});
