import { describe, it, expect } from 'bun:test';

import { isMaxFormat, parseNonMaxPrompt } from '@bun/prompt/conversion';

describe('isMaxFormat', () => {
  it('returns true for prompts with MAX header', () => {
    const maxPrompt = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "rock"
bpm: "120"`;
    expect(isMaxFormat(maxPrompt)).toBe(true);
  });

  it('returns true even if MAX header is in the middle', () => {
    const prompt = 'some text\n[Is_MAX_MODE: MAX](MAX)\nmore text';
    expect(isMaxFormat(prompt)).toBe(true);
  });

  it('returns false for standard prompts', () => {
    const standardPrompt = 'Genre: Rock\nMood: energetic\nInstruments: guitar, drums';
    expect(isMaxFormat(standardPrompt)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isMaxFormat('')).toBe(false);
  });

  it('returns false for partial MAX header', () => {
    const partial = '[Is_MAX_MODE: MAX]';
    expect(isMaxFormat(partial)).toBe(false);
  });
});

describe('parseNonMaxPrompt', () => {
  it('extracts genre from "Genre: X" pattern', () => {
    const prompt = 'A cool song\nGenre: Jazz';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.genre).toBe('jazz');
  });

  it('handles Genre with various cases', () => {
    const prompt1 = 'GENRE: Rock';
    const prompt2 = 'genre: blues';
    const prompt3 = 'Genre: Electronic';

    expect(parseNonMaxPrompt(prompt1).genre).toBe('rock');
    expect(parseNonMaxPrompt(prompt2).genre).toBe('blues');
    expect(parseNonMaxPrompt(prompt3).genre).toBe('electronic');
  });

  it('extracts multiple moods', () => {
    const prompt = 'Mood: dreamy, ethereal, calm';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.moods).toEqual(['dreamy', 'ethereal', 'calm']);
  });

  it('handles Moods (plural) pattern', () => {
    const prompt = 'Moods: happy, upbeat';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.moods).toEqual(['happy', 'upbeat']);
  });

  it('extracts instruments list', () => {
    const prompt = 'Instruments: piano, guitar, drums';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.instruments).toEqual(['piano', 'guitar', 'drums']);
  });

  it('handles Instrument (singular) pattern', () => {
    const prompt = 'Instrument: bass';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.instruments).toEqual(['bass']);
  });

  it('extracts sections with content', () => {
    const prompt = `[INTRO]
Gentle pads fade in

[VERSE]
Melodic lines over groove`;
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.tag).toBe('INTRO');
    expect(parsed.sections[0]?.content).toBe('Gentle pads fade in');
    expect(parsed.sections[1]?.tag).toBe('VERSE');
    expect(parsed.sections[1]?.content).toBe('Melodic lines over groove');
  });

  it('captures first line as description', () => {
    const prompt = 'A dreamy journey through space\nGenre: Ambient';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.description).toBe('A dreamy journey through space');
  });

  it('skips field lines for description', () => {
    const prompt = `Genre: Rock
A heavy hitting track
Mood: energetic`;
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.description).toBe('A heavy hitting track');
  });

  it('handles complex prompt with all fields', () => {
    const prompt = `Epic cinematic adventure soundtrack

Genre: Cinematic
Mood: heroic, triumphant, majestic
Instruments: orchestra, brass, timpani

[INTRO]
Quiet strings build tension

[CHORUS]
Full orchestra triumphant`;

    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.description).toBe('Epic cinematic adventure soundtrack');
    expect(parsed.genre).toBe('cinematic');
    expect(parsed.moods).toEqual(['heroic', 'triumphant', 'majestic']);
    expect(parsed.instruments).toEqual(['orchestra', 'brass', 'timpani']);
    expect(parsed.sections).toHaveLength(2);
  });

  it('handles empty input', () => {
    const parsed = parseNonMaxPrompt('');
    expect(parsed.description).toBe('');
    expect(parsed.genre).toBeNull();
    expect(parsed.moods).toEqual([]);
    expect(parsed.instruments).toEqual([]);
    expect(parsed.sections).toEqual([]);
  });

  it('handles whitespace-only input', () => {
    const parsed = parseNonMaxPrompt('   \n  \n   ');
    expect(parsed.description).toBe('');
    expect(parsed.genre).toBeNull();
  });
});

describe('parseNonMaxPrompt edge cases', () => {
  it('handles multi-word section tags', () => {
    const prompt = `[PRE CHORUS]
Building intensity

[BRIDGE SECTION]
New melody`;
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.tag).toBe('PRE CHORUS');
    expect(parsed.sections[1]?.tag).toBe('BRIDGE SECTION');
  });

  it('extracts content that spans multiple lines', () => {
    const prompt = `[INTRO]
Line one
Line two
Line three

[VERSE]
Verse content`;
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.sections[0]?.content).toContain('Line one');
    expect(parsed.sections[0]?.content).toContain('Line two');
    expect(parsed.sections[0]?.content).toContain('Line three');
  });

  it('handles instruments with extra whitespace', () => {
    const prompt = 'Instruments:  piano ,  guitar  , bass  ';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.instruments).toEqual(['piano', 'guitar', 'bass']);
  });

  it('handles moods with extra whitespace', () => {
    const prompt = 'Mood:   happy  ,  sad  ,  nostalgic  ';
    const parsed = parseNonMaxPrompt(prompt);
    expect(parsed.moods).toEqual(['happy', 'sad', 'nostalgic']);
  });
});
