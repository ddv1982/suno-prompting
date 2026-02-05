import { describe, test, expect } from 'bun:test';

import {
  buildPreFormattedMaxOutput,
  buildPreFormattedStandardOutput,
  formatPreBuiltMaxOutput,
  parseMaxEnhancementResponse,
  type PreFormattedMaxOutput,
} from '../src/bun/prompt/context-preservation';

describe('buildPreFormattedMaxOutput', () => {
  describe('BPM preservation', () => {
    test('formats BPM as range string', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'jazz',
        userInstruments: [],
      });
      expect(result.bpm).toMatch(/^between \d+ and \d+$/);
    });

    test('uses fallback for empty genre', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: '',
        userInstruments: [],
      });
      // Pop is the default genre, which has BPM range 100-130
      expect(result.bpm).toBe('between 100 and 130');
    });
  });

  describe('vocal style injection', () => {
    test('includes vocal tags in instruments when guidance available', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'jazz',
        userInstruments: [],
        performanceGuidance: {
          vocal: 'Tenor, Laid Back Delivery, Ad Libs',
          production: 'Intimate Recording',
          instruments: ['piano', 'bass'],
        },
      });
      expect(result.instruments.toLowerCase()).toContain('vocal');
    });

    test('works without vocal guidance (no crash)', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'acoustic',
        userInstruments: ['guitar'],
        performanceGuidance: null,
      });
      expect(result.instruments).toBeDefined();
      expect(result.instruments.length).toBeGreaterThan(0);
    });

    test('works with undefined performanceGuidance', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'rock',
        userInstruments: [],
      });
      expect(result.instruments).toBeDefined();
    });
  });

  describe('chord progression inclusion', () => {
    test('includes chord progression in instruments field', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'jazz',
        userInstruments: [],
      });
      expect(result.instruments).toContain('harmony');
    });

    test('includes progression name pattern', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'jazz',
        userInstruments: [],
      });
      expect(result.chordProgression).toMatch(/\([^)]+\)/);
    });

    test('stores full chord progression descriptor', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'blues',
        userInstruments: [],
      });
      expect(result.chordProgression.length).toBeGreaterThan(10);
    });
  });

  describe('genre preservation', () => {
    test('preserves exact genre string', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'acid jazz',
        userInstruments: [],
      });
      expect(result.genre).toBe('acid jazz');
    });

    test('uses pop as default for empty genre', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: '',
        userInstruments: [],
      });
      expect(result.genre).toBe('pop');
    });

    test('handles multi-genre string', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'jazz rock',
        userInstruments: [],
      });
      expect(result.genre).toBe('jazz rock');
    });
  });

  describe('instruments handling', () => {
    test('includes user instruments when provided', () => {
      const result = buildPreFormattedMaxOutput({
        detectedGenre: 'rock',
        userInstruments: ['electric guitar', 'drums'],
        performanceGuidance: {
          vocal: '',
          production: '',
          instruments: ['electric guitar', 'drums'],
        },
      });
      expect(result.instruments).toBeDefined();
    });
  });
});

describe('buildPreFormattedStandardOutput', () => {
  describe('BPM preservation', () => {
    test('formats BPM as range string', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'pop', userInstruments: [] },
        []
      );
      expect(result.bpm).toMatch(/^between \d+ and \d+$/);
    });
  });

  describe('mood handling', () => {
    test('extracts first 3 detected moods', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'pop', userInstruments: [] },
        ['happy', 'upbeat', 'energetic', 'fun']
      );
      expect(result.mood).toBe('happy, upbeat, energetic');
    });

    test('uses fallback for empty moods', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'rock', userInstruments: [] },
        []
      );
      expect(result.mood).toBe('evocative, dynamic');
    });

    test('handles single mood', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'blues', userInstruments: [] },
        ['melancholic']
      );
      expect(result.mood).toBe('melancholic');
    });

    test('handles two moods', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'jazz', userInstruments: [] },
        ['smooth', 'relaxing']
      );
      expect(result.mood).toBe('smooth, relaxing');
    });
  });

  describe('instruments include vocal tags', () => {
    test('includes vocal style when guidance provided', () => {
      const result = buildPreFormattedStandardOutput(
        {
          detectedGenre: 'soul',
          userInstruments: [],
          performanceGuidance: {
            vocal: 'Soulful, Powerful',
            production: 'Warm',
            instruments: ['piano', 'bass'],
          },
        },
        ['emotional']
      );
      expect(result.instruments.toLowerCase()).toContain('vocal');
    });
  });

  describe('instruments include chord progression', () => {
    test('includes harmony in instruments field', () => {
      const result = buildPreFormattedStandardOutput(
        { detectedGenre: 'folk', userInstruments: [] },
        []
      );
      expect(result.instruments).toContain('harmony');
    });
  });
});

