import { describe, test, it, expect, mock, beforeEach, afterEach } from 'bun:test';

import { setAiGenerateTextMock } from '../helpers/ai-mock';

const mockGenerateText = mock(async () => ({
  text: '{"styleTags": "studio polish, warm analog, natural room", "recording": "intimate studio session with vintage microphone"}',
}));

let convertToMaxFormat: typeof import('@bun/prompt/conversion').convertToMaxFormat;
const defaultMaxAiResponse =
  '{"styleTags": "studio polish, warm analog, natural room", "recording": "intimate studio session with vintage microphone"}';

async function setupConvertToMaxFormat() {
  mockGenerateText.mockClear();
  mockGenerateText.mockImplementation(async () => ({
    text: defaultMaxAiResponse,
  }));

  setAiGenerateTextMock(mockGenerateText);

  ({ convertToMaxFormat } = await import('@bun/prompt/conversion'));
}

describe('convertToMaxFormat', () => {
  const mockGetModel = () => ({}) as any;

  beforeEach(async () => {
    await setupConvertToMaxFormat();
  });

  afterEach(() => {
    mock.restore();
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
    expect(result.convertedPrompt).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[QUALITY: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[REALISM: MAX](MAX)');
    expect(result.convertedPrompt).toContain('[REAL_INSTRUMENTS: MAX](MAX)');
    expect(result.convertedPrompt).toContain('genre:');
    expect(result.convertedPrompt).toContain('bpm:');
    expect(result.convertedPrompt).toContain('instruments:');
    expect(result.convertedPrompt).toContain('style tags:');
    expect(result.convertedPrompt).toContain('recording:');
  });

  it('injects vocal style tags into instruments from performance guidance', async () => {
    const style = `A brooding ambient-metal soundscape where a resonant baritone guitar drifts beneath crystalline synth pads.`;

    const result = await convertToMaxFormat(style, mockGetModel, {
      seedGenres: ['ambient metal'],
      performanceInstruments: ['baritone guitar', 'ambient pad', 'crystalline synth pads'],
      performanceVocalStyle: 'Alto, Breathy Delivery, Shouted Hooks',
    });

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('instruments:');
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
  });

  it('caps instruments list while preserving injected vocal style tags', async () => {
    const style = `A brooding ambient-metal soundscape with many layers.`;

    const result = await convertToMaxFormat(style, mockGetModel, {
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
    });

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

    const result = await convertToMaxFormat(style, mockGetModel, {
      seedGenres: ['ambient metal'],
      performanceInstruments: ['baritone guitar', 'ambient pad', 'crystalline synth pads'],
    });

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
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('uses correct BPM from genre registry', async () => {
    const jazzPrompt = `Smooth jazz session
Genre: Jazz
Instruments: saxophone, piano`;

    const result = await convertToMaxFormat(jazzPrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  it('falls back to default BPM for unknown genres', async () => {
    const unknownGenrePrompt = `Something unique
Genre: UnknownMadeUpGenre
Instruments: theremin`;

    const result = await convertToMaxFormat(unknownGenrePrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "90"');
  });

  it('handles prompt with no explicit genre', async () => {
    const noGenrePrompt = `A beautiful melody with soft tones
Instruments: piano, violin`;

    const result = await convertToMaxFormat(noGenrePrompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "pop"');
  });

  it('handles AI returning malformed JSON gracefully', async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: 'not valid json at all',
    }));

    const prompt = `Simple prompt
Genre: Rock`;

    const result = await convertToMaxFormat(prompt, mockGetModel);

    expect(result.wasConverted).toBe(true);
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

describe('convertToMaxFormat with sunoStyles', () => {
  const mockGetModel = () => ({}) as any;

  beforeEach(async () => {
    await setupConvertToMaxFormat();
  });

  it('prioritizes sunoStyles over seedGenres', async () => {
    const result = await convertToMaxFormat('A cool track', mockGetModel, {
      seedGenres: ['jazz'],
      sunoStyles: ['cumbia metal'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "cumbia metal"');
    expect(result.convertedPrompt).not.toContain('Jazz');
  });

  it('prioritizes sunoStyles over detected genre', async () => {
    const result = await convertToMaxFormat(`A jazz song\nGenre: Jazz`, mockGetModel, {
      sunoStyles: ['dark goa trance'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "dark goa trance"');
    expect(result.convertedPrompt).not.toContain('genre: "jazz"');
  });

  it('injects multiple sunoStyles comma-separated', async () => {
    const result = await convertToMaxFormat('Something cool', mockGetModel, {
      sunoStyles: ['jazz', 'cumbia metal', 'dark goa trance'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "jazz, cumbia metal, dark goa trance"');
  });

  it('injects sunoStyles exactly as-is without transformation', async () => {
    const result = await convertToMaxFormat('Something', mockGetModel, {
      sunoStyles: ['acoustic chicago blues algorave', 'k-pop', '16-bit celtic'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain(
      'genre: "acoustic chicago blues algorave, k-pop, 16-bit celtic"'
    );
  });

  it('falls back to seedGenres when sunoStyles is empty', async () => {
    const result = await convertToMaxFormat('A track', mockGetModel, {
      seedGenres: ['jazz', 'rock'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "Jazz, Rock"');
  });

  it('falls back to detected genre when both sunoStyles and seedGenres are empty', async () => {
    const result = await convertToMaxFormat(
      `Electronic vibes\nGenre: Electronic`,
      mockGetModel,
      {}
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "electronic"');
  });

  it('falls back to detected genre when options is undefined', async () => {
    const result = await convertToMaxFormat(`Ambient soundscape\nGenre: Ambient`, mockGetModel);

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "ambient"');
  });

  it('handles single sunoStyle correctly', async () => {
    const result = await convertToMaxFormat('Something', mockGetModel, {
      sunoStyles: ['lo-fi afro-cuban jazz'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "lo-fi afro-cuban jazz"');
  });

  it('maintains backward compatibility when sunoStyles not provided', async () => {
    const result = await convertToMaxFormat(`Rock anthem\nGenre: Rock`, mockGetModel, {
      seedGenres: ['metal'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "Metal"');
  });

  it('uses first word of first sunoStyle for BPM lookup', async () => {
    const result = await convertToMaxFormat('Something', mockGetModel, {
      sunoStyles: ['jazz fusion vibes'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  it('uses default BPM when sunoStyle genre is not recognized', async () => {
    const result = await convertToMaxFormat('Something', mockGetModel, {
      sunoStyles: ['urdu shoegaze'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "90"');
  });

  it('handles sunoStyles with special characters', async () => {
    const result = await convertToMaxFormat('Something', mockGetModel, {
      sunoStyles: ['afro trap r&b', 'hawaiian r&b'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('genre: "afro trap r&b, hawaiian r&b"');
  });
});

describe('convertToMaxFormat with performanceInstruments', () => {
  const mockGetModel = () => ({}) as any;

  beforeEach(async () => {
    await setupConvertToMaxFormat();
  });

  test('uses performanceInstruments in output when no instruments parsed', async () => {
    const result = await convertToMaxFormat(
      'A dreamy soundscape with lush textures',
      mockGetModel,
      { seedGenres: ['afrobeat'], performanceInstruments: ['synth strings', 'sidechain pad'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('synth strings');
    expect(result.convertedPrompt).toContain('sidechain pad');
  });

  test('uses parsed instruments over performanceInstruments', async () => {
    const result = await convertToMaxFormat(
      `A rock anthem\nInstruments: electric guitar, drums`,
      mockGetModel,
      { seedGenres: ['rock'], performanceInstruments: ['synth strings', 'sidechain pad'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('guitar');
    expect(result.convertedPrompt).toContain('drums');
    expect(result.convertedPrompt).not.toContain('synth strings');
  });

  test('handles undefined performanceInstruments', async () => {
    const result = await convertToMaxFormat('A free-form style', mockGetModel, {
      seedGenres: ['jazz'],
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('instruments:');
  });
});

describe('convertToMaxFormat with bpmRange', () => {
  const mockGetModel = () => ({}) as any;

  beforeEach(async () => {
    await setupConvertToMaxFormat();
  });

  test('uses provided bpmRange instead of genre inference', async () => {
    const result = await convertToMaxFormat('A jazz track', mockGetModel, {
      seedGenres: ['jazz'],
      bpmRange: 'between 80 and 80',
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "between 80 and 80"');
    expect(result.convertedPrompt).not.toContain('bpm: "110"');
  });

  test('falls back to genre BPM when bpmRange not provided', async () => {
    const result = await convertToMaxFormat('A jazz track', mockGetModel, { seedGenres: ['jazz'] });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "110"');
  });

  test('preserves exact bpmRange format', async () => {
    const result = await convertToMaxFormat('Some music', mockGetModel, {
      bpmRange: 'between 120 and 145',
    });

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('bpm: "between 120 and 145"');
  });
});
