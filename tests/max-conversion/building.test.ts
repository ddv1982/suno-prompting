import { describe, it, test, expect } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { inferBpm, buildMaxFormatPrompt } from '@bun/prompt/conversion';
import { enhanceInstruments } from '@bun/prompt/conversion-utils';

describe('inferBpm', () => {
  it('returns typical BPM for known genres', () => {
    expect(inferBpm('ambient')).toBe(65);
    expect(inferBpm('rock')).toBe(120);
    expect(inferBpm('jazz')).toBe(110);
    expect(inferBpm('trap')).toBe(145);
  });

  it('handles genre aliases', () => {
    const trapBpm = GENRE_REGISTRY.trap.bpm!.typical;
    expect(inferBpm('hip-hop')).toBe(trapBpm);
    expect(inferBpm('hip hop')).toBe(trapBpm);

    const lofiBpm = GENRE_REGISTRY.lofi.bpm!.typical;
    expect(inferBpm('lo-fi')).toBe(lofiBpm);
    expect(inferBpm('lo fi')).toBe(lofiBpm);

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

describe('enhanceInstruments priority', () => {
  test('uses parsed instruments when provided', () => {
    const parsedInstruments = ['piano', 'guitar'];
    const performanceInstruments = ['synth strings', 'sidechain pad'];

    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    expect(result).toContain('piano');
    expect(result).toContain('guitar');
    expect(result).not.toContain('synth strings');
  });

  test('uses performanceInstruments when parsed is empty', () => {
    const parsedInstruments: string[] = [];
    const performanceInstruments = ['synth strings', 'sidechain pad'];

    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    expect(result).toContain('synth strings');
    expect(result).toContain('sidechain pad');
  });

  test('falls back to genre selection when both are empty', () => {
    const parsedInstruments: string[] = [];
    const performanceInstruments: string[] = [];

    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, performanceInstruments);

    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('ambient pad, subtle textures');
  });

  test('uses default fallback for unknown genre when both are empty', () => {
    const parsedInstruments: string[] = [];

    const result = enhanceInstruments(parsedInstruments, 'unknowngenre', 'my fallback');

    expect(result).toBe('my fallback');
  });

  test('handles undefined performanceInstruments', () => {
    const parsedInstruments: string[] = [];

    const result = enhanceInstruments(parsedInstruments, 'jazz', undefined, undefined);

    expect(result.length).toBeGreaterThan(0);
  });
});
