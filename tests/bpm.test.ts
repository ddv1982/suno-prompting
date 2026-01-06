import { describe, it, expect } from 'bun:test';

import { GENRE_REGISTRY } from '../src/bun/instruments/genres';
import {
  getRandomBpmForGenre,
  injectBpm,
  getBlendedBpmRange,
  formatBpmRange,
  injectBpmRange,
  getRandomBpmFromRange,
  type BpmRangeResult,
} from '../src/bun/prompt/bpm';

describe('getRandomBpmForGenre', () => {
  it('returns BPM within range for known genre', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    for (let i = 0; i < 20; i++) {
      const bpm = getRandomBpmForGenre('jazz');
      expect(bpm).not.toBeNull();
      expect(bpm).toBeGreaterThanOrEqual(jazzBpm!.min);
      expect(bpm).toBeLessThanOrEqual(jazzBpm!.max);
    }
  });

  it('returns null for unknown genre', () => {
    const bpm = getRandomBpmForGenre('unknowngenre');
    expect(bpm).toBeNull();
  });

  it('handles multi-word genres like "jazz fusion"', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    const bpm = getRandomBpmForGenre('jazz fusion');
    expect(bpm).not.toBeNull();
    expect(bpm).toBeGreaterThanOrEqual(jazzBpm!.min);
    expect(bpm).toBeLessThanOrEqual(jazzBpm!.max);
  });

  it('handles comma-separated genres like "jazz, rock"', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    const bpm = getRandomBpmForGenre('jazz, rock');
    expect(bpm).not.toBeNull();
    expect(bpm).toBeGreaterThanOrEqual(jazzBpm!.min);
    expect(bpm).toBeLessThanOrEqual(jazzBpm!.max);
  });

  it('produces variety across multiple calls', () => {
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const bpm = getRandomBpmForGenre('jazz');
      if (bpm) results.add(bpm);
    }
    // Jazz range is 72-140, should get at least some variety
    expect(results.size).toBeGreaterThan(5);
  });

  it('handles case insensitivity', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    const bpm1 = getRandomBpmForGenre('JAZZ');
    const bpm2 = getRandomBpmForGenre('Jazz');
    const bpm3 = getRandomBpmForGenre('jazz');
    
    // All should return valid BPM within range (function converts to lowercase)
    expect(bpm1).not.toBeNull();
    expect(bpm1).toBeGreaterThanOrEqual(jazzBpm!.min);
    expect(bpm1).toBeLessThanOrEqual(jazzBpm!.max);
    
    expect(bpm2).not.toBeNull();
    expect(bpm3).not.toBeNull();
  });
});

describe('injectBpm', () => {
  it('replaces BPM in normal mode format', () => {
    const prompt = 'Genre: jazz\nBPM: 96\nMood: smooth';
    const result = injectBpm(prompt, 'punk'); // Punk has range 150-200
    
    const bpmMatch = result.match(/BPM: (\d+)/);
    expect(bpmMatch).not.toBeNull();
    
    const bpm = parseInt(bpmMatch![1]!, 10);
    expect(bpm).toBeGreaterThanOrEqual(150);
    expect(bpm).toBeLessThanOrEqual(200);
  });

  it('replaces BPM in max mode format', () => {
    const prompt = 'genre: "jazz"\nbpm: "96"\nmood: "smooth"';
    const result = injectBpm(prompt, 'punk');
    
    const bpmMatch = result.match(/bpm: "(\d+)"/);
    expect(bpmMatch).not.toBeNull();
    
    const bpm = parseInt(bpmMatch![1]!, 10);
    expect(bpm).toBeGreaterThanOrEqual(150);
    expect(bpm).toBeLessThanOrEqual(200);
  });

  it('returns unchanged prompt for unknown genre', () => {
    const prompt = 'Genre: jazz\nBPM: 96\nMood: smooth';
    const result = injectBpm(prompt, 'unknowngenre');
    expect(result).toBe(prompt);
  });

  it('returns unchanged prompt if no BPM line found', () => {
    const prompt = 'Genre: jazz\nMood: smooth';
    const result = injectBpm(prompt, 'punk');
    expect(result).toBe(prompt);
  });

  it('extracts base genre from multi-word genre', () => {
    const prompt = 'Genre: jazz fusion\nBPM: 120\nMood: smooth';
    const result = injectBpm(prompt, 'jazz fusion');
    
    const bpmMatch = result.match(/BPM: (\d+)/);
    expect(bpmMatch).not.toBeNull();
    
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    const bpm = parseInt(bpmMatch![1]!, 10);
    expect(bpm).toBeGreaterThanOrEqual(jazzBpm!.min);
    expect(bpm).toBeLessThanOrEqual(jazzBpm!.max);
  });
});

