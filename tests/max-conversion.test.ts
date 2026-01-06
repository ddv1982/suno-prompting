import { describe, test, it, expect, mock, beforeEach } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  isMaxFormat,
  parseNonMaxPrompt,
  inferBpm,
  buildMaxFormatPrompt,
  convertToMaxFormat,
} from '@bun/prompt/conversion';
import { enhanceInstruments } from '@bun/prompt/conversion-utils';

// Mock the AI SDK generateText for integration tests
const mockGenerateText = mock(async () => ({
  text: '{"styleTags": "studio polish, warm analog, natural room", "recording": "intimate studio session with vintage microphone"}',
}));

void mock.module('ai', () => ({
  generateText: mockGenerateText,
}));

// ============================================================================
// Task 5.1: Unit Tests - Detection & Parser
// ============================================================================

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
    const partial = '[Is_MAX_MODE: MAX]'; // Missing (MAX)
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

// ============================================================================
// Task 5.2: Unit Tests - BPM Inference
// ============================================================================

describe('inferBpm', () => {
  it('returns typical BPM for known genres', () => {
    // These genres are known to have BPM defined
    expect(inferBpm('ambient')).toBe(65); // ambient typical BPM
    expect(inferBpm('rock')).toBe(120); // rock typical BPM
    expect(inferBpm('jazz')).toBe(110); // jazz typical BPM
    expect(inferBpm('trap')).toBe(145); // trap typical BPM
  });

  it('handles genre aliases', () => {
    // hip-hop should map to trap
    const trapBpm = GENRE_REGISTRY.trap.bpm!.typical;
    expect(inferBpm('hip-hop')).toBe(trapBpm);
    expect(inferBpm('hip hop')).toBe(trapBpm);

    // lo-fi should map to lofi
    const lofiBpm = GENRE_REGISTRY.lofi.bpm!.typical;
    expect(inferBpm('lo-fi')).toBe(lofiBpm);
    expect(inferBpm('lo fi')).toBe(lofiBpm);

    // edm should map to electronic
    const electronicBpm = GENRE_REGISTRY.electronic.bpm!.typical;
    expect(inferBpm('edm')).toBe(electronicBpm);
  });

  it('handles compound genres by taking first word', () => {
    const jazzBpm = GENRE_REGISTRY.jazz.bpm!.typical;
    expect(inferBpm('jazz fusion')).toBe(jazzBpm);
    expect(inferBpm('jazz, rock')).toBe(jazzBpm);
  });

  it('returns 90 for unknown genres', () => {
    expect(inferBpm('unknowngenre')).toBe(90);
    expect(inferBpm('made up style')).toBe(90);
  });

  it('returns 90 for null', () => {
    expect(inferBpm(null)).toBe(90);
  });

  it('handles case insensitivity', () => {
    const ambientBpm = GENRE_REGISTRY.ambient.bpm!.typical;
    expect(inferBpm('AMBIENT')).toBe(ambientBpm);
    expect(inferBpm('Ambient')).toBe(ambientBpm);
    expect(inferBpm('ambient')).toBe(ambientBpm);
  });
});

// ============================================================================
// Task 5.3: Unit Tests - Format Builder
// ============================================================================

describe('buildMaxFormatPrompt', () => {
  it('includes all MAX header tags', () => {
    const result = buildMaxFormatPrompt({
      genre: 'rock',
      bpm: 120,
      instruments: 'electric guitar, drums',
      styleTags: 'raw, live',
      recording: 'studio session',
    });

    expect(result).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result).toContain('[QUALITY: MAX](MAX)');
    expect(result).toContain('[REALISM: MAX](MAX)');
    expect(result).toContain('[REAL_INSTRUMENTS: MAX](MAX)');
  });

  it('formats fields with quotes', () => {
    const result = buildMaxFormatPrompt({
      genre: 'jazz',
      bpm: 120,
      instruments: 'piano, bass',
      styleTags: 'warm, intimate',
      recording: 'club setting',
    });

    expect(result).toContain('genre: "jazz"');
    expect(result).toContain('bpm: "120"');
    expect(result).toContain('instruments: "piano, bass"');
    expect(result).toContain('style tags: "warm, intimate"');
    expect(result).toContain('recording: "club setting"');
  });

  it('preserves field order', () => {
    const result = buildMaxFormatPrompt({
      genre: 'ambient',
      bpm: 65,
      instruments: 'synth pad',
      styleTags: 'ethereal',
      recording: 'studio',
    });

    const lines = result.split('\n');
    // Header takes first 4 lines
    expect(lines[4]).toContain('genre:');
    expect(lines[5]).toContain('bpm:');
    expect(lines[6]).toContain('instruments:');
    expect(lines[7]).toContain('style tags:');
    expect(lines[8]).toContain('recording:');
  });

  it('handles special characters in values', () => {
    const result = buildMaxFormatPrompt({
      genre: 'r&b',
      bpm: 85,
      instruments: 'synth, bass (808)',
      styleTags: 'lo-fi warmth, tape hiss',
      recording: "artist's home studio",
    });

    expect(result).toContain('genre: "r&b"');
    expect(result).toContain('instruments: "synth, bass (808)"');
  });
});

