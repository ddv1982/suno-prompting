import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';

// Mock the AI SDK for conversion tests
const mockGenerateText = mock(async () => ({
  text: JSON.stringify({
    intro: 'Warm pads float in gently',
    verse: 'Instruments weave together naturally',
    chorus: 'Full arrangement reaches emotional peak',
    outro: 'Peaceful resolution and fade',
  }),
}));

let parseStyleDescription: typeof import('@bun/prompt/conversion').parseStyleDescription;
let inferBpm: typeof import('@bun/prompt/conversion').inferBpm;
let buildNonMaxFormatPrompt: typeof import('@bun/prompt/conversion').buildNonMaxFormatPrompt;
let convertToNonMaxFormat: typeof import('@bun/prompt/conversion').convertToNonMaxFormat;

beforeEach(async () => {
  await mock.module('ai', () => ({
    generateText: mockGenerateText,
  }));

  ({
    parseStyleDescription,
    inferBpm,
    buildNonMaxFormatPrompt,
    convertToNonMaxFormat,
  } = await import('@bun/prompt/conversion'));
});

afterEach(() => {
  mock.restore();
});

// ============================================================================
// parseStyleDescription Tests
// ============================================================================

describe('parseStyleDescription', () => {
  it('detects jazz genre from keywords', () => {
    const result = parseStyleDescription('smooth jazz vibes with warm tones');
    expect(result.detectedGenre).toBe('jazz');
  });

  it('detects electronic genre from keywords', () => {
    const result = parseStyleDescription('pulsing synth textures and electronic beats');
    expect(result.detectedGenre).toBe('electronic');
  });

  it('detects ambient genre from keywords', () => {
    const result = parseStyleDescription('ethereal ambient soundscape');
    expect(result.detectedGenre).toBe('ambient');
  });

  it('detects moods from description', () => {
    const result = parseStyleDescription('warm and dreamy atmosphere with melancholic undertones');
    expect(result.detectedMoods).toContain('warm');
    expect(result.detectedMoods).toContain('dreamy');
    expect(result.detectedMoods).toContain('melancholic');
  });

  it('limits detected moods to 3', () => {
    const result = parseStyleDescription('warm dreamy melancholic dark mysterious haunting');
    expect(result.detectedMoods.length).toBeLessThanOrEqual(3);
  });

  it('detects instruments from description', () => {
    const result = parseStyleDescription('Rhodes piano with brass and soft drums');
    expect(result.detectedInstruments).toContain('piano');
    expect(result.detectedInstruments).toContain('brass');
    expect(result.detectedInstruments).toContain('drums');
  });

  it('limits detected instruments to 4', () => {
    const result = parseStyleDescription('piano guitar bass drums violin cello saxophone trumpet');
    expect(result.detectedInstruments.length).toBeLessThanOrEqual(4);
  });

  it('returns null genre when no keywords match', () => {
    const result = parseStyleDescription('completely unique unusual music');
    expect(result.detectedGenre).toBeNull();
  });

  it('preserves original description', () => {
    const input = 'warm jazz with rhodes piano';
    const result = parseStyleDescription(input);
    expect(result.description).toBe(input);
  });
});

// ============================================================================
// inferBpm Tests
// ============================================================================

describe('inferBpm', () => {
  it('returns correct BPM for jazz genre', () => {
    const bpm = inferBpm('jazz');
    expect(bpm).toBe(GENRE_REGISTRY.jazz.bpm!.typical);
  });

  it('returns correct BPM for rock genre', () => {
    const bpm = inferBpm('rock');
    expect(bpm).toBe(GENRE_REGISTRY.rock.bpm!.typical);
  });

  it('returns correct BPM for electronic genre', () => {
    const bpm = inferBpm('electronic');
    expect(bpm).toBe(GENRE_REGISTRY.electronic.bpm!.typical);
  });

  it('returns default BPM (90) for null genre', () => {
    const bpm = inferBpm(null);
    expect(bpm).toBe(90);
  });

  it('returns default BPM for unknown genre', () => {
    const bpm = inferBpm('unknowngenrexyz');
    expect(bpm).toBe(90);
  });

  it('handles case insensitivity', () => {
    const bpm = inferBpm('JAZZ');
    // Should match 'jazz' in registry after lowercase normalization
    expect(bpm).toBe(GENRE_REGISTRY.jazz.bpm!.typical);
  });
});

// ============================================================================
// buildNonMaxFormatPrompt Tests
// ============================================================================

