import { describe, it, expect } from 'bun:test';
import { getRandomBpmForGenre, injectBpm } from '../src/bun/prompt/bpm';
import { GENRE_REGISTRY } from '../src/bun/instruments/genres';

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
