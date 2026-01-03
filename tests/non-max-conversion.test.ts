import { describe, it, expect, mock, beforeEach } from 'bun:test';
import {
  parseStyleDescription,
  inferBpm,
  buildNonMaxFormatPrompt,
  convertToNonMaxFormat,
} from '../src/bun/prompt/non-max-conversion';
import { GENRE_REGISTRY } from '../src/bun/instruments/genres';

// Mock the AI SDK for conversion tests
const mockGenerateText = mock(async () => ({
  text: JSON.stringify({
    intro: 'Warm pads float in gently',
    verse: 'Instruments weave together naturally',
    chorus: 'Full arrangement reaches emotional peak',
    outro: 'Peaceful resolution and fade',
  }),
}));

mock.module('ai', () => ({
  generateText: mockGenerateText,
}));

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
    expect(bpm).toBe(GENRE_REGISTRY.jazz.bpm.typical);
  });

  it('returns correct BPM for rock genre', () => {
    const bpm = inferBpm('rock');
    expect(bpm).toBe(GENRE_REGISTRY.rock.bpm.typical);
  });

  it('returns correct BPM for electronic genre', () => {
    const bpm = inferBpm('electronic');
    expect(bpm).toBe(GENRE_REGISTRY.electronic.bpm.typical);
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
    expect(bpm).toBe(GENRE_REGISTRY.jazz.bpm.typical);
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
    expect(result.convertedPrompt).toContain('Genre: ambient');
  });

  it('calls AI to generate section content', async () => {
    await convertToNonMaxFormat('jazz music', mockGetModel);
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it('includes debug info', async () => {
    const result = await convertToNonMaxFormat('jazz music', mockGetModel);
    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.systemPrompt).toBeDefined();
    expect(result.debugInfo?.userPrompt).toBeDefined();
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