// ============================================================================
// Additional edge case tests
// ============================================================================

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

// ============================================================================
// enhanceInstruments with performanceInstruments
// ============================================================================

describe('enhanceInstruments priority', () => {
  test('uses parsed instruments when provided', () => {
    // Arrange
    const parsedInstruments = ['piano', 'guitar'];
    const performanceInstruments = ['synth strings', 'sidechain pad'];

    // Act
    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    // Assert - parsed instruments should be used, not performance ones
    expect(result).toContain('piano');
    expect(result).toContain('guitar');
    expect(result).not.toContain('synth strings');
  });

  test('uses performanceInstruments when parsed is empty', () => {
    // Arrange
    const parsedInstruments: string[] = [];
    const performanceInstruments = ['synth strings', 'sidechain pad'];

    // Act
    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    // Assert - performance instruments should be used
    expect(result).toContain('synth strings');
    expect(result).toContain('sidechain pad');
  });

  test('falls back to genre selection when both are empty', () => {
    // Arrange
    const parsedInstruments: string[] = [];
    const performanceInstruments: string[] = [];

    // Act
    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    // Assert - should have some instruments (from genre fallback)
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('ambient pad, subtle textures'); // not the default fallback
  });

  test('uses default fallback for unknown genre when both are empty', () => {
    // Arrange
    const parsedInstruments: string[] = [];

    // Act
    const result = enhanceInstruments(parsedInstruments, 'unknowngenre', 'my fallback');

    // Assert - uses custom fallback
    expect(result).toBe('my fallback');
  });

  test('handles undefined performanceInstruments', () => {
    // Arrange
    const parsedInstruments: string[] = [];

    // Act
    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, undefined);

    // Assert - should use genre fallback
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Task 5.4: Integration Tests - Full Pipeline
// ============================================================================

describe('convertToMaxFormat', () => {
  // Mock model getter for tests
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: '{"styleTags": "studio polish, warm analog, natural room", "recording": "intimate studio session with vintage microphone"}',
    }));
  });

  it('converts standard prompt successfully', async () => {
    const standardPrompt = `A dreamy ambient soundscape

Genre: Ambient
Mood: ethereal, peaceful, floating
Instruments: synthesizer, pad, strings

[INTRO]
Gentle pads fade in slowly`;

    const result = await convertToMaxFormat(standardPrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toBeDefined();
    expect(result.convertedPrompt.length).toBeGreaterThan(0);
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it('converted output has all max format fields', async () => {
    const standardPrompt = `Epic rock anthem

Genre: Rock
Mood: powerful, energetic
Instruments: electric guitar, drums, bass`;

    const result = await convertToMaxFormat(standardPrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    
    // Check for MAX header tags
    expect(result.convertedPrompt).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[QUALITY: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[REALISM: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[REAL_INSTRUMENTS: MAX](MAX)');
    
    // Check for required fields
    expect(result.convertedPrompt).toContain('genre:');
    expect(result.convertedPrompt).toContain('bpm:');
    expect(result.convertedPrompt).toContain('instruments:');
    expect(result.convertedPrompt).toContain('style tags:');
    expect(result.convertedPrompt).toContain('recording:');
  });

  it('injects vocal style tags into instruments from performance guidance (not style text)', async () => {
    const style = `A brooding ambient-metal soundscape where a resonant baritone guitar drifts beneath crystalline synth pads.`;

    const result = await convertToMaxFormat(
      style,
      mockGetModel,
      {
        seedGenres: ['ambient metal'],
        performanceInstruments: ['baritone guitar', 'ambient pad', 'crystalline synth pads'],
        performanceVocalStyle: 'Alto, Breathy Delivery, Shouted Hooks',
      }
    );

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('instruments:');
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
  });

  it('caps instruments list while preserving injected vocal style tags', async () => {
    const style = `A brooding ambient-metal soundscape with many layers.`;

    const result = await convertToMaxFormat(
      style,
      mockGetModel,
      {
        seedGenres: ['ambient metal'],
        performanceInstruments: [
          'baritone guitar',
          'ambient pad',
          'crystalline synth pads',
          'sub bass',
          'granular textures',
          'cinematic drums',
          'reverse guitar swells',
        ],
        performanceVocalStyle: 'Alto, Breathy Delivery, Shouted Hooks',
      }
    );

    const instrumentsLine = result.convertedPrompt
      .split('\n')
      .find((l) => l.toLowerCase().startsWith('instruments:'));
    expect(instrumentsLine).toBeTruthy();

    const match = instrumentsLine?.match(/instruments:\s*"([^"]+)"/i);
    expect(match?.[1]).toBeTruthy();

    const items = (match?.[1] ?? '')
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    expect(items.length).toBeLessThanOrEqual(6);

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
  });

  it('does not inject vocals when no performance vocal style is provided', async () => {
    const style = `Instrumental ambient-metal soundscape with baritone guitar and crystalline synth pads. No vocals.`;

    const result = await convertToMaxFormat(
      style,
      mockGetModel,
      {
        seedGenres: ['ambient metal'],
        performanceInstruments: ['baritone guitar', 'ambient pad', 'crystalline synth pads'],
      }
    );

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('instruments:');
    expect(lower).not.toContain('vocals');
  });

  it('already-max-format passes through unchanged with wasConverted false', async () => {
    const maxFormatPrompt = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "jazz"
bpm: "110"
instruments: "piano, upright bass, brushed drums"
style tags: "warm analog, intimate room"
recording: "late night jazz club session"`;

    const result = await convertToMaxFormat(maxFormatPrompt, mockGetModel);

    expect(result.wasConverted).toBe(false);
    expect(result.convertedPrompt).toBe(maxFormatPrompt);
    // AI should not be called for already-max format
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('uses correct BPM from genre registry', async () => {
    const jazzPrompt = `Smooth jazz session
Genre: Jazz
Instruments: saxophone, piano`;

    const result = await convertToMaxFormat(jazzPrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    // Jazz typical BPM is 110
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  it('falls back to default BPM for unknown genres', async () => {
    const unknownGenrePrompt = `Something unique
Genre: UnknownMadeUpGenre
Instruments: theremin`;

    const result = await convertToMaxFormat(unknownGenrePrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    // Default fallback BPM is 90
    expect(result.convertedPrompt).toContain('bpm: "90"');
  });

  it('handles prompt with no explicit genre', async () => {
    const noGenrePrompt = `A beautiful melody with soft tones
Instruments: piano, violin`;

    const result = await convertToMaxFormat(noGenrePrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    // Should default to "ambient" when no genre detected
    expect(result.convertedPrompt).toContain('genre: "ambient"');
  });

  it('handles AI returning malformed JSON gracefully', async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: 'not valid json at all',
    }));

    const prompt = `Simple prompt
Genre: Rock`;

    const result = await convertToMaxFormat(prompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    // Should use fallback values
    expect(result.convertedPrompt).toContain('style tags:');
    expect(result.convertedPrompt).toContain('recording:');
  });

  it('handles AI returning JSON with markdown code blocks', async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: '```json\n{"styleTags": "raw, live energy", "recording": "concert hall"}\n```',
    }));

    const prompt = `Rock concert vibe
Genre: Rock`;

    const result = await convertToMaxFormat(prompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('style tags: "raw, live energy"');
    expect(result.convertedPrompt).toContain('recording: "concert hall"');
  });

  it('preserves genre from input in output', async () => {
    const prompt = `Electronic dance track
Genre: Electronic
Mood: energetic`;

    const result = await convertToMaxFormat(prompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "electronic"');
  });
});

// ============================================================================
// Task 4.2: Suno V5 Styles Integration Tests
// ============================================================================

describe('convertToMaxFormat with sunoStyles', () => {
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: '{"styleTags": "studio polish, warm analog", "recording": "intimate studio session"}',
    }));
  });

  it('prioritizes sunoStyles over seedGenres', async () => {
    const prompt = 'A cool track';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['jazz'], sunoStyles: ['cumbia metal'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "cumbia metal"');
    expect(result.convertedPrompt).not.toContain('Jazz');
  });

  it('prioritizes sunoStyles over detected genre', async () => {
    const prompt = `A jazz song
Genre: Jazz`;

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['dark goa trance'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "dark goa trance"');
    expect(result.convertedPrompt).not.toContain('genre: "jazz"');
  });

  it('injects multiple sunoStyles comma-separated', async () => {
    const prompt = 'Something cool';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['jazz', 'cumbia metal', 'dark goa trance'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "jazz, cumbia metal, dark goa trance"');
  });

  it('injects sunoStyles exactly as-is without transformation', async () => {
    const prompt = 'Something';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['acoustic chicago blues algorave', 'k-pop', '16-bit celtic'] }
    );

    expect(result.wasConverted).toBe(true);
    // Must be exactly as-is (lowercase, no title-case transformation)
    expect(result.convertedPrompt).toContain('genre: "acoustic chicago blues algorave, k-pop, 16-bit celtic"');
  });

  it('falls back to seedGenres when sunoStyles is empty', async () => {
    const prompt = 'A track';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['jazz', 'rock'] }
    );

    expect(result.wasConverted).toBe(true);
    // seedGenres get formatted with display names (title case)
    expect(result.convertedPrompt).toContain('genre: "Jazz, Rock"');
  });

  it('falls back to detected genre when both sunoStyles and seedGenres are empty', async () => {
    const prompt = `Electronic vibes
Genre: Electronic`;

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      {}
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "electronic"');
  });

  it('falls back to detected genre when options is undefined', async () => {
    const prompt = `Ambient soundscape
Genre: Ambient`;

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "ambient"');
  });

  it('handles single sunoStyle correctly', async () => {
    const prompt = 'Something';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['lo-fi afro-cuban jazz'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "lo-fi afro-cuban jazz"');
  });

  it('maintains backward compatibility when sunoStyles not provided', async () => {
    const prompt = `Rock anthem
Genre: Rock`;

    // Call with only seedGenres
    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['metal'] }
    );

    expect(result.wasConverted).toBe(true);
    // Should use seedGenres with display name formatting
    expect(result.convertedPrompt).toContain('genre: "Metal"');
  });

  it('uses first word of first sunoStyle for BPM lookup', async () => {
    const prompt = 'Something';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['jazz fusion vibes'] }
    );

    expect(result.wasConverted).toBe(true);
    // Jazz has typical BPM of 110
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  it('uses default BPM when sunoStyle genre is not recognized', async () => {
    const prompt = 'Something';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['urdu shoegaze'] }
    );

    expect(result.wasConverted).toBe(true);
    // Should fall back to default BPM of 90
    expect(result.convertedPrompt).toContain('bpm: "90"');
  });

  it('handles sunoStyles with special characters', async () => {
    const prompt = 'Something';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { sunoStyles: ['afro trap r&b', 'hawaiian r&b'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "afro trap r&b, hawaiian r&b"');
  });
});

// ============================================================================
// convertToMaxFormat with performanceInstruments
// ============================================================================

describe('convertToMaxFormat with performanceInstruments', () => {
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: '{"styleTags": "studio polish, warm analog", "recording": "intimate studio session"}',
    }));
  });

  test('uses performanceInstruments in output when no instruments parsed', async () => {
    // Arrange - free-form style text with no explicit Instruments: line
    const prompt = 'A dreamy soundscape with lush textures';

    // Act
    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['afrobeat'], performanceInstruments: ['synth strings', 'sidechain pad'] }
    );

    // Assert
    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('synth strings');
    expect(result.convertedPrompt).toContain('sidechain pad');
  });

  test('uses parsed instruments over performanceInstruments', async () => {
    // Arrange - prompt with explicit Instruments: line
    const prompt = `A rock anthem
Instruments: electric guitar, drums`;

    // Act
    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['rock'], performanceInstruments: ['synth strings', 'sidechain pad'] }
    );

    // Assert - parsed instruments should be used
    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('guitar');
    expect(result.convertedPrompt).toContain('drums');
    expect(result.convertedPrompt).not.toContain('synth strings');
  });

  test('handles undefined performanceInstruments', async () => {
    // Arrange
    const prompt = 'A free-form style';

    // Act
    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['jazz'] }
    );

    // Assert - should use genre fallback (jazz instruments)
    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('instruments:');
  });
});

// ============================================================================
// convertToMaxFormat with bpmRange
// ============================================================================

describe('convertToMaxFormat with bpmRange', () => {
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: '{"styleTags": "studio polish, warm analog", "recording": "intimate studio session"}',
    }));
  });

  test('uses provided bpmRange instead of genre inference', async () => {
    const prompt = 'A jazz track';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['jazz'], bpmRange: 'between 80 and 80' }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "between 80 and 80"');
    // Should NOT contain the genre-inferred BPM (110 for jazz)
    expect(result.convertedPrompt).not.toContain('bpm: "110"');
  });

  test('falls back to genre BPM when bpmRange not provided', async () => {
    const prompt = 'A jazz track';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { seedGenres: ['jazz'] }
    );

    expect(result.wasConverted).toBe(true);
    // Should use genre-inferred BPM (110 for jazz)
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  test('preserves exact bpmRange format', async () => {
    const prompt = 'Some music';

    const result = await convertToMaxFormat(
      prompt,
      mockGetModel,
      { bpmRange: 'between 120 and 145' }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "between 120 and 145"');
  });
});
