import { describe, expect, test } from 'bun:test';

import { extractKeywords } from '@bun/prompt/title';

describe('Keyword Extraction for Topic-Aware Titles', () => {
  describe('extractKeywords', () => {
    test('extracts time-related keywords', () => {
      const result = extractKeywords('A song about midnight and the stars');
      expect(result.time).toBeDefined();
      expect(result.time).toContain('Midnight');
      expect(result.time).toContain('Night');
    });

    test('extracts nature-related keywords', () => {
      const result = extractKeywords('Walking by the ocean during a storm');
      expect(result.nature).toBeDefined();
      expect(result.nature).toContain('Ocean');
      expect(result.nature).toContain('Storm');
    });

    test('extracts emotion-related keywords', () => {
      const result = extractKeywords('A story about lost love and broken hearts');
      expect(result.emotion).toBeDefined();
      expect(result.emotion).toContain('Lost');
      expect(result.emotion).toContain('Love');
      expect(result.emotion).toContain('Heart');
    });

    test('extracts action-related keywords', () => {
      const result = extractKeywords('Running away, falling down, rising again');
      expect(result.action).toBeDefined();
      expect(result.action).toContain('Running');
      expect(result.action).toContain('Falling');
      expect(result.action).toContain('Rising');
    });

    test('extracts abstract-related keywords', () => {
      const result = extractKeywords('Searching for freedom and inner peace');
      expect(result.abstract).toBeDefined();
      expect(result.abstract).toContain('Freedom');
      expect(result.abstract).toContain('Serenity');
    });

    test('extracts multiple categories from complex description', () => {
      const result = extractKeywords('A midnight walk by the ocean, feeling lost and alone, searching for peace');
      expect(result.time).toBeDefined();
      expect(result.nature).toBeDefined();
      expect(result.emotion).toBeDefined();
      expect(result.abstract).toBeDefined();
      
      expect(result.time).toContain('Midnight');
      expect(result.nature).toContain('Ocean');
      expect(result.emotion).toContain('Lost');
      expect(result.abstract).toContain('Serenity');
    });

    test('returns empty object for empty description', () => {
      const result = extractKeywords('');
      expect(Object.keys(result).length).toBe(0);
    });

    test('returns empty object for undefined description', () => {
      const result = extractKeywords(undefined);
      expect(Object.keys(result).length).toBe(0);
    });

    test('handles case-insensitive matching', () => {
      const result = extractKeywords('MIDNIGHT OCEAN LOVE');
      expect(result.time).toContain('Midnight');
      expect(result.nature).toContain('Ocean');
      expect(result.emotion).toContain('Love');
    });

    test('deduplicates keywords within categories', () => {
      const result = extractKeywords('midnight night midnight stars night');
      expect(result.time).toBeDefined();
      // Should not have duplicates
      const timeWords = result.time ?? [];
      const uniqueWords = new Set(timeWords);
      expect(uniqueWords.size).toBe(timeWords.length);
    });

    test('maps sunset to appropriate time words', () => {
      const result = extractKeywords('watching the sunset');
      expect(result.time).toBeDefined();
      expect(result.time).toContain('Sunset');
      expect(result.time).toContain('Dusk');
      expect(result.time).toContain('Twilight');
    });

    test('maps heartbreak to emotion words', () => {
      const result = extractKeywords('dealing with heartbreak and pain');
      expect(result.emotion).toBeDefined();
      expect(result.emotion).toContain('Heart');
      expect(result.emotion).toContain('Cry');
      expect(result.emotion).toContain('Shadow');
      expect(result.emotion).toContain('Lost');
    });

    test('maps urban/city themes to nature category', () => {
      const result = extractKeywords('life in the city under urban lights');
      expect(result.nature).toBeDefined();
      expect(result.nature).toContain('Sky');
      expect(result.nature).toContain('Fire');
    });
  });
});
