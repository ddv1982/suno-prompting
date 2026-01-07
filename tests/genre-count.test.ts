/**
 * Tests for enforceGenreCount helper function.
 *
 * This helper ensures prompts have exactly the target number of genres,
 * trimming excess genres or adding from the registry as needed.
 */

import { describe, it, expect } from 'bun:test';

import { enforceGenreCount } from '@bun/ai/creative-boost/helpers';
import { extractGenresFromPrompt } from '@bun/prompt/deterministic';

describe('enforceGenreCount', () => {
  const basePrompt = `genre: "rock"
bpm: "120"
mood: "energetic"
instruments: "guitar, drums"`;

  const twoGenrePrompt = `genre: "rock, jazz"
bpm: "110"
mood: "smooth"
instruments: "guitar, saxophone"`;

  const threeGenrePrompt = `genre: "rock, jazz, funk"
bpm: "100"
mood: "groovy"
instruments: "bass, drums"`;

  const fourGenrePrompt = `genre: "rock, jazz, funk, pop"
bpm: "90"
mood: "upbeat"`;

  describe('returns unchanged when count matches target', () => {
    it('returns unchanged when 1 genre matches target 1', () => {
      const result = enforceGenreCount(basePrompt, 1);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(1);
      expect(genres[0]).toBe('rock');
    });

    it('returns unchanged when 2 genres match target 2', () => {
      const result = enforceGenreCount(twoGenrePrompt, 2);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(2);
      expect(genres).toContain('rock');
      expect(genres).toContain('jazz');
    });

    it('returns unchanged when 3 genres match target 3', () => {
      const result = enforceGenreCount(threeGenrePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
      expect(genres).toContain('rock');
      expect(genres).toContain('jazz');
      expect(genres).toContain('funk');
    });

    it('returns unchanged when 4 genres match target 4', () => {
      const result = enforceGenreCount(fourGenrePrompt, 4);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(4);
    });
  });

  describe('trims to first N genres when count exceeds target', () => {
    it('trims 4 genres to 3', () => {
      const result = enforceGenreCount(fourGenrePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
      // Should keep first 3 genres in order
      expect(genres[0]).toBe('rock');
      expect(genres[1]).toBe('jazz');
      expect(genres[2]).toBe('funk');
    });

    it('trims 4 genres to 2', () => {
      const result = enforceGenreCount(fourGenrePrompt, 2);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(2);
      expect(genres[0]).toBe('rock');
      expect(genres[1]).toBe('jazz');
    });

    it('trims 4 genres to 1', () => {
      const result = enforceGenreCount(fourGenrePrompt, 1);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(1);
      expect(genres[0]).toBe('rock');
    });

    it('trims 3 genres to 2', () => {
      const result = enforceGenreCount(threeGenrePrompt, 2);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(2);
      expect(genres[0]).toBe('rock');
      expect(genres[1]).toBe('jazz');
    });

    it('trims 2 genres to 1', () => {
      const result = enforceGenreCount(twoGenrePrompt, 1);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(1);
      expect(genres[0]).toBe('rock');
    });
  });

  describe('adds genres from registry when count is below target', () => {
    it('adds 1 genre when 1 exists and target is 2', () => {
      const result = enforceGenreCount(basePrompt, 2);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(2);
      expect(genres[0]).toBe('rock'); // Original preserved
      // Second genre should be from registry
      expect(genres.length).toBe(2);
    });

    it('adds 2 genres when 1 exists and target is 3', () => {
      const result = enforceGenreCount(basePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
      expect(genres[0]).toBe('rock'); // Original preserved
    });

    it('adds 3 genres when 1 exists and target is 4', () => {
      const result = enforceGenreCount(basePrompt, 4);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(4);
      expect(genres[0]).toBe('rock'); // Original preserved
    });

    it('adds 1 genre when 2 exist and target is 3', () => {
      const result = enforceGenreCount(twoGenrePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
      expect(genres[0]).toBe('rock');
      expect(genres[1]).toBe('jazz');
    });

    it('adds 1 genre when 3 exist and target is 4', () => {
      const result = enforceGenreCount(threeGenrePrompt, 4);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(4);
      expect(genres[0]).toBe('rock');
      expect(genres[1]).toBe('jazz');
      expect(genres[2]).toBe('funk');
    });

    it('does not add duplicate genres', () => {
      const result = enforceGenreCount(basePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
      // All genres should be unique
      const uniqueGenres = new Set(genres);
      expect(uniqueGenres.size).toBe(3);
    });
  });

  describe('handles prompt with no genre field', () => {
    it('adds genre field when prompt has no genre', () => {
      const noGenrePrompt = `bpm: "120"
mood: "energetic"
instruments: "guitar"`;
      const result = enforceGenreCount(noGenrePrompt, 2);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(2);
      // Should have added a genre field
      expect(result).toContain('genre:');
    });

    it('adds single genre when target is 1 and no genre field exists', () => {
      const noGenrePrompt = `bpm: "100"\nmood: "calm"`;
      const result = enforceGenreCount(noGenrePrompt, 1);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(1);
    });

    it('adds 3 genres when target is 3 and no genre field exists', () => {
      const noGenrePrompt = `mood: "upbeat"\ninstruments: "drums"`;
      const result = enforceGenreCount(noGenrePrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
    });
  });

  describe('preserves other prompt fields during enforcement', () => {
    it('preserves bpm field when trimming genres', () => {
      const result = enforceGenreCount(fourGenrePrompt, 2);
      expect(result).toContain('bpm:');
      expect(result).toContain('90');
    });

    it('preserves mood field when trimming genres', () => {
      const result = enforceGenreCount(threeGenrePrompt, 1);
      expect(result).toContain('mood:');
      expect(result).toContain('groovy');
    });

    it('preserves instruments field when adding genres', () => {
      const result = enforceGenreCount(basePrompt, 3);
      expect(result).toContain('instruments:');
      expect(result).toContain('guitar');
    });

    it('preserves all fields when count matches', () => {
      const result = enforceGenreCount(twoGenrePrompt, 2);
      expect(result).toContain('bpm:');
      expect(result).toContain('mood:');
      expect(result).toContain('instruments:');
    });

    it('maintains prompt structure format (max mode)', () => {
      const maxModePrompt = `genre: "jazz, rock"
bpm: "100"
mood: "smooth"
style tags: "warm, analog"`;
      const result = enforceGenreCount(maxModePrompt, 1);
      expect(result).toContain('genre:');
      expect(result).toContain('bpm:');
      expect(result).toContain('mood:');
      expect(result).toContain('style tags:');
    });
  });

  describe('edge cases', () => {
    it('clamps target count to minimum of 1', () => {
      const result = enforceGenreCount(twoGenrePrompt, 0);
      const genres = extractGenresFromPrompt(result);
      expect(genres.length).toBeGreaterThanOrEqual(1);
    });

    it('clamps target count to maximum of 4', () => {
      const result = enforceGenreCount(basePrompt, 10);
      const genres = extractGenresFromPrompt(result);
      expect(genres.length).toBeLessThanOrEqual(4);
    });

    it('handles negative target count', () => {
      const result = enforceGenreCount(threeGenrePrompt, -1);
      const genres = extractGenresFromPrompt(result);
      expect(genres.length).toBeGreaterThanOrEqual(1);
    });

    it('handles standard mode format (capital Genre)', () => {
      const standardPrompt = `Genre: rock, jazz
BPM: 120
Mood: energetic`;
      const result = enforceGenreCount(standardPrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
    });

    it('handles whitespace in genre values', () => {
      const spacedPrompt = `genre: "  rock  ,  jazz  "
bpm: "100"`;
      const result = enforceGenreCount(spacedPrompt, 3);
      const genres = extractGenresFromPrompt(result);
      expect(genres).toHaveLength(3);
    });
  });
});
