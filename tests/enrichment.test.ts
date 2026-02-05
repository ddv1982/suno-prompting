import { describe, test, expect } from 'bun:test';

import {
  extractGenresFromSunoStyles,
  enrichFromGenres,
  enrichSunoStyles,
  buildMaxModeEnrichedLines,
  buildStandardModeEnrichedLines,
  buildEnrichedSunoStylePrompt,
  hasExtractableGenres,
  _testHelpers,
  type EnrichmentResult,
} from '@bun/prompt/enrichment';

// Seeded RNG for deterministic tests
const createSeededRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

describe('enrichment module', () => {
  describe('extractGenresFromSunoStyles', () => {
    test('extracts direct genre matches', () => {
      expect(extractGenresFromSunoStyles(['jazz'])).toEqual(['jazz']);
      expect(extractGenresFromSunoStyles(['rock'])).toEqual(['rock']);
      expect(extractGenresFromSunoStyles(['ambient'])).toEqual(['ambient']);
    });

    test('extracts multiple genres from single style', () => {
      const result = extractGenresFromSunoStyles(['afrobeat disco']);
      expect(result).toContain('afrobeat');
      expect(result).toContain('disco');
    });

    test('extracts genres from compound style names', () => {
      const result = extractGenresFromSunoStyles(['acoustic rock chillsynth']);
      expect(result).toContain('rock');
    });

    test('maps shoegaze to dreampop', () => {
      const result = extractGenresFromSunoStyles(['dreamy shoegaze']);
      expect(result).toContain('dreampop');
    });

    test('maps lofi variations to lofi', () => {
      // Note: 'lo-fi' gets split to 'lo' and 'fi' which don't match, but 'lofi' does
      expect(extractGenresFromSunoStyles(['lofi beats'])).toContain('lofi');
      expect(extractGenresFromSunoStyles(['lofi hip-hop'])).toContain('lofi');
    });

    test('maps electronic variants to electronic', () => {
      expect(extractGenresFromSunoStyles(['techno beats'])).toContain('electronic');
      expect(extractGenresFromSunoStyles(['edm dance'])).toContain('electronic');
    });

    test('handles multiple styles', () => {
      const result = extractGenresFromSunoStyles(['dreamy shoegaze', 'afrobeat disco']);
      expect(result).toContain('dreampop');
      expect(result).toContain('afrobeat');
      expect(result).toContain('disco');
    });

    test('returns empty array when no genres found', () => {
      expect(extractGenresFromSunoStyles(['completely unknown style'])).toEqual([]);
      expect(extractGenresFromSunoStyles([])).toEqual([]);
    });

    test('handles hyphenated style names', () => {
      const result = extractGenresFromSunoStyles(['deep-house']);
      expect(result).toContain('house');
    });

    test('handles mixed case', () => {
      const result = extractGenresFromSunoStyles(['JAZZ FUSION']);
      expect(result).toContain('jazz');
    });
  });

  describe('enrichFromGenres', () => {
    const rng = createSeededRng(12345);

    test('returns complete enrichment result with all fields', () => {
      const result = enrichFromGenres(['jazz'], rng);

      expect(result.moods).toBeDefined();
      expect(result.moods.length).toBeGreaterThan(0);
      expect(result.instruments).toBeDefined();
      expect(result.instruments.length).toBeGreaterThan(0);
      expect(result.instrumentsFormatted).toBeDefined();
      expect(result.vocalStyle).toBeDefined();
      expect(result.production).toBeDefined();
      expect(result.styleTags).toBeDefined();
      expect(result.chordProgression).toBeDefined();
      expect(result.bpmRange).toMatch(/between \d+ and \d+/);
    });

    test('handles multiple genres', () => {
      const result = enrichFromGenres(['jazz', 'rock'], rng);

      expect(result.moods.length).toBeGreaterThan(0);
      expect(result.instruments.length).toBeGreaterThan(0);
    });

    test('returns default enrichment for empty genres', () => {
      const result = enrichFromGenres([], rng);

      // Should default to pop
      expect(result.moods.length).toBeGreaterThan(0);
      expect(result.bpmRange).toMatch(/between \d+ and \d+/);
    });

    test('production includes texture and reverb', () => {
      const result = enrichFromGenres(['ambient'], rng);

      // Production should be a comma-separated string
      expect(result.production).toContain(',');
    });

    test('vocal style includes range and delivery', () => {
      const result = enrichFromGenres(['soul'], rng);

      // Vocal style should include range and delivery
      expect(result.vocalStyle).toContain('Delivery');
    });
  });

  describe('enrichSunoStyles', () => {
    const rng = createSeededRng(54321);

    test('preserves raw styles exactly', () => {
      const styles = ['dreamy shoegaze', 'ethereal ambient'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.rawStyles).toEqual(styles);
    });

    test('extracts genres from styles', () => {
      const styles = ['afrobeat disco'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.extractedGenres).toContain('afrobeat');
      expect(result.extractedGenres).toContain('disco');
    });

    test('provides enrichment based on extracted genres', () => {
      const styles = ['jazz fusion'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.enrichment.moods.length).toBeGreaterThan(0);
      expect(result.enrichment.instruments.length).toBeGreaterThan(0);
    });

    test('uses default enrichment when no genres extracted', () => {
      const styles = ['completely unknown style xyz'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.extractedGenres).toEqual([]);
      // Should still have enrichment (defaulting to pop)
      expect(result.enrichment.moods.length).toBeGreaterThan(0);
    });
  });

  describe('buildMaxModeEnrichedLines', () => {
    const mockEnrichment: EnrichmentResult = {
      moods: ['ethereal', 'dreamy', 'hypnotic'],
      instruments: ['guitar', 'synth'],
      instrumentsFormatted: 'Shimmering guitar, ethereal synth pad',
      vocalStyle: 'Alto, Breathy Delivery',
      production: 'Analog Warmth, Wide Stereo Reverb',
      styleTags: ['ethereal', 'dreamy', 'analog warmth'],
      chordProgression: 'I-IV-vi-V (Pop Standard) harmony',
      bpmRange: 'between 80 and 100',
    };

    test('includes MAX mode headers', () => {
      const lines = buildMaxModeEnrichedLines(['dreamy shoegaze'], mockEnrichment);

      expect(lines[0]).toBe('[Is_MAX_MODE: MAX](MAX)');
      expect(lines[1]).toBe('[QUALITY: MAX](MAX)');
      expect(lines[2]).toBe('[REALISM: MAX](MAX)');
      expect(lines[3]).toBe('[REAL_INSTRUMENTS: MAX](MAX)');
    });

    test('preserves Suno styles exactly in genre field', () => {
      const styles = ['dreamy shoegaze', 'ethereal ambient'];
      const lines = buildMaxModeEnrichedLines(styles, mockEnrichment);

      const genreLine = lines.find((l) => l.startsWith('genre:'));
      expect(genreLine).toBe('genre: "dreamy shoegaze, ethereal ambient"');
    });

    test('includes enriched fields', () => {
      const lines = buildMaxModeEnrichedLines(['rock'], mockEnrichment);
      const joined = lines.join('\n');

      expect(joined).toContain('bpm: "between 80 and 100"');
      expect(joined).toContain('instruments: "Shimmering guitar, ethereal synth pad"');
      expect(joined).toContain('style tags:');
      expect(joined).toContain('recording:');
    });
  });

  describe('buildStandardModeEnrichedLines', () => {
    const mockEnrichment: EnrichmentResult = {
      moods: ['smooth', 'warm', 'sophisticated'],
      instruments: ['piano', 'bass'],
      instrumentsFormatted: 'Warm piano, walking bass',
      vocalStyle: 'Tenor, Smooth Delivery',
      production: 'Intimate Recording, Lounge Club Reverb',
      styleTags: ['smooth', 'warm', 'intimate'],
      chordProgression: 'ii-V-I (Jazz Standard) harmony',
      bpmRange: 'between 100 and 140',
    };

    test('includes header with moods and styles', () => {
      const lines = buildStandardModeEnrichedLines(['jazz fusion'], mockEnrichment);

      expect(lines[0]).toBe('[smooth, warm, jazz fusion]');
    });

    test('preserves styles in Genre field', () => {
      const styles = ['cool jazz', 'bossa nova'];
      const lines = buildStandardModeEnrichedLines(styles, mockEnrichment);

      const genreLine = lines.find((l) => l.startsWith('Genre:'));
      expect(genreLine).toBe('Genre: cool jazz, bossa nova');
    });

    test('includes all enriched metadata', () => {
      const lines = buildStandardModeEnrichedLines(['funk'], mockEnrichment);
      const joined = lines.join('\n');

      expect(joined).toContain('BPM: between 100 and 140');
      expect(joined).toContain('Mood: smooth, warm, sophisticated');
      expect(joined).toContain('Instruments:');
      expect(joined).toContain('Style Tags:');
      expect(joined).toContain('Recording:');
    });
  });

  describe('buildEnrichedSunoStylePrompt', () => {
    const rng = createSeededRng(99999);

    test('returns prompt and metadata', () => {
      const result = buildEnrichedSunoStylePrompt(['dreamy shoegaze'], { maxMode: false, rng });

      expect(result.prompt).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.rawStyles).toEqual(['dreamy shoegaze']);
    });

    test('max mode produces MAX headers', () => {
      const result = buildEnrichedSunoStylePrompt(['rock'], { maxMode: true, rng });

      expect(result.prompt).toContain('[Is_MAX_MODE: MAX]');
      expect(result.prompt).toContain('genre: "rock"');
    });

    test('standard mode produces standard format', () => {
      const result = buildEnrichedSunoStylePrompt(['jazz'], { maxMode: false, rng });

      expect(result.prompt).not.toContain('[Is_MAX_MODE: MAX]');
      expect(result.prompt).toContain('Genre: jazz');
    });

    test('styles are preserved exactly in output', () => {
      const originalStyles = ['dreamy shoegaze', 'acoustic folk rock'];
      const result = buildEnrichedSunoStylePrompt(originalStyles, { maxMode: false, rng });

      expect(result.prompt).toContain('dreamy shoegaze, acoustic folk rock');
    });
  });

  describe('hasExtractableGenres', () => {
    test('returns true when genres can be extracted', () => {
      expect(hasExtractableGenres(['jazz'])).toBe(true);
      expect(hasExtractableGenres(['dreamy shoegaze'])).toBe(true);
      expect(hasExtractableGenres(['afrobeat disco'])).toBe(true);
    });

    test('returns false when no genres can be extracted', () => {
      expect(hasExtractableGenres(['completely unknown'])).toBe(false);
      expect(hasExtractableGenres([])).toBe(false);
    });
  });

  describe('enrichment integration', () => {
    test('full flow: styles → extraction → enrichment → prompt', () => {
      const rng = createSeededRng(42);
      const styles = ['dreamy shoegaze', 'indie rock'];

      // 1. Extract genres
      const genres = extractGenresFromSunoStyles(styles);
      expect(genres.length).toBeGreaterThan(0);

      // 2. Enrich from genres
      const enrichment = enrichFromGenres(genres, rng);
      expect(enrichment.moods.length).toBeGreaterThan(0);

      // 3. Build prompt
      const result = buildEnrichedSunoStylePrompt(styles, { maxMode: true, rng });

      // Styles should be preserved
      expect(result.prompt).toContain('dreamy shoegaze, indie rock');

      // Should have enriched content
      expect(result.prompt).toContain('instruments:');
      expect(result.prompt).toContain('style tags:');
    });

    test('enrichment produces consistent structure with same RNG', () => {
      const styles = ['electronic ambient'];
      const rng = createSeededRng(100);

      const result = buildEnrichedSunoStylePrompt(styles, { maxMode: true, rng });

      // Verify structure is correct (determinism depends on underlying functions)
      expect(result.prompt).toContain('[Is_MAX_MODE: MAX]');
      expect(result.prompt).toContain('genre: "electronic ambient"');
      expect(result.prompt).toContain('instruments:');
      expect(result.prompt).toContain('style tags:');
      expect(result.prompt).toContain('recording:');
      expect(result.metadata.extractedGenres).toContain('electronic');
      expect(result.metadata.extractedGenres).toContain('ambient');
    });
  });

  describe('input validation', () => {
    const rng = createSeededRng(11111);

    test('filters out empty strings', () => {
      const styles = ['jazz', '', '  ', 'rock'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.rawStyles).toEqual(['jazz', 'rock']);
    });

    test('handles array with only empty strings', () => {
      const styles = ['', '  ', '\t'];
      const result = enrichSunoStyles(styles, rng);

      expect(result.rawStyles).toEqual([]);
      // Should still have default enrichment
      expect(result.enrichment.moods.length).toBeGreaterThan(0);
    });

    test('handles mixed valid and invalid entries', () => {
      const styles = ['', 'dreamy shoegaze', null as unknown as string, 'jazz'];
      const result = enrichSunoStyles(styles, rng);

      // Should filter out empty and null
      expect(result.rawStyles).toEqual(['dreamy shoegaze', 'jazz']);
      expect(result.extractedGenres).toContain('dreampop');
      expect(result.extractedGenres).toContain('jazz');
    });
  });

  describe('test helpers', () => {
    test('exposes getDefaultEnrichment', () => {
      expect(_testHelpers.getDefaultEnrichment).toBeDefined();
      expect(typeof _testHelpers.getDefaultEnrichment).toBe('function');
    });

    test('exposes SUNO_STYLE_GENRE_MAP', () => {
      expect(_testHelpers.SUNO_STYLE_GENRE_MAP).toBeDefined();
      expect(_testHelpers.SUNO_STYLE_GENRE_MAP.jazz).toBe('jazz');
      expect(_testHelpers.SUNO_STYLE_GENRE_MAP.shoegaze).toBe('dreampop');
    });

    test('getDefaultEnrichment returns pop-based enrichment', () => {
      const rng = createSeededRng(777);
      const result = _testHelpers.getDefaultEnrichment(rng);

      expect(result.moods.length).toBeGreaterThan(0);
      expect(result.instruments.length).toBeGreaterThan(0);
      expect(result.bpmRange).toMatch(/between \d+ and \d+/);
    });
  });
}); // end of enrichment module describe