// ========================================
// New BPM Range Blending Tests
// ========================================

describe('getBlendedBpmRange', () => {
  it('returns single genre range for single genre', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    const result = getBlendedBpmRange('jazz');
    expect(result).not.toBeNull();
    expect(result!.min).toBe(jazzBpm!.min);
    expect(result!.max).toBe(jazzBpm!.max);
    expect(result!.isIntersection).toBe(true);
  });

  it('returns intersection for overlapping genres (jazz rock)', () => {
    // Jazz: 80-160, Rock: 100-160
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    const rockBpm = GENRE_REGISTRY.rock?.bpm;
    expect(jazzBpm).toBeDefined();
    expect(rockBpm).toBeDefined();
    
    const result = getBlendedBpmRange('jazz rock');
    expect(result).not.toBeNull();
    
    // Intersection: max of mins, min of maxes
    const expectedMin = Math.max(jazzBpm!.min, rockBpm!.min);
    const expectedMax = Math.min(jazzBpm!.max, rockBpm!.max);
    
    expect(result!.min).toBe(expectedMin);
    expect(result!.max).toBe(expectedMax);
    expect(result!.isIntersection).toBe(true);
  });

  it('returns expanded range for non-overlapping genres (ambient punk)', () => {
    // Ambient: 50-80, Punk: 160-200
    const ambientBpm = GENRE_REGISTRY.ambient?.bpm;
    const punkBpm = GENRE_REGISTRY.punk?.bpm;
    expect(ambientBpm).toBeDefined();
    expect(punkBpm).toBeDefined();
    
    const result = getBlendedBpmRange('ambient punk');
    expect(result).not.toBeNull();
    expect(result!.isIntersection).toBe(false);
    
    // Should be narrowed around midpoint, within union bounds
    expect(result!.min).toBeGreaterThanOrEqual(ambientBpm!.min);
    expect(result!.max).toBeLessThanOrEqual(punkBpm!.max);
    
    // Verify midpoint narrowing (midpoint of 50-200 is 125, so expect ~95-155)
    expect(result!.min).toBeLessThan(result!.max);
  });

  it('handles comma-separated genres', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    const rockBpm = GENRE_REGISTRY.rock?.bpm;
    expect(jazzBpm).toBeDefined();
    expect(rockBpm).toBeDefined();
    
    const result = getBlendedBpmRange('jazz, rock');
    expect(result).not.toBeNull();
    
    const expectedMin = Math.max(jazzBpm!.min, rockBpm!.min);
    const expectedMax = Math.min(jazzBpm!.max, rockBpm!.max);
    
    expect(result!.min).toBe(expectedMin);
    expect(result!.max).toBe(expectedMax);
  });

  it('returns null for unrecognized genres', () => {
    const result = getBlendedBpmRange('unknowngenre');
    expect(result).toBeNull();
  });

  it('returns null for empty genre string', () => {
    const result = getBlendedBpmRange('');
    expect(result).toBeNull();
  });

  it('handles three or more genres', () => {
    // Jazz: 80-160, Rock: 100-160, Pop: 100-130
    const result = getBlendedBpmRange('jazz rock pop');
    expect(result).not.toBeNull();
    
    // Intersection of all three
    expect(result!.min).toBe(100); // max(80, 100, 100)
    expect(result!.max).toBe(130); // min(160, 160, 130)
    expect(result!.isIntersection).toBe(true);
  });

  it('handles hyphen-separated genres', () => {
    const result = getBlendedBpmRange('jazz-rock');
    expect(result).not.toBeNull();
    expect(result!.min).toBe(100);
    expect(result!.max).toBe(160);
  });

  it('handles case insensitivity', () => {
    const result1 = getBlendedBpmRange('JAZZ');
    const result2 = getBlendedBpmRange('Jazz');
    const result3 = getBlendedBpmRange('jazz');
    
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });
});

