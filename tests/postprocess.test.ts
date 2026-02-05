import { describe, it, expect } from 'bun:test';

import {
  truncateToLimit,
  detectRepeatedWords,
  validateAndFixFormat,
  hasLeakedMeta,
  postProcessPrompt,
  stripMetaDeterministic,
  dedupDeterministic,
  LEAKED_META_SUBSTRINGS,
  type PostProcessDeps,
} from '@bun/prompt/postprocess';

describe('postprocess', () => {
  describe('truncateToLimit', () => {
    it('returns text unchanged if under limit', () => {
      const text = 'Short text';
      expect(truncateToLimit(text, 100)).toBe(text);
    });

    it('returns text unchanged if exactly at limit', () => {
      const text = 'a'.repeat(100);
      expect(truncateToLimit(text, 100)).toBe(text);
    });

    it('truncates text over limit with ellipsis', () => {
      const text = 'a'.repeat(150);
      const result = truncateToLimit(text, 100);
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.endsWith('...')).toBe(true);
    });

    it('breaks at newline when possible', () => {
      const text = 'Line one\nLine two is longer than the first\nLine three';
      const result = truncateToLimit(text, 30);
      expect(result.endsWith('...')).toBe(true);
    });

    it('breaks at comma when possible', () => {
      const text = 'item one, item two, item three, item four';
      const result = truncateToLimit(text, 25);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('detectRepeatedWords', () => {
    it('returns empty array for no repetitions', () => {
      expect(detectRepeatedWords('one two three four')).toEqual([]);
    });

    it('detects repeated words', () => {
      const result = detectRepeatedWords('hello world hello again');
      expect(result).toContain('hello');
    });

    it('ignores short words under 4 characters', () => {
      const result = detectRepeatedWords('the the the and and');
      expect(result).toEqual([]);
    });

    it('is case-insensitive', () => {
      const result = detectRepeatedWords('Hello world HELLO again');
      expect(result).toContain('hello');
    });

    it('handles punctuation as separators', () => {
      const result = detectRepeatedWords('hello, world; hello. again');
      expect(result).toContain('hello');
    });

    it('returns multiple repeated words', () => {
      const result = detectRepeatedWords('guitar drums guitar piano drums bass');
      expect(result).toContain('guitar');
      expect(result).toContain('drums');
    });
  });

  describe('validateAndFixFormat', () => {
    it('returns text unchanged if starts with bracket', () => {
      const text = '[Mood, Genre, Key: C Major]\nContent here';
      expect(validateAndFixFormat(text)).toBe(text);
    });

    it('adds bracket tag for text without one', () => {
      const text = 'Genre: Jazz\nMood: Relaxing\nContent';
      const result = validateAndFixFormat(text);
      expect(result.startsWith('[')).toBe(true);
      expect(result).toContain('Jazz');
      expect(result).toContain('Relaxing');
    });

    it('uses default genre when not found', () => {
      const text = 'Mood: Happy\nSome content';
      const result = validateAndFixFormat(text);
      expect(result).toContain('Cinematic');
    });

    it('uses default mood when not found', () => {
      const text = 'Genre: Rock\nSome content';
      const result = validateAndFixFormat(text);
      expect(result).toContain('Evocative');
    });

    it('extracts first mood word before comma', () => {
      const text = 'Mood: Dreamy, Ethereal, Floating\nGenre: Ambient';
      const result = validateAndFixFormat(text);
      expect(result).toContain('Dreamy');
    });
  });

  describe('hasLeakedMeta', () => {
    it('returns false for clean text', () => {
      expect(hasLeakedMeta('A beautiful jazz composition')).toBe(false);
    });

    it('detects all leaked meta substrings', () => {
      for (const substring of LEAKED_META_SUBSTRINGS) {
        expect(hasLeakedMeta(`Some text ${substring} more text`)).toBe(true);
      }
    });

    it('is case-insensitive', () => {
      expect(hasLeakedMeta('REMOVE WORD REPETITION')).toBe(true);
      expect(hasLeakedMeta('Output Only the prompt')).toBe(true);
    });
  });

  describe('stripMetaDeterministic', () => {
    it('removes [Note: ...] patterns', () => {
      const text = 'Music [Note: test note] more content';
      expect(stripMetaDeterministic(text)).toBe('Music  more content');
    });

    it('removes (Note: ...) patterns', () => {
      const text = 'Music (Note: test note) more content';
      expect(stripMetaDeterministic(text)).toBe('Music  more content');
    });

    it('removes Note: lines', () => {
      const text = 'Music\nNote: This is a note\nMore content';
      expect(stripMetaDeterministic(text)).toBe('Music\n\nMore content');
    });

    it('removes **Note**: patterns', () => {
      const text = 'Music\n**Note**: Important note\nMore content';
      expect(stripMetaDeterministic(text)).toBe('Music\n\nMore content');
    });

    it('removes Instructions: lines', () => {
      const text = 'Music\nInstructions: Follow these\nMore content';
      expect(stripMetaDeterministic(text)).toBe('Music\n\nMore content');
    });

    it('removes Output: lines', () => {
      const text = 'Output: result\nActual content';
      expect(stripMetaDeterministic(text)).toBe('Actual content');
    });

    it('removes Response: lines', () => {
      const text = 'Response: generated\nActual content';
      expect(stripMetaDeterministic(text)).toBe('Actual content');
    });

    it("removes Here is/Here's lines", () => {
      const text = 'Here is the prompt:\nActual content';
      expect(stripMetaDeterministic(text)).toBe('Actual content');
    });

    it('normalizes multiple newlines', () => {
      const text = 'Content\n\n\n\nMore content';
      expect(stripMetaDeterministic(text)).toBe('Content\n\nMore content');
    });

    it('is case-insensitive', () => {
      const text = 'Music\nNOTE: Upper case\nMore content';
      expect(stripMetaDeterministic(text)).toBe('Music\n\nMore content');
    });

    it('returns clean text unchanged', () => {
      const text = 'Clean music prompt with no meta';
      expect(stripMetaDeterministic(text)).toBe(text);
    });
  });

  describe('dedupDeterministic', () => {
    it('removes exact duplicate lines', () => {
      const text = 'Line one\nLine two\nLine one\nLine three';
      expect(dedupDeterministic(text)).toBe('Line one\nLine two\nLine three');
    });

    it('preserves empty lines for formatting', () => {
      const text = 'Line one\n\nLine two\n\nLine three';
      expect(dedupDeterministic(text)).toBe('Line one\n\nLine two\n\nLine three');
    });

    it('preserves order of first occurrences', () => {
      const text = 'B\nA\nC\nA\nB';
      expect(dedupDeterministic(text)).toBe('B\nA\nC');
    });

    it('returns text unchanged when no duplicates', () => {
      const text = 'Unique line one\nUnique line two\nUnique line three';
      expect(dedupDeterministic(text)).toBe(text);
    });

    it('handles trimmed comparison', () => {
      const text = 'Line one\n  Line one  \nLine two';
      // After trimming, "Line one" and "  Line one  " are the same
      expect(dedupDeterministic(text)).toBe('Line one\nLine two');
    });

    it('handles single line text', () => {
      const text = 'Single line';
      expect(dedupDeterministic(text)).toBe('Single line');
    });

    it('handles all duplicate lines', () => {
      const text = 'Same\nSame\nSame';
      expect(dedupDeterministic(text)).toBe('Same');
    });
  });

  describe('postProcessPrompt', () => {
    const createMockDeps = (overrides: Partial<PostProcessDeps> = {}): PostProcessDeps => ({
      maxChars: 1000,
      minChars: 50,
      rewriteWithoutMeta: async (text) => text.replace(/remove word repetition/gi, ''),
      condense: async (text) => text.slice(0, 500),
      condenseWithDedup: async (text) => text,
      ...overrides,
    });

    it('strips leaked meta lines', async () => {
      const text = 'Good content\nRemove word repetition\nMore content';
      const result = await postProcessPrompt(text, createMockDeps());
      expect(result).not.toContain('Remove word repetition');
    });

    it('adds bracket tag if missing', async () => {
      const text = 'Genre: Jazz\nMood: Smooth\nGreat music';
      const result = await postProcessPrompt(text, createMockDeps());
      expect(result.startsWith('[')).toBe(true);
    });

    it('calls condenseWithDedup when many repeated words', async () => {
      let dedupCalled = false;
      const text =
        'piano piano piano piano guitar guitar guitar guitar drums drums drums drums bass bass bass bass';
      await postProcessPrompt(
        text,
        createMockDeps({
          condenseWithDedup: async (t) => {
            dedupCalled = true;
            return t;
          },
        })
      );
      expect(dedupCalled).toBe(true);
    });

    it('calls condense when over maxChars', async () => {
      let condenseCalled = false;
      const text = 'a'.repeat(1500);
      await postProcessPrompt(
        text,
        createMockDeps({
          maxChars: 1000,
          condense: async (t) => {
            condenseCalled = true;
            return t.slice(0, 500);
          },
        })
      );
      expect(condenseCalled).toBe(true);
    });

    it('returns original text if result too short', async () => {
      const text = 'Short';
      const result = await postProcessPrompt(
        text,
        createMockDeps({
          minChars: 100,
        })
      );
      expect(result).toBe('Short');
    });

    it('preserves bracket tag in output', async () => {
      const text = '[Dreamy, Jazz, Key: D Major]\nSmooth saxophone melody';
      const result = await postProcessPrompt(text, createMockDeps());
      expect(result.startsWith('[')).toBe(true);
    });
  });
});