describe('buildNonMaxFormatPrompt', () => {
  const testFields = {
    genre: 'jazz',
    bpm: 110,
    mood: 'warm, smooth, groovy',
    instruments: 'Rhodes piano, upright bass, brushed drums',
    sections: {
      intro: 'Warm Rhodes chords float in',
      verse: 'Bass walks gently beneath',
      chorus: 'Full arrangement swells',
      outro: 'Fading into silence',
    },
  };

  it('includes header line with mood and genre', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('[warm, smooth, groovy, jazz]');
  });

  it('includes Genre line', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('Genre: jazz');
  });

  it('includes BPM line', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('BPM: 110');
  });

  it('includes Mood line', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('Mood: warm, smooth, groovy');
  });

  it('includes Instruments line', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('Instruments: Rhodes piano, upright bass, brushed drums');
  });

  it('includes section tags', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('[INTRO]');
    expect(result).toContain('[VERSE]');
    expect(result).toContain('[CHORUS]');
    expect(result).toContain('[OUTRO]');
  });

  it('includes section content', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).toContain('Warm Rhodes chords float in');
    expect(result).toContain('Bass walks gently beneath');
    expect(result).toContain('Full arrangement swells');
    expect(result).toContain('Fading into silence');
  });

  it('includes optional bridge when provided', () => {
    const fieldsWithBridge = {
      ...testFields,
      sections: {
        ...testFields.sections,
        bridge: 'Unexpected harmonic shift',
      },
    };
    const result = buildNonMaxFormatPrompt(fieldsWithBridge);
    expect(result).toContain('[BRIDGE]');
    expect(result).toContain('Unexpected harmonic shift');
  });

  it('does not include MAX_MODE header', () => {
    const result = buildNonMaxFormatPrompt(testFields);
    expect(result).not.toContain('[Is_MAX_MODE:');
    expect(result).not.toContain('MAX](MAX)');
  });
});

// ============================================================================
// convertToNonMaxFormat Tests
// ============================================================================