describe('formatBpmRange', () => {
  it('formats range correctly', () => {
    const result: BpmRangeResult = { min: 100, max: 160, isIntersection: true };
    expect(formatBpmRange(result)).toBe('between 100 and 160');
  });

  it('formats non-intersection range correctly', () => {
    const result: BpmRangeResult = { min: 80, max: 160, isIntersection: false };
    expect(formatBpmRange(result)).toBe('between 80 and 160');
  });

  it('formats single BPM range', () => {
    const result: BpmRangeResult = { min: 120, max: 120, isIntersection: true };
    expect(formatBpmRange(result)).toBe('between 120 and 120');
  });
});

describe('injectBpmRange', () => {
  it('replaces BPM in normal mode format with range', () => {
    const prompt = 'Genre: jazz rock\nBPM: 120\nMood: smooth';
    const result = injectBpmRange(prompt, 'jazz rock');
    
    expect(result).toContain('BPM: between');
    expect(result).toContain(' and ');
    expect(result).not.toContain('BPM: 120');
  });

  it('replaces BPM in max mode format with range', () => {
    const prompt = 'genre: "jazz rock"\nbpm: "120"\nmood: "smooth"';
    const result = injectBpmRange(prompt, 'jazz rock');
    
    expect(result).toContain('bpm: "between');
    expect(result).toContain(' and ');
    expect(result).not.toContain('bpm: "120"');
  });

  it('returns unchanged prompt for unknown genre', () => {
    const prompt = 'Genre: unknown\nBPM: 120\nMood: smooth';
    const result = injectBpmRange(prompt, 'unknowngenre');
    expect(result).toBe(prompt);
  });

  it('returns unchanged prompt if no BPM line found', () => {
    const prompt = 'Genre: jazz rock\nMood: smooth';
    const result = injectBpmRange(prompt, 'jazz rock');
    expect(result).toBe(prompt);
  });

  it('produces correct range values for jazz rock', () => {
    const prompt = 'Genre: jazz rock\nBPM: 120\nMood: smooth';
    const result = injectBpmRange(prompt, 'jazz rock');
    
    // Jazz: 80-160, Rock: 100-160 → Intersection: 100-160
    expect(result).toContain('BPM: between 100 and 160');
  });

  it('handles max mode format correctly', () => {
    const prompt = 'genre: "jazz"\nbpm: "96"\nmood: "smooth"';
    const result = injectBpmRange(prompt, 'jazz');
    
    // Jazz: 80-160
    expect(result).toContain('bpm: "between 80 and 160"');
  });
});

describe('getRandomBpmFromRange', () => {
  it('returns BPM within blended range', () => {
    // Jazz: 80-160, Rock: 100-160 → 100-160
    for (let i = 0; i < 20; i++) {
      const bpm = getRandomBpmFromRange('jazz rock');
      expect(bpm).not.toBeNull();
      expect(bpm).toBeGreaterThanOrEqual(100);
      expect(bpm).toBeLessThanOrEqual(160);
    }
  });

  it('returns null for unrecognized genre', () => {
    const bpm = getRandomBpmFromRange('unknowngenre');
    expect(bpm).toBeNull();
  });

  it('uses provided RNG function', () => {
    // Mock RNG that always returns 0
    const mockRng = () => 0;
    const bpm = getRandomBpmFromRange('jazz', mockRng);
    
    // With rng=0, should get minimum of range
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(bpm).toBe(jazzBpm!.min);
  });

  it('uses provided RNG for upper bound', () => {
    // Mock RNG that always returns 0.999...
    const mockRng = () => 0.999999;
    const bpm = getRandomBpmFromRange('jazz', mockRng);
    
    // With rng≈1, should get maximum of range
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(bpm).toBe(jazzBpm!.max);
  });

  it('produces variety across multiple calls', () => {
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const bpm = getRandomBpmFromRange('jazz rock');
      if (bpm) results.add(bpm);
    }
    // Range is 100-160 (61 values), should get variety
    expect(results.size).toBeGreaterThan(5);
  });

  it('handles single genre like original function', () => {
    const jazzBpm = GENRE_REGISTRY.jazz?.bpm;
    expect(jazzBpm).toBeDefined();
    
    for (let i = 0; i < 20; i++) {
      const bpm = getRandomBpmFromRange('jazz');
      expect(bpm).not.toBeNull();
      expect(bpm).toBeGreaterThanOrEqual(jazzBpm!.min);
      expect(bpm).toBeLessThanOrEqual(jazzBpm!.max);
    }
  });
});
