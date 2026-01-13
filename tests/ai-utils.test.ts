import { describe, expect, test } from 'bun:test';

import { cleanLyrics, cleanTitle } from '@bun/ai/utils';

describe('cleanTitle', () => {
  test('removes double quotes from title', () => {
    expect(cleanTitle('"My Song"')).toBe('My Song');
  });

  test('removes single quotes from title', () => {
    expect(cleanTitle("'My Song'")).toBe('My Song');
  });

  test('trims whitespace', () => {
    expect(cleanTitle('  My Song  ')).toBe('My Song');
  });

  test('handles both quotes and whitespace', () => {
    expect(cleanTitle('  "My Song"  ')).toBe('My Song');
  });

  test('returns fallback for undefined', () => {
    expect(cleanTitle(undefined)).toBe('Untitled');
  });

  test('returns fallback for empty string', () => {
    expect(cleanTitle('')).toBe('Untitled');
  });

  test('uses custom fallback', () => {
    expect(cleanTitle(undefined, 'Default')).toBe('Default');
  });

  test('preserves internal quotes', () => {
    expect(cleanTitle('"It\'s a "Song""')).toBe("It's a \"Song\"");
  });
});

describe('cleanLyrics', () => {
  test('trims whitespace', () => {
    expect(cleanLyrics('  [VERSE]\nHello  ')).toBe('[VERSE]\nHello');
  });

  test('returns undefined for empty string', () => {
    expect(cleanLyrics('')).toBeUndefined();
  });

  test('returns undefined for undefined', () => {
    expect(cleanLyrics(undefined)).toBeUndefined();
  });

  test('returns undefined for whitespace only', () => {
    expect(cleanLyrics('   ')).toBeUndefined();
  });

  test('preserves internal whitespace', () => {
    expect(cleanLyrics('[VERSE]\n  Line 1\n  Line 2')).toBe('[VERSE]\n  Line 1\n  Line 2');
  });
});

