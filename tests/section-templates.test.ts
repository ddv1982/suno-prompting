import { describe, it, expect } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  buildSection,
  buildAllSections,
  getSectionTypes,
  getSectionTemplate,
} from '@bun/prompt/sections';

import type { GenreType } from '@bun/instruments/genres';
import type { SectionType } from '@bun/prompt/sections';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 *
 * @param seed - Starting seed value
 * @returns Deterministic RNG function
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters from Numerical Recipes
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Check if a string contains uninterpolated placeholders.
 *
 * @param text - Text to check
 * @returns True if placeholders remain
 */
function hasUninterpolatedPlaceholders(text: string): boolean {
  return /\{[^}]+\}/.test(text);
}

// =============================================================================
// Tests: Type Definitions and Exports
// =============================================================================

describe('section-templates', () => {
  describe('getSectionTypes', () => {
    it('returns all five section types', () => {
      const types = getSectionTypes();
      expect(types).toContain('INTRO');
      expect(types).toContain('VERSE');
      expect(types).toContain('CHORUS');
      expect(types).toContain('BRIDGE');
      expect(types).toContain('OUTRO');
      expect(types.length).toBe(5);
    });
  });

  describe('getSectionTemplate', () => {
    it('returns template for INTRO', () => {
      const template = getSectionTemplate('INTRO');
      expect(template.type).toBe('INTRO');
      expect(template.templates.length).toBeGreaterThan(0);
      expect(template.energy).toBe('low');
    });

    it('returns template for VERSE', () => {
      const template = getSectionTemplate('VERSE');
      expect(template.type).toBe('VERSE');
      expect(template.instrumentCount).toBe(2);
      expect(template.energy).toBe('medium');
    });

    it('returns template for CHORUS', () => {
      const template = getSectionTemplate('CHORUS');
      expect(template.type).toBe('CHORUS');
      expect(template.energy).toBe('high');
    });

    it('returns template for BRIDGE', () => {
      const template = getSectionTemplate('BRIDGE');
      expect(template.type).toBe('BRIDGE');
      expect(template.instrumentCount).toBe(1);
    });

    it('returns template for OUTRO', () => {
      const template = getSectionTemplate('OUTRO');
      expect(template.type).toBe('OUTRO');
      expect(template.energy).toBe('low');
    });
  });

  // =============================================================================
  // Tests: Single Section Building
  // =============================================================================

  describe('buildSection', () => {
    describe('template interpolation', () => {
      it('interpolates all placeholders for INTRO', () => {
        const result = buildSection('INTRO', {
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('interpolates all placeholders for VERSE', () => {
        const result = buildSection('VERSE', {
          genre: 'rock',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('interpolates all placeholders for CHORUS', () => {
        const result = buildSection('CHORUS', {
          genre: 'pop',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('interpolates all placeholders for BRIDGE', () => {
        const result = buildSection('BRIDGE', {
          genre: 'electronic',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('interpolates all placeholders for OUTRO', () => {
        const result = buildSection('OUTRO', {
          genre: 'ambient',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });
    });

    describe('section format', () => {
      it('prefixes output with section tag', () => {
        const result = buildSection('VERSE', {
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/^\[VERSE\]/);
      });

      it('returns correct section type', () => {
        const result = buildSection('CHORUS', {
          genre: 'rock',
          rng: createSeededRng(12345),
        });
        expect(result.type).toBe('CHORUS');
      });

      it('returns non-empty text', () => {
        const result = buildSection('INTRO', {
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text.length).toBeGreaterThan(10);
      });
    });

    describe('instrument selection', () => {
      it('returns instruments array for each section', () => {
        const result = buildSection('VERSE', {
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.instruments).toBeDefined();
        expect(result.instruments.length).toBeGreaterThan(0);
      });

      it('uses genre-specific instruments for jazz', () => {
        const result = buildSection('CHORUS', {
          genre: 'jazz',
          rng: createSeededRng(42),
        });
        // Jazz instruments typically include Rhodes, piano, sax, etc.
        // We just verify we got some instruments
        expect(result.instruments.length).toBeGreaterThan(0);
      });

      it('uses genre-specific instruments for rock', () => {
        const result = buildSection('VERSE', {
          genre: 'rock',
          rng: createSeededRng(42),
        });
        expect(result.instruments.length).toBeGreaterThan(0);
      });

      it('uses genre-specific instruments for electronic', () => {
        const result = buildSection('INTRO', {
          genre: 'electronic',
          rng: createSeededRng(42),
        });
        expect(result.instruments.length).toBeGreaterThan(0);
      });
    });

    describe('mood selection', () => {
      it('returns moods array', () => {
        const result = buildSection('VERSE', {
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.moods).toBeDefined();
        expect(result.moods.length).toBeGreaterThan(0);
      });

      it('uses genre-appropriate moods for jazz', () => {
        const genreDef = GENRE_REGISTRY.jazz;
        const jazzMoods = (genreDef.moods ?? []).map((m) => m.toLowerCase());

        // Run multiple times to verify mood selection
        let foundGenreMood = false;
        for (let i = 0; i < 10; i++) {
          const result = buildSection('VERSE', {
            genre: 'jazz',
            rng: createSeededRng(i * 1000),
          });
          if (result.moods.some((m) => jazzMoods.includes(m))) {
            foundGenreMood = true;
            break;
          }
        }
        expect(foundGenreMood).toBe(true);
      });

      it('moods are lowercase', () => {
        const result = buildSection('CHORUS', {
          genre: 'rock',
          rng: createSeededRng(12345),
        });
        for (const mood of result.moods) {
          expect(mood).toBe(mood.toLowerCase());
        }
      });
    });

    describe('determinism', () => {
      it('produces deterministic output with same seed', () => {
        const rng1 = createSeededRng(42);
        const rng2 = createSeededRng(42);

        const result1 = buildSection('VERSE', {
          genre: 'jazz',
          rng: rng1,
        });
        const result2 = buildSection('VERSE', {
          genre: 'jazz',
          rng: rng2,
        });

        expect(result1.text).toBe(result2.text);
        expect(result1.instruments).toEqual(result2.instruments);
        expect(result1.moods).toEqual(result2.moods);
      });

      it('produces different output with different seeds', () => {
        const rng1 = createSeededRng(11111);
        const rng2 = createSeededRng(99999);

        const result1 = buildSection('VERSE', {
          genre: 'jazz',
          rng: rng1,
        });
        const result2 = buildSection('VERSE', {
          genre: 'jazz',
          rng: rng2,
        });

        // With different seeds, at least something should differ
        const differs =
          result1.text !== result2.text ||
          result1.instruments.join(',') !== result2.instruments.join(',');
        expect(differs).toBe(true);
      });
    });

    describe('track instruments variety', () => {
      it('considers trackInstruments for variety', () => {
        // Build section with some pre-used instruments
        const result = buildSection('VERSE', {
          genre: 'jazz',
          rng: createSeededRng(12345),
          trackInstruments: ['Rhodes', 'upright bass'],
        });

        // Should still return instruments (may overlap if pool is limited)
        expect(result.instruments.length).toBeGreaterThan(0);
      });
    });
  });

  // =============================================================================
  // Tests: Building All Sections
  // =============================================================================

  describe('buildAllSections', () => {
    describe('generates all five sections', () => {
      it('returns exactly 5 sections', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.length).toBe(5);
      });

      it('includes INTRO section', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.some((s) => s.type === 'INTRO')).toBe(true);
      });

      it('includes VERSE section', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.some((s) => s.type === 'VERSE')).toBe(true);
      });

      it('includes CHORUS section', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.some((s) => s.type === 'CHORUS')).toBe(true);
      });

      it('includes BRIDGE section', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.some((s) => s.type === 'BRIDGE')).toBe(true);
      });

      it('includes OUTRO section', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.sections.some((s) => s.type === 'OUTRO')).toBe(true);
      });
    });

    describe('section order', () => {
      it('sections are in correct order: INTRO, VERSE, CHORUS, BRIDGE, OUTRO', () => {
        const result = buildAllSections({
          genre: 'rock',
          rng: createSeededRng(12345),
        });
        const types = result.sections.map((s) => s.type);
        expect(types).toEqual(['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUTRO']);
      });
    });

    describe('combined text', () => {
      it('text contains all section tags', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('[INTRO]');
        expect(result.text).toContain('[VERSE]');
        expect(result.text).toContain('[CHORUS]');
        expect(result.text).toContain('[BRIDGE]');
        expect(result.text).toContain('[OUTRO]');
      });

      it('text has no uninterpolated placeholders', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('sections are separated by newlines', () => {
        const result = buildAllSections({
          genre: 'rock',
          rng: createSeededRng(12345),
        });
        const lines = result.text.split('\n');
        expect(lines.length).toBe(5);
      });
    });

    describe('instrument variety across sections', () => {
      it('sections use varied instruments (not all identical)', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(12345),
        });

        // Collect all instruments from all sections
        const allInstruments = result.sections.flatMap((s) => s.instruments);

        // Should have multiple different instruments
        const uniqueInstruments = new Set(allInstruments);
        expect(uniqueInstruments.size).toBeGreaterThan(1);
      });

      it('allInstruments contains instruments from all sections', () => {
        const result = buildAllSections({
          genre: 'rock',
          rng: createSeededRng(12345),
        });

        expect(result.allInstruments.length).toBeGreaterThan(0);

        // Should match combined instruments from sections
        const expectedCount = result.sections.reduce(
          (sum, s) => sum + s.instruments.length,
          0
        );
        expect(result.allInstruments.length).toBe(expectedCount);
      });
    });

    describe('genre-specific instruments', () => {
      it('uses jazz instruments for jazz genre', () => {
        const result = buildAllSections({
          genre: 'jazz',
          rng: createSeededRng(42),
        });

        // Jazz typically includes Rhodes, piano, sax, bass, drums
        // Just verify we got instruments
        expect(result.allInstruments.length).toBeGreaterThan(0);
      });

      it('uses electronic instruments for electronic genre', () => {
        const result = buildAllSections({
          genre: 'electronic',
          rng: createSeededRng(42),
        });

        expect(result.allInstruments.length).toBeGreaterThan(0);
      });

      it('uses rock instruments for rock genre', () => {
        const result = buildAllSections({
          genre: 'rock',
          rng: createSeededRng(42),
        });

        expect(result.allInstruments.length).toBeGreaterThan(0);
      });
    });

    describe('determinism', () => {
      it('produces deterministic output with same seed', () => {
        const rng1 = createSeededRng(42);
        const rng2 = createSeededRng(42);

        const result1 = buildAllSections({
          genre: 'jazz',
          rng: rng1,
        });
        const result2 = buildAllSections({
          genre: 'jazz',
          rng: rng2,
        });

        expect(result1.text).toBe(result2.text);
        expect(result1.allInstruments).toEqual(result2.allInstruments);
      });

      it('produces different output with different seeds', () => {
        const rng1 = createSeededRng(11111);
        const rng2 = createSeededRng(99999);

        const result1 = buildAllSections({
          genre: 'jazz',
          rng: rng1,
        });
        const result2 = buildAllSections({
          genre: 'jazz',
          rng: rng2,
        });

        // With different seeds, output should differ
        expect(result1.text).not.toBe(result2.text);
      });
    });

    describe('edge cases', () => {
      it('handles ambient genre (sparse instruments)', () => {
        const result = buildAllSections({
          genre: 'ambient',
          rng: createSeededRng(12345),
        });

        expect(result.sections.length).toBe(5);
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('handles cinematic genre (orchestral instruments)', () => {
        const result = buildAllSections({
          genre: 'cinematic',
          rng: createSeededRng(12345),
        });

        expect(result.sections.length).toBe(5);
        expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
      });

      it('handles all genres in registry', () => {
        const genres = Object.keys(GENRE_REGISTRY) as GenreType[];

        for (const genre of genres) {
          const result = buildAllSections({
            genre,
            rng: createSeededRng(12345),
          });

          expect(result.sections.length).toBe(5);
          expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
        }
      });
    });
  });

  // =============================================================================
  // Tests: Template Variations
  // =============================================================================

  describe('template variations', () => {
    it('produces different variations with different seeds', () => {
      const texts = new Set<string>();

      // Generate 10 different intros with different seeds
      for (let i = 0; i < 10; i++) {
        const result = buildSection('INTRO', {
          genre: 'jazz',
          rng: createSeededRng(i * 1234),
        });
        texts.add(result.text);
      }

      // Should have at least 3 different variations
      expect(texts.size).toBeGreaterThanOrEqual(3);
    });

    it('all templates produce valid output', () => {
      const sectionTypes: SectionType[] = ['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUTRO'];
      const genres: GenreType[] = ['jazz', 'rock', 'pop', 'electronic', 'ambient'];

      for (const sectionType of sectionTypes) {
        for (const genre of genres) {
          for (let seed = 0; seed < 5; seed++) {
            const result = buildSection(sectionType, {
              genre,
              rng: createSeededRng(seed * 9999),
            });

            expect(result.text).toBeDefined();
            expect(result.text.length).toBeGreaterThan(5);
            expect(hasUninterpolatedPlaceholders(result.text)).toBe(false);
          }
        }
      }
    });
  });
});
