import { describe, expect, test } from 'bun:test';

import {
  getRandomProgressionForGenre,
  getProgressionsForGenre,
  buildProgressionShort,
  injectChordProgression,
  detectProgression,
} from '@bun/prompt/chord-progressions';

describe('injectChordProgression', () => {
  const samplePrompt = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "Jazz"
bpm: "between 80 and 100"
instruments: "Rhodes, tenor sax, upright bass"
style tags: "warm, intimate"
recording: "studio session"`;

  test('injects chord progression into instruments field', () => {
    const fixedRng = () => 0; // Always pick first progression
    const result = injectChordProgression(samplePrompt, 'jazz', fixedRng);

    expect(result).toContain('harmony');
    expect(result).toContain('instruments: "Rhodes, tenor sax, upright bass,');
  });

  test('does not inject if progression already exists', () => {
    const promptWithProgression = `instruments: "Rhodes, The 2-5-1 (ii-V-I) harmony"`;
    const result = injectChordProgression(promptWithProgression, 'jazz');

    expect(result).toBe(promptWithProgression);
  });

  test('handles empty instruments field', () => {
    const emptyInstruments = `genre: "jazz"\ninstruments: ""\nstyle tags: "warm"`;
    const fixedRng = () => 0;
    const result = injectChordProgression(emptyInstruments, 'jazz', fixedRng);

    expect(result).toContain('harmony');
  });

  test('returns unchanged prompt if no instruments field', () => {
    const noInstruments = `genre: "jazz"\nstyle tags: "warm"`;
    const result = injectChordProgression(noInstruments, 'jazz');

    expect(result).toBe(noInstruments);
  });

  test('uses genre-appropriate progression', () => {
    const fixedRng = () => 0;
    const jazzResult = injectChordProgression(samplePrompt, 'jazz', fixedRng);
    const rockResult = injectChordProgression(
      samplePrompt.replace('Jazz', 'Rock'),
      'rock',
      fixedRng
    );

    // Jazz should get jazz progressions (2-5-1 is common)
    // Rock should get rock progressions
    expect(jazzResult).not.toBe(rockResult);
  });

  test('handles various progression pattern formats in detection', () => {
    // Test with different pattern formats
    const patterns = [
      'instruments: "piano, The Standard (I-V-vi-IV) harmony"',
      'instruments: "piano, The Bossa Nova (Imaj7-ii7-V7-Imaj7) harmony"',
      'instruments: "piano, The 2-5-1 (ii-V-I) harmony"',
    ];

    for (const pattern of patterns) {
      const result = injectChordProgression(pattern, 'jazz');
      // Should not add another harmony tag
      expect(result).toBe(pattern);
    }
  });
});

describe('getProgressionsForGenre', () => {
  test('returns progressions for known genres', () => {
    const jazzProgressions = getProgressionsForGenre('jazz');
    expect(jazzProgressions.length).toBeGreaterThan(0);
  });

  test('falls back to pop progressions for unknown genre', () => {
    const unknownProgressions = getProgressionsForGenre('unknown_genre');
    const popProgressions = getProgressionsForGenre('pop');
    expect(unknownProgressions.length).toBeGreaterThan(0);
    expect(unknownProgressions).toEqual(popProgressions);
  });
});

describe('getRandomProgressionForGenre', () => {
  test('returns a progression object with required fields', () => {
    const progression = getRandomProgressionForGenre('jazz');

    expect(progression.name).toBeDefined();
    expect(progression.pattern).toBeDefined();
    expect(progression.description).toBeDefined();
    expect(progression.mood).toBeDefined();
    expect(progression.genres).toBeDefined();
  });

  test('uses provided rng for deterministic selection', () => {
    const fixedRng = () => 0;
    const result1 = getRandomProgressionForGenre('jazz', fixedRng);
    const result2 = getRandomProgressionForGenre('jazz', fixedRng);

    expect(result1.name).toBe(result2.name);
  });
});

describe('buildProgressionShort', () => {
  test('returns name and pattern format', () => {
    const fixedRng = () => 0;
    const result = buildProgressionShort('jazz', fixedRng);

    expect(result).toMatch(/^.+\s\(.+\)$/);
    expect(result).not.toContain('harmony');
  });
});

describe('detectProgression', () => {
  test('detects 2-5-1 progression keywords', () => {
    const result = detectProgression('I want a song with ii-V-I changes');
    expect(result?.name).toBe('The 2-5-1');
  });

  test('detects bossa nova progression', () => {
    const result = detectProgression('bossa nova style harmony');
    expect(result?.name).toBe('The Bossa Nova');
  });

  test('returns null for no match', () => {
    const result = detectProgression('just a regular song');
    expect(result).toBeNull();
  });
});