describe('convertToNonMaxFormat', () => {
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
  });

  it('returns wasConverted as true', async () => {
    const result = await convertToNonMaxFormat(
      'warm jazz with rhodes piano',
      mockGetModel
    );
    expect(result.wasConverted).toBe(true);
  });

  it('returns a structured prompt', async () => {
    const result = await convertToNonMaxFormat(
      'ethereal ambient soundscape with soft pads',
      mockGetModel
    );

    expect(result.convertedPrompt).toContain('Genre:');
    expect(result.convertedPrompt).toContain('BPM:');
    expect(result.convertedPrompt).toContain('Mood:');
    expect(result.convertedPrompt).toContain('Instruments:');
    expect(result.convertedPrompt).toContain('[INTRO]');
    expect(result.convertedPrompt).toContain('[VERSE]');
    expect(result.convertedPrompt).toContain('[CHORUS]');
    expect(result.convertedPrompt).toContain('[OUTRO]');
  });

  it('injects vocal style tags into instruments from performance guidance (not style text)', async () => {
    const result = await convertToNonMaxFormat(
      'ambient metal with baritone guitar and crystalline synth pads.',
      mockGetModel,
      { seedGenres: ['ambient metal'], performanceVocalStyle: 'Alto, Breathy Delivery, Shouted Hooks' }
    );

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('instruments:');
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
  });

  it('caps instruments list while preserving injected vocal style tags', async () => {
    const result = await convertToNonMaxFormat(
      'ambient metal with many layers.',
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

    const content = instrumentsLine?.split(':')[1]?.trim() ?? '';
    const items = content
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    expect(items.length).toBeLessThanOrEqual(6);

    const lower = result.convertedPrompt.toLowerCase();
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
  });

  it('detects genre from style description', async () => {
    const result = await convertToNonMaxFormat(
      'smooth jazz vibes with warm tones',
      mockGetModel
    );
    expect(result.convertedPrompt).toContain('Genre: jazz');
  });

  it('uses default genre when none detected', async () => {
    const result = await convertToNonMaxFormat(
      'unique experimental sounds',
      mockGetModel
    );
    expect(result.convertedPrompt).toContain('Genre: pop');
  });

  it('calls AI to generate section content', async () => {
    await convertToNonMaxFormat('jazz music', mockGetModel);
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it('does not include MAX_MODE header', async () => {
    const result = await convertToNonMaxFormat(
      'jazz with rhodes piano',
      mockGetModel
    );
    expect(result.convertedPrompt).not.toContain('[Is_MAX_MODE:');
    expect(result.convertedPrompt).not.toContain('MAX](MAX)');
  });
});

// ============================================================================
// Task 4.3: Suno V5 Styles Integration Tests
// ============================================================================

describe('convertToNonMaxFormat with sunoStyles', () => {
  const mockGetModel = () => ({} as any);

  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: JSON.stringify({
        intro: 'Warm pads float in',
        verse: 'Instruments weave together',
        chorus: 'Full arrangement peaks',
        outro: 'Peaceful fade',
      }),
    }));
  });

  it('prioritizes sunoStyles over seedGenres', async () => {
    const result = await convertToNonMaxFormat(
      'A cool track',
      mockGetModel,
      { seedGenres: ['jazz'], sunoStyles: ['cumbia metal'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: cumbia metal');
    expect(result.convertedPrompt).not.toContain('Genre: Jazz');
  });

  it('prioritizes sunoStyles over detected genre', async () => {
    const result = await convertToNonMaxFormat(
      'smooth jazz vibes with warm tones',  // Would detect "jazz"
      mockGetModel,
      { sunoStyles: ['dark goa trance'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: dark goa trance');
    expect(result.convertedPrompt).not.toContain('Genre: jazz');
  });

  it('injects multiple sunoStyles comma-separated', async () => {
    const result = await convertToNonMaxFormat(
      'Something cool',
      mockGetModel,
      { sunoStyles: ['jazz', 'cumbia metal', 'dark goa trance'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: jazz, cumbia metal, dark goa trance');
  });

  it('injects sunoStyles exactly as-is without transformation', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['acoustic chicago blues algorave', 'k-pop', '16-bit celtic'] }
    );

    expect(result.wasConverted).toBe(true);
    // Must be exactly as-is (lowercase, no title-case transformation)
    expect(result.convertedPrompt).toContain('Genre: acoustic chicago blues algorave, k-pop, 16-bit celtic');
  });

  it('falls back to seedGenres when sunoStyles is empty', async () => {
    const result = await convertToNonMaxFormat(
      'A track',
      mockGetModel,
      { seedGenres: ['jazz', 'rock'] }
    );

    expect(result.wasConverted).toBe(true);
    // seedGenres get formatted with display names (title case)
    expect(result.convertedPrompt).toContain('Genre: Jazz, Rock');
  });

  it('falls back to detected genre when both sunoStyles and seedGenres are empty', async () => {
    const result = await convertToNonMaxFormat(
      'electronic vibes with synth',  // Should detect "electronic"
      mockGetModel,
      {}
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: electronic');
  });

  it('falls back to detected genre when options is undefined', async () => {
    const result = await convertToNonMaxFormat(
      'ambient soundscape ethereal',  // Should detect "ambient"
      mockGetModel
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: ambient');
  });

  it('handles single sunoStyle correctly', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['lo-fi afro-cuban jazz'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: lo-fi afro-cuban jazz');
  });

  it('maintains backward compatibility when sunoStyles not provided', async () => {
    // Call with only seedGenres
    const result = await convertToNonMaxFormat(
      'Something neutral',
      mockGetModel,
      { seedGenres: ['metal'] }
    );

    expect(result.wasConverted).toBe(true);
    // Should use seedGenres with display name formatting
    expect(result.convertedPrompt).toContain('Genre: Metal');
  });

  it('uses first word of first sunoStyle for BPM lookup', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['jazz fusion vibes'] }
    );

    expect(result.wasConverted).toBe(true);
    // Jazz has typical BPM of 110
    expect(result.convertedPrompt).toContain('BPM: 110');
  });

  it('uses default BPM when sunoStyle genre is not recognized', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['urdu shoegaze'] }
    );

    expect(result.wasConverted).toBe(true);
    // Should fall back to default BPM of 90
    expect(result.convertedPrompt).toContain('BPM: 90');
  });

  it('handles sunoStyles with special characters', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['afro trap r&b', 'hawaiian r&b'] }
    );

    expect(result.wasConverted).toBe(true);
    expect(result.convertedPrompt).toContain('Genre: afro trap r&b, hawaiian r&b');
  });

  it('sunoStyles appear in header line as well', async () => {
    const result = await convertToNonMaxFormat(
      'Something',
      mockGetModel,
      { sunoStyles: ['cumbia metal'] }
    );

    expect(result.wasConverted).toBe(true);
    // Header line format: [mood, genre]
    expect(result.convertedPrompt).toContain('cumbia metal]');
  });
});
