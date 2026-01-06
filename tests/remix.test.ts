import { describe, it, expect } from 'bun:test';

import { extractGenreFromPrompt, extractGenresFromPrompt } from '@bun/ai/remix';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';

describe('replaceFieldLine', () => {
  describe('Genre replacement', () => {
    it('replaces genre in normal mode format', () => {
      const prompt = 'Genre: jazz\nMood: smooth\nInstruments: piano';
      const result = replaceFieldLine(prompt, 'Genre', 'rock');
      expect(result).toBe('Genre: rock\nMood: smooth\nInstruments: piano');
    });

    it('replaces genre in max mode format', () => {
      const prompt = 'genre: "jazz"\nmood: "smooth"\ninstruments: "piano"';
      const result = replaceFieldLine(prompt, 'Genre', 'rock');
      expect(result).toBe('genre: "rock"\nmood: "smooth"\ninstruments: "piano"');
    });

    it('handles multi-word genres', () => {
      const prompt = 'Genre: jazz fusion\nMood: smooth';
      const result = replaceFieldLine(prompt, 'Genre', 'progressive rock');
      expect(result).toBe('Genre: progressive rock\nMood: smooth');
    });
  });

  describe('BPM replacement', () => {
    it('replaces BPM in normal mode format', () => {
      const prompt = 'Genre: jazz\nBPM: 96\nMood: smooth';
      const result = replaceFieldLine(prompt, 'BPM', '172');
      expect(result).toBe('Genre: jazz\nBPM: 172\nMood: smooth');
    });

    it('replaces BPM in max mode format', () => {
      const prompt = 'genre: "jazz"\nbpm: "96"\nmood: "smooth"';
      const result = replaceFieldLine(prompt, 'BPM', '172');
      expect(result).toBe('genre: "jazz"\nbpm: "172"\nmood: "smooth"');
    });

    it('returns unchanged prompt if BPM line not found', () => {
      const prompt = 'Genre: jazz\nMood: smooth';
      const result = replaceFieldLine(prompt, 'BPM', '172');
      expect(result).toBe(prompt);
    });
  });

  describe('Mood replacement', () => {
    it('replaces mood in normal mode format', () => {
      const prompt = 'Genre: jazz\nMood: smooth, warm\nInstruments: piano';
      const result = replaceFieldLine(prompt, 'Mood', 'energetic, upbeat');
      expect(result).toBe('Genre: jazz\nMood: energetic, upbeat\nInstruments: piano');
    });

    it('replaces mood in max mode format', () => {
      const prompt = 'genre: "jazz"\nmood: "smooth, warm"\ninstruments: "piano"';
      const result = replaceFieldLine(prompt, 'Mood', 'energetic, upbeat');
      expect(result).toBe('genre: "jazz"\nmood: "energetic, upbeat"\ninstruments: "piano"');
    });
  });

  describe('Instruments replacement', () => {
    it('replaces instruments in normal mode format', () => {
      const prompt = 'Genre: jazz\nInstruments: piano, bass\nMood: smooth';
      const result = replaceFieldLine(prompt, 'Instruments', 'guitar, drums');
      expect(result).toBe('Genre: jazz\nInstruments: guitar, drums\nMood: smooth');
    });

    it('replaces instruments in max mode format', () => {
      const prompt = 'genre: "jazz"\ninstruments: "piano, bass"\nmood: "smooth"';
      const result = replaceFieldLine(prompt, 'Instruments', 'guitar, drums');
      expect(result).toBe('genre: "jazz"\ninstruments: "guitar, drums"\nmood: "smooth"');
    });
  });
});

describe('replaceStyleTagsLine', () => {
  it('replaces style tags in max mode format', () => {
    const prompt = 'genre: "jazz"\nstyle tags: "old style"\nmood: "smooth"';
    const result = replaceStyleTagsLine(prompt, 'new style');
    expect(result).toBe('genre: "jazz"\nstyle tags: "new style"\nmood: "smooth"');
  });

  it('returns unchanged prompt if style tags line not found', () => {
    const prompt = 'genre: "jazz"\nmood: "smooth"';
    const result = replaceStyleTagsLine(prompt, 'new style');
    expect(result).toBe(prompt);
  });
});

describe('replaceRecordingLine', () => {
  it('replaces recording in max mode format', () => {
    const prompt = 'genre: "jazz"\nrecording: "studio"\nmood: "smooth"';
    const result = replaceRecordingLine(prompt, 'live concert');
    expect(result).toBe('genre: "jazz"\nrecording: "live concert"\nmood: "smooth"');
  });

  it('returns unchanged prompt if recording line not found', () => {
    const prompt = 'genre: "jazz"\nmood: "smooth"';
    const result = replaceRecordingLine(prompt, 'live concert');
    expect(result).toBe(prompt);
  });
});

describe('extractGenreFromPrompt (single)', () => {
  it('extracts single genre from max mode format', () => {
    const prompt = 'genre: "jazz"\nmood: "smooth"';
    expect(extractGenreFromPrompt(prompt)).toBe('jazz');
  });

  it('extracts first genre from multi-genre prompt', () => {
    const prompt = 'genre: "jazz, rock, pop, funk"\nmood: "energetic"';
    expect(extractGenreFromPrompt(prompt)).toBe('jazz');
  });

  it('returns default genre when no genre line found', () => {
    const prompt = 'mood: "smooth"\ninstruments: "piano"';
    expect(extractGenreFromPrompt(prompt)).toBe('pop');
  });

  it('returns default genre for invalid genre', () => {
    const prompt = 'genre: "not-a-real-genre"\nmood: "smooth"';
    expect(extractGenreFromPrompt(prompt)).toBe('pop');
  });
});

describe('extractGenresFromPrompt (multi)', () => {
  it('extracts single genre as array', () => {
    const prompt = 'genre: "jazz"\nmood: "smooth"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['jazz']);
  });

  it('extracts all valid genres from multi-genre prompt', () => {
    const prompt = 'genre: "jazz, rock, pop, funk"\nmood: "energetic"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['jazz', 'rock', 'pop', 'funk']);
  });

  it('extracts genres from standard mode format', () => {
    const prompt = 'Genre: jazz, rock\nMood: smooth';
    expect(extractGenresFromPrompt(prompt)).toEqual(['jazz', 'rock']);
  });

  it('filters out invalid genres', () => {
    const prompt = 'genre: "jazz, invalid-genre, rock"\nmood: "smooth"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['jazz', 'rock']);
  });

  it('returns default genre array when no valid genres', () => {
    const prompt = 'genre: "not-valid, also-invalid"\nmood: "smooth"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['pop']);
  });

  it('returns default genre array when no genre line', () => {
    const prompt = 'mood: "smooth"\ninstruments: "piano"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['pop']);
  });

  it('handles whitespace in genre list', () => {
    const prompt = 'genre: "  jazz  ,  rock  ,  pop  "\nmood: "smooth"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['jazz', 'rock', 'pop']);
  });

  it('preserves order of genres', () => {
    const prompt = 'genre: "funk, soul, rnb, jazz"\nmood: "groovy"';
    expect(extractGenresFromPrompt(prompt)).toEqual(['funk', 'soul', 'rnb', 'jazz']);
  });
});
