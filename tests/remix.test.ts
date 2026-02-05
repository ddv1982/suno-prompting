import { describe, it, expect } from 'bun:test';

import {
  extractGenreFromPrompt,
  extractGenresFromPrompt,
  remixGenre,
  remixMoodInPrompt,
  remixStyleTags,
  remixRecording,
} from '@bun/prompt/deterministic';
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

// =============================================================================
// remixGenre with targetGenreCount - Genre Count Preservation Tests
// =============================================================================

/**
 * Extract raw genre values from prompt (before registry validation).
 * Used for testing the number of genre slots in output regardless of
 * whether they are compound genres like "jazz fusion" or single genres.
 */
function extractRawGenreValues(prompt: string): string[] {
  const match = /^genre:\s*"?([^"\n]+?)(?:"|$)/im.exec(prompt);
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
}

describe('remixGenre with targetGenreCount', () => {
  const basePrompt = `genre: "rock"
bpm: "120"
mood: "energetic"
instruments: "guitar, drums"`;

  const multiGenrePrompt = `genre: "jazz, rock, funk"
bpm: "110"
mood: "groovy"
instruments: "saxophone, guitar"`;

  describe('targetGenreCount enforcement', () => {
    it('returns exactly targetGenreCount genre slots when specified', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 3 });
      // Use raw extraction to count genre slots (may include compound genres like "jazz fusion")
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(3);
    });

    it('returns 1 genre slot when targetGenreCount is 1', () => {
      const result = remixGenre(multiGenrePrompt, { targetGenreCount: 1 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });

    it('returns 2 genre slots when targetGenreCount is 2', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 2 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(2);
    });

    it('returns 4 genre slots when targetGenreCount is 4', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 4 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(4);
    });
  });

  describe('targetGenreCount capping at 4', () => {
    it('caps targetGenreCount at 4 when input is 5', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 5 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres.length).toBeLessThanOrEqual(4);
    });

    it('caps targetGenreCount at 4 when input is 10', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 10 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres.length).toBeLessThanOrEqual(4);
    });

    it('caps targetGenreCount at 4 when input is 100', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 100 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres.length).toBeLessThanOrEqual(4);
    });
  });

  describe('targetGenreCount defaults to 1 for invalid values', () => {
    it('defaults to 1 when targetGenreCount is 0', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 0 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });

    it('defaults to 1 when targetGenreCount is negative', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: -1 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });

    it('defaults to 1 when targetGenreCount is -10', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: -10 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });
  });

  describe('preserves prompt count when targetGenreCount not provided', () => {
    it('preserves single genre count when no options provided', () => {
      const result = remixGenre(basePrompt);
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });

    it('preserves multi-genre count when no options provided', () => {
      const result = remixGenre(multiGenrePrompt);
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(3);
    });

    it('preserves 2-genre count when no targetGenreCount', () => {
      const twoGenrePrompt = `genre: "rock, jazz"\nbpm: "100"\nmood: "smooth"`;
      const result = remixGenre(twoGenrePrompt);
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(2);
    });

    it('preserves 4-genre count when no targetGenreCount', () => {
      const fourGenrePrompt = `genre: "rock, jazz, pop, funk"\nbpm: "100"`;
      const result = remixGenre(fourGenrePrompt);
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(4);
    });
  });

  describe('works with both single-genre and multi-genre input prompts', () => {
    it('expands single-genre prompt to 3 genre slots with targetGenreCount: 3', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 3 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(3);
    });

    it('reduces multi-genre prompt to 1 genre slot with targetGenreCount: 1', () => {
      const result = remixGenre(multiGenrePrompt, { targetGenreCount: 1 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(1);
    });

    it('changes genre while maintaining count from multi-genre input', () => {
      const result = remixGenre(multiGenrePrompt, { targetGenreCount: 3 });
      const rawGenres = extractRawGenreValues(result.text);
      expect(rawGenres).toHaveLength(3);
    });
  });

  describe('output validation', () => {
    it('returns valid genres from registry for single genre', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 1 });
      const genres = extractGenresFromPrompt(result.text);
      // Single genre should be from registry
      expect(genres.length).toBeGreaterThanOrEqual(1);
      expect(genres).not.toContain('invalid-genre');
    });

    it('returns different genre than input when possible', () => {
      // Run multiple times to account for randomness
      const results = Array.from({ length: 10 }, () =>
        remixGenre(basePrompt, { targetGenreCount: 1 })
      );
      const genres = results.map((r) => extractGenresFromPrompt(r.text)[0]);
      // At least one should be different from 'rock'
      const hasDifferentGenre = genres.some((g) => g !== 'rock');
      expect(hasDifferentGenre).toBe(true);
    });

    it('preserves other prompt fields when remixing genre', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 2 });
      expect(result.text).toContain('mood:');
      expect(result.text).toContain('instruments:');
    });

    it('includes genre field in output', () => {
      const result = remixGenre(basePrompt, { targetGenreCount: 3 });
      expect(result.text).toContain('genre:');
    });
  });
});

