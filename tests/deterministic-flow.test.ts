/**
 * Integration tests for deterministic generation flow.
 *
 * Verifies that deterministic prompt generation works correctly
 * without LLM calls and produces reproducible output.
 *
 * @module tests/deterministic-flow
 */

import { describe, expect, test } from 'bun:test';

import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
} from '@bun/prompt/deterministic';
import { buildDeterministicQuickVibes } from '@bun/prompt/quick-vibes';
import { generateDeterministicTitle } from '@bun/prompt/title';

describe('Deterministic Generation Flow', () => {
  describe('Full Prompt Mode', () => {
    test('generates complete max prompt without LLM', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'upbeat jazz track',
        genreOverride: 'jazz',
      });

      expect(result.text).toContain('[Is_MAX_MODE: MAX]');
      expect(result.text).toContain('genre:');
      expect(result.text).toContain('instruments:');
      expect(result.text).toContain('bpm:');
      expect(result.genre).toBe('jazz');
    });

    test('generates complete standard prompt without LLM', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'sad piano ballad',
        genreOverride: 'classical',
      });

      // Standard mode uses bracket header format
      expect(result.text).toContain('[');
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('Instruments:');
      expect(result.genre).toBe('classical');
    });

    test('generates max prompt with detected genre', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'smooth jazz night session with saxophone',
      });

      expect(result.text).toContain('[Is_MAX_MODE: MAX]');
      expect(result.genre).toBe('jazz');
    });

    test('generates standard prompt with detected genre', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'heavy metal riffs and drums',
      });

      expect(result.text).toContain('[');
      expect(result.genre).toBe('metal');
    });

    test('handles multi-genre strings', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'fusion track',
        genreOverride: 'jazz rock',
      });

      expect(result.text).toContain('jazz rock');
      expect(result.genre).toBe('jazz'); // Primary genre
    });

    test('falls back to random genre when none detected', () => {
      const rng = () => 0.1; // Fixed seed for reproducibility
      const result = buildDeterministicMaxPrompt({
        description: 'something cool and interesting',
        rng,
      });

      // Should have some genre assigned
      expect(result.text).toContain('genre:');
      expect(result.genre).toBeDefined();
    });
  });

  describe('Title Generation', () => {
    test('generates title deterministically', () => {
      const title = generateDeterministicTitle('jazz', 'smooth');

      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    });

    test('generates title for different genres', () => {
      const jazzTitle = generateDeterministicTitle('jazz', 'smooth');
      const rockTitle = generateDeterministicTitle('rock', 'energetic');
      const ambientTitle = generateDeterministicTitle('ambient', 'calm');

      expect(jazzTitle.length).toBeGreaterThan(0);
      expect(rockTitle.length).toBeGreaterThan(0);
      expect(ambientTitle.length).toBeGreaterThan(0);
    });

    test('handles unknown genre gracefully', () => {
      const title = generateDeterministicTitle('unknowngenre', 'neutral');

      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Vibes Mode', () => {
    test('generates quick vibes deterministically for lofi-study category', () => {
      const result = buildDeterministicQuickVibes('lofi-study', false);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('generates quick vibes deterministically for cafe-coffeeshop category', () => {
      const result = buildDeterministicQuickVibes('cafe-coffeeshop', false);

      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
    });

    test('generates quick vibes deterministically for ambient-focus category', () => {
      const result = buildDeterministicQuickVibes('ambient-focus', false);

      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
    });

    test('generates quick vibes in max mode format', () => {
      const result = buildDeterministicQuickVibes(
        'lofi-study',
        true
      );

      // MAX mode uses lowercase field names with quoted values
      expect(result.text).toContain('genre:');
      expect(result.text).toContain('"'); // Quoted values in max mode
    });

    test('generates quick vibes in standard mode format', () => {
      const result = buildDeterministicQuickVibes(
        'lofi-study',
        false
      );

      expect(result.text).toContain('Instruments:');
      expect(result.text).not.toContain('genre: "'); // No quoted genre in standard mode
    });
  });

  describe('Reproducibility', () => {
    test('same seed produces same max prompt output', () => {
      const rng = () => 0.5; // Fixed seed

      const result1 = buildDeterministicMaxPrompt({
        description: 'test description',
        rng,
      });

      // Create new rng with same behavior
      const rng2 = () => 0.5;

      const result2 = buildDeterministicMaxPrompt({
        description: 'test description',
        rng: rng2,
      });

      expect(result1.text).toBe(result2.text);
      expect(result1.genre).toBe(result2.genre);
    });

    test('same seed produces same standard prompt output', () => {
      const rng = () => 0.5;

      const result1 = buildDeterministicStandardPrompt({
        description: 'test description',
        rng,
      });

      const rng2 = () => 0.5;

      const result2 = buildDeterministicStandardPrompt({
        description: 'test description',
        rng: rng2,
      });

      expect(result1.text).toBe(result2.text);
      expect(result1.genre).toBe(result2.genre);
    });

    test('same seed produces same quick vibes output', () => {
      const rng = () => 0.5;

      const result1 = buildDeterministicQuickVibes('lofi-study', false, rng);

      const rng2 = () => 0.5;

      const result2 = buildDeterministicQuickVibes('lofi-study', false, rng2);

      expect(result1.text).toBe(result2.text);
      expect(result1.title).toBe(result2.title);
    });

    test('different seeds produce different outputs', () => {
      const rng1 = () => 0.1;
      const rng2 = () => 0.9;

      const result1 = buildDeterministicMaxPrompt({
        description: 'test',
        rng: rng1,
      });

      const result2 = buildDeterministicMaxPrompt({
        description: 'test',
        rng: rng2,
      });

      // Different seeds should likely produce different outputs
      // (though technically could match by chance)
      expect(result1.text !== result2.text || result1.genre !== result2.genre).toBe(true);
    });
  });

  describe('Output Format Validation', () => {
    test('max prompt contains required fields', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'jazz track',
        genreOverride: 'jazz',
      });

      // Check for MAX MODE header (standard format with bracket tags)
      expect(result.text).toContain('[Is_MAX_MODE: MAX]');
      expect(result.text).toContain('[QUALITY: MAX]');
      expect(result.text).toContain('[REALISM: MAX]');
      expect(result.text).toContain('[REAL_INSTRUMENTS: MAX]');

      // Check for required metadata fields
      expect(result.text).toContain('genre:');
      expect(result.text).toContain('bpm:');
      expect(result.text).toContain('instruments:');
      expect(result.text).toContain('style tags:');
      expect(result.text).toContain('recording:');
    });

    test('standard prompt contains required fields', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'jazz track',
        genreOverride: 'jazz',
      });

      // Check for bracket header
      expect(result.text).toMatch(/^\[.+\]/);

      // Check for required fields
      expect(result.text).toContain('Genre:');
      expect(result.text).toContain('BPM:');
      expect(result.text).toContain('Mood:');
      expect(result.text).toContain('Instruments:');
      expect(result.text).toContain('Style Tags:');
      expect(result.text).toContain('Recording:');

      // Check for section templates
      expect(result.text).toContain('[INTRO]');
      expect(result.text).toContain('[VERSE]');
      expect(result.text).toContain('[CHORUS]');
    });

    test('prompt respects character limit', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'a very long description '.repeat(100),
        genreOverride: 'jazz',
      });

      // MAX_CHARS is 1000 by default
      expect(result.text.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Metadata Generation', () => {
    test('max prompt includes metadata when available', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'jazz track',
        genreOverride: 'jazz',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.usedGenre).toBe('jazz');
      expect(result.metadata?.instruments).toBeDefined();
      expect(result.metadata?.instruments?.length).toBeGreaterThan(0);
      expect(result.metadata?.chordProgression).toBeDefined();
      expect(result.metadata?.vocalStyle).toBeDefined();
      expect(result.metadata?.styleTags).toBeDefined();
      expect(result.metadata?.recordingContext).toBeDefined();
    });

    test('standard prompt includes metadata when available', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'rock track',
        genreOverride: 'rock',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.usedGenre).toBe('rock');
      expect(result.metadata?.instruments).toBeDefined();
    });
  });
});
