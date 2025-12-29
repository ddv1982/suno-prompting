import { describe, it, expect } from 'bun:test';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '../src/bun/prompt/remix';

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