describe('formatPreBuiltMaxOutput', () => {
  const samplePreFormatted: PreFormattedMaxOutput = {
    genre: 'jazz',
    bpm: 'between 80 and 160',
    instruments: 'piano, bass, tenor vocals',
    chordProgression: 'The Soul Vamp (i-IV): groove',
  };

  test('starts with MAX_MODE_HEADER', () => {
    const result = formatPreBuiltMaxOutput(
      samplePreFormatted,
      'smooth, intimate',
      'late night lounge session'
    );
    expect(result).toContain('[Is_MAX_MODE: MAX](MAX)');
  });

  test('contains all required fields', () => {
    const result = formatPreBuiltMaxOutput(
      samplePreFormatted,
      'smooth, intimate',
      'late night lounge session'
    );
    expect(result).toContain('genre: "jazz"');
    expect(result).toContain('bpm: "between 80 and 160"');
    expect(result).toContain('instruments: "piano, bass, tenor vocals"');
    expect(result).toContain('style tags: "smooth, intimate"');
    expect(result).toContain('recording: "late night lounge session"');
  });

  test('formats each field on its own line', () => {
    const result = formatPreBuiltMaxOutput(samplePreFormatted, 'chill', 'studio');
    const lines = result.split('\n');
    expect(lines.some((l) => l.startsWith('genre:'))).toBe(true);
    expect(lines.some((l) => l.startsWith('bpm:'))).toBe(true);
    expect(lines.some((l) => l.startsWith('instruments:'))).toBe(true);
    expect(lines.some((l) => l.startsWith('style tags:'))).toBe(true);
    expect(lines.some((l) => l.startsWith('recording:'))).toBe(true);
  });

  test('properly quotes field values', () => {
    const result = formatPreBuiltMaxOutput(samplePreFormatted, 'test style', 'test recording');
    expect(result).toMatch(/genre: "jazz"/);
    expect(result).toMatch(/style tags: "test style"/);
  });
});

describe('parseMaxEnhancementResponse', () => {
  test('parses valid JSON response', () => {
    const response = '{"styleTags": "smooth, laid back", "recording": "studio session"}';
    const result = parseMaxEnhancementResponse(response);
    expect(result).not.toBeNull();
    expect(result?.styleTags).toBe('smooth, laid back');
    expect(result?.recording).toBe('studio session');
  });

  test('handles JSON with markdown code blocks', () => {
    const response = '```json\n{"styleTags": "warm", "recording": "live"}\n```';
    const result = parseMaxEnhancementResponse(response);
    expect(result).not.toBeNull();
    expect(result?.styleTags).toBe('warm');
    expect(result?.recording).toBe('live');
  });

  test('handles JSON with plain code blocks', () => {
    const response = '```\n{"styleTags": "cool", "recording": "home"}\n```';
    const result = parseMaxEnhancementResponse(response);
    expect(result).not.toBeNull();
    expect(result?.styleTags).toBe('cool');
  });

  test('returns null for missing styleTags', () => {
    const response = '{"recording": "studio"}';
    const result = parseMaxEnhancementResponse(response);
    expect(result).toBeNull();
  });

  test('returns null for missing recording', () => {
    const response = '{"styleTags": "warm"}';
    const result = parseMaxEnhancementResponse(response);
    expect(result).toBeNull();
  });

  test('returns null for empty styleTags value', () => {
    const response = '{"styleTags": "", "recording": "studio"}';
    const result = parseMaxEnhancementResponse(response);
    expect(result).toBeNull();
  });

  test('returns null for empty recording value', () => {
    const response = '{"styleTags": "warm", "recording": ""}';
    const result = parseMaxEnhancementResponse(response);
    expect(result).toBeNull();
  });

  test('returns null for invalid JSON', () => {
    const response = 'not valid json';
    const result = parseMaxEnhancementResponse(response);
    expect(result).toBeNull();
  });

  test('trims whitespace from values', () => {
    const response = '{"styleTags": "  padded  ", "recording": "  also padded  "}';
    const result = parseMaxEnhancementResponse(response);
    expect(result?.styleTags).toBe('padded');
    expect(result?.recording).toBe('also padded');
  });
});