// =============================================================================
// remixMoodInPrompt - Mood Replacement Tests
// =============================================================================

describe('remixMoodInPrompt', () => {
  const basePrompt = `genre: "rock"
bpm: "120"
mood: "energetic, powerful"
instruments: "guitar, drums"`;

  describe('basic functionality', () => {
    it('replaces mood line with new mood combination', () => {
      const result = remixMoodInPrompt(basePrompt);
      expect(result.text).toContain('mood:');
      expect(result.text).not.toContain('energetic, powerful');
    });

    it('preserves other prompt fields', () => {
      const result = remixMoodInPrompt(basePrompt);
      expect(result.text).toContain('genre: "rock"');
      expect(result.text).toContain('bpm: "120"');
      expect(result.text).toContain('instruments:');
    });

    it('generates 2-3 moods each time', () => {
      // Run multiple times to verify mood count
      const results = Array.from({ length: 20 }, () => remixMoodInPrompt(basePrompt));
      results.forEach((r) => {
        const moodMatch = /mood:\s*"?([^"\n]+)/i.exec(r.text);
        const moods =
          moodMatch?.[1]
            ?.split(',')
            .map((m) => m.trim())
            .filter(Boolean) || [];
        expect(moods.length).toBeGreaterThanOrEqual(2);
        expect(moods.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('edge cases', () => {
    it('handles prompt with no mood line', () => {
      const noMoodPrompt = `genre: "rock"\nbpm: "120"\ninstruments: "guitar"`;
      const result = remixMoodInPrompt(noMoodPrompt);
      // Should return unchanged if no mood line to replace
      expect(result.text).toBe(noMoodPrompt);
    });

    it('handles standard mode format (Mood: ...)', () => {
      const standardPrompt = `Genre: rock\nBPM: 120\nMood: energetic\nInstruments: guitar`;
      const result = remixMoodInPrompt(standardPrompt);
      expect(result.text).toContain('Mood:');
    });

    it('produces different moods on consecutive calls', () => {
      const results = Array.from({ length: 5 }, () => remixMoodInPrompt(basePrompt).text);
      const uniqueResults = new Set(results);
      // Should have at least 2 different results (accounting for randomness)
      expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
    });
  });
});

// =============================================================================
// remixStyleTags - Style Tags Replacement Tests
// =============================================================================

describe('remixStyleTags', () => {
  const basePrompt = `genre: "rock"
bpm: "120"
mood: "energetic"
style tags: "raw, distorted"
instruments: "guitar, drums"`;

  describe('basic functionality', () => {
    it('replaces style tags with genre-appropriate tags', () => {
      const result = remixStyleTags(basePrompt);
      expect(result.text).toContain('style tags:');
    });

    it('preserves other prompt fields', () => {
      const result = remixStyleTags(basePrompt);
      expect(result.text).toContain('genre: "rock"');
      expect(result.text).toContain('bpm: "120"');
      expect(result.text).toContain('mood: "energetic"');
      expect(result.text).toContain('instruments:');
    });
  });

  describe('genre-aware selection', () => {
    it('selects appropriate tags for electronic genres', () => {
      const electronicPrompt = `genre: "electronic"\nstyle tags: "old"\nmood: "energetic"`;
      const result = remixStyleTags(electronicPrompt);
      expect(result.text).toContain('style tags:');
    });

    it('selects appropriate tags for acoustic genres', () => {
      const folkPrompt = `genre: "folk"\nstyle tags: "old"\nmood: "warm"`;
      const result = remixStyleTags(folkPrompt);
      expect(result.text).toContain('style tags:');
    });

    it('selects appropriate tags for jazz genre', () => {
      const jazzPrompt = `genre: "jazz"\nstyle tags: "old"\nmood: "smooth"`;
      const result = remixStyleTags(jazzPrompt);
      expect(result.text).toContain('style tags:');
    });
  });

  describe('edge cases', () => {
    it('handles prompt with no style tags line', () => {
      const noStylePrompt = `genre: "rock"\nmood: "energetic"\ninstruments: "guitar"`;
      const result = remixStyleTags(noStylePrompt);
      // Should return unchanged if no style tags line to replace
      expect(result.text).toBe(noStylePrompt);
    });

    it('handles prompt with default genre (pop)', () => {
      const noGenrePrompt = `bpm: "120"\nstyle tags: "old"\nmood: "happy"`;
      const result = remixStyleTags(noGenrePrompt);
      expect(result.text).toContain('style tags:');
    });

    it('produces different tags on consecutive calls', () => {
      const results = Array.from({ length: 5 }, () => remixStyleTags(basePrompt).text);
      const uniqueResults = new Set(results);
      // Should have at least 2 different results (accounting for randomness)
      expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
    });
  });
});

// =============================================================================
// remixRecording - Recording Descriptors Replacement Tests
// =============================================================================

describe('remixRecording', () => {
  const basePrompt = `genre: "rock"
bpm: "120"
mood: "energetic"
recording: "studio, polished"
instruments: "guitar, drums"`;

  describe('basic functionality', () => {
    it('replaces recording descriptors', () => {
      const result = remixRecording(basePrompt);
      expect(result.text).toContain('recording:');
      expect(result.text).not.toContain('studio, polished');
    });

    it('preserves other prompt fields', () => {
      const result = remixRecording(basePrompt);
      expect(result.text).toContain('genre: "rock"');
      expect(result.text).toContain('bpm: "120"');
      expect(result.text).toContain('mood: "energetic"');
      expect(result.text).toContain('instruments:');
    });

    it('replaces recording with new descriptors', () => {
      const result = remixRecording(basePrompt);
      const recordingMatch = /recording:\s*"?([^"\n]+)/i.exec(result.text);
      // Recording descriptors may contain internal commas (e.g., "tape recorder, close-up, raw")
      // so we just verify the field was replaced with non-empty content
      expect(recordingMatch?.[1]).toBeDefined();
      expect(recordingMatch?.[1]?.length).toBeGreaterThan(0);
      expect(recordingMatch?.[1]).not.toBe('studio, polished');
    });
  });

  describe('edge cases', () => {
    it('handles prompt with no recording line', () => {
      const noRecordingPrompt = `genre: "rock"\nmood: "energetic"\ninstruments: "guitar"`;
      const result = remixRecording(noRecordingPrompt);
      // Should return unchanged if no recording line to replace
      expect(result.text).toBe(noRecordingPrompt);
    });

    it('produces different descriptors on consecutive calls', () => {
      const results = Array.from({ length: 5 }, () => remixRecording(basePrompt).text);
      const uniqueResults = new Set(results);
      // Should have at least 2 different results (accounting for randomness)
      expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
    });

    it('handles lowercase recording field', () => {
      const lowercasePrompt = `genre: "jazz"\nrecording: "live"\nmood: "smooth"`;
      const result = remixRecording(lowercasePrompt);
      expect(result.text).toContain('recording:');
      expect(result.text).not.toContain('"live"');
    });
  });
});
