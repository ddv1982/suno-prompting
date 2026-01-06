import { describe, it, expect } from 'bun:test';

import {
  generateDeterministicTitle,
  generateTitleOptions,
} from '@bun/prompt/title-generator';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

// =============================================================================
// Tests: generateDeterministicTitle
// =============================================================================

describe('title-generator', () => {
  describe('generateDeterministicTitle', () => {
    describe('basic functionality', () => {
      it('returns a non-empty string', () => {
        const title = generateDeterministicTitle('jazz', 'smooth');
        expect(title).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      });

      it('returns a string without placeholders', () => {
        const title = generateDeterministicTitle('rock', 'energetic');
        expect(title).not.toContain('{');
        expect(title).not.toContain('}');
      });

      it('handles empty genre gracefully', () => {
        const title = generateDeterministicTitle('', 'calm');
        expect(title).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      });

      it('handles empty mood gracefully', () => {
        const title = generateDeterministicTitle('pop', '');
        expect(title).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      });

      it('handles unknown genre with default patterns', () => {
        const title = generateDeterministicTitle('unknowngenre123', 'happy');
        expect(title).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      });
    });

    describe('genre-specific patterns', () => {
      it('generates jazz-appropriate titles', () => {
        const rng = createSeededRng(42);
        const titles: string[] = [];
        for (let i = 0; i < 10; i++) {
          titles.push(generateDeterministicTitle('jazz', 'smooth', rng));
        }
        // Jazz patterns include: Blue {nature}, {time} Session, Cool {emotion}
        const hasJazzPattern = titles.some(
          (t) =>
            t.includes('Blue') ||
            t.includes('Session') ||
            t.includes('Cool') ||
            t.includes('Smooth')
        );
        expect(hasJazzPattern).toBe(true);
      });

      it('generates blues-appropriate titles', () => {
        const rng = createSeededRng(123);
        const titles: string[] = [];
        for (let i = 0; i < 10; i++) {
          titles.push(generateDeterministicTitle('blues', 'melancholic', rng));
        }
        // Blues patterns include: {emotion} Blues, {time} Blues
        const hasBluesPattern = titles.some((t) => t.includes('Blues') || t.includes('Road'));
        expect(hasBluesPattern).toBe(true);
      });

      it('generates electronic-appropriate titles', () => {
        const rng = createSeededRng(456);
        const titles: string[] = [];
        for (let i = 0; i < 10; i++) {
          titles.push(generateDeterministicTitle('electronic', 'energetic', rng));
        }
        // Electronic patterns include: Digital {nature}, Neon {emotion}, Synthetic
        const hasElectronicPattern = titles.some(
          (t) =>
            t.includes('Digital') ||
            t.includes('Neon') ||
            t.includes('Synthetic') ||
            t.includes('State') ||
            t.includes('Signal') ||
            t.includes('Pulse')
        );
        expect(hasElectronicPattern).toBe(true);
      });

      it('handles multi-word genre by using first word', () => {
        const rng1 = createSeededRng(789);
        const rng2 = createSeededRng(789);
        const title1 = generateDeterministicTitle('jazz fusion', 'smooth', rng1);
        const title2 = generateDeterministicTitle('jazz', 'smooth', rng2);
        // Should use jazz patterns for both
        expect(title1).toBe(title2);
      });
    });

    describe('mood filtering', () => {
      it('melancholic mood prefers shadow/rain/memory words', () => {
        const rng = createSeededRng(111);
        const titles: string[] = [];
        for (let i = 0; i < 20; i++) {
          titles.push(generateDeterministicTitle('ambient', 'melancholic', rng));
        }
        const melancholicWords = ['Shadow', 'Rain', 'Memory', 'Echo', 'Fading', 'Lost', 'Silence', 'Twilight'];
        const hasMelancholicWord = titles.some((t) =>
          melancholicWords.some((w) => t.includes(w))
        );
        expect(hasMelancholicWord).toBe(true);
      });

      it('energetic mood prefers fire/rising/dancing words', () => {
        const rng = createSeededRng(222);
        const titles: string[] = [];
        for (let i = 0; i < 20; i++) {
          titles.push(generateDeterministicTitle('rock', 'energetic', rng));
        }
        const energeticWords = ['Fire', 'Rising', 'Running', 'Dancing', 'Thunder', 'Burning', 'Flying'];
        const hasEnergeticWord = titles.some((t) =>
          energeticWords.some((w) => t.includes(w))
        );
        expect(hasEnergeticWord).toBe(true);
      });

      it('unknown mood uses unfiltered words', () => {
        const title = generateDeterministicTitle('pop', 'unknownmood');
        expect(title).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      });
    });

    describe('determinism', () => {
      it('produces identical output with same seed', () => {
        const rng1 = createSeededRng(12345);
        const rng2 = createSeededRng(12345);
        const title1 = generateDeterministicTitle('jazz', 'smooth', rng1);
        const title2 = generateDeterministicTitle('jazz', 'smooth', rng2);
        expect(title1).toBe(title2);
      });

      it('produces different output with different seeds', () => {
        const rng1 = createSeededRng(11111);
        const rng2 = createSeededRng(99999);
        const titles1: string[] = [];
        const titles2: string[] = [];
        for (let i = 0; i < 5; i++) {
          titles1.push(generateDeterministicTitle('rock', 'energetic', rng1));
          titles2.push(generateDeterministicTitle('rock', 'energetic', rng2));
        }
        // At least one should differ
        const allSame = titles1.every((t, i) => t === titles2[i]);
        expect(allSame).toBe(false);
      });

      it('uses Math.random by default', () => {
        // Just verify it doesn't throw when no RNG provided
        const title1 = generateDeterministicTitle('pop', 'upbeat');
        const title2 = generateDeterministicTitle('pop', 'upbeat');
        expect(title1).toBeDefined();
        expect(title2).toBeDefined();
        // With Math.random, they're likely different (but not guaranteed)
      });
    });

    describe('edge cases', () => {
      it('handles case-insensitive genre', () => {
        const rng1 = createSeededRng(555);
        const rng2 = createSeededRng(555);
        const title1 = generateDeterministicTitle('JAZZ', 'smooth', rng1);
        const title2 = generateDeterministicTitle('jazz', 'smooth', rng2);
        expect(title1).toBe(title2);
      });

      it('handles case-insensitive mood', () => {
        const rng1 = createSeededRng(666);
        const rng2 = createSeededRng(666);
        const title1 = generateDeterministicTitle('rock', 'ENERGETIC', rng1);
        const title2 = generateDeterministicTitle('rock', 'energetic', rng2);
        expect(title1).toBe(title2);
      });

      it('title does not exceed reasonable length', () => {
        const rng = createSeededRng(777);
        for (let i = 0; i < 50; i++) {
          const title = generateDeterministicTitle('classical', 'romantic', rng);
          expect(title.length).toBeLessThan(50);
        }
      });
    });
  });

  // ===========================================================================
  // Tests: generateTitleOptions
  // ===========================================================================

  describe('generateTitleOptions', () => {
    it('returns requested number of titles', () => {
      const titles = generateTitleOptions('jazz', 'smooth', 3);
      expect(titles.length).toBe(3);
    });

    it('returns unique titles', () => {
      const rng = createSeededRng(888);
      const titles = generateTitleOptions('rock', 'energetic', 5, rng);
      const uniqueTitles = new Set(titles.map((t) => t.toLowerCase()));
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('defaults to 3 titles when count not specified', () => {
      const titles = generateTitleOptions('pop', 'upbeat');
      expect(titles.length).toBe(3);
    });

    it('handles request for single title', () => {
      const titles = generateTitleOptions('ambient', 'calm', 1);
      expect(titles.length).toBe(1);
    });

    it('returns deterministic results with same seed', () => {
      const rng1 = createSeededRng(999);
      const rng2 = createSeededRng(999);
      const titles1 = generateTitleOptions('jazz', 'smooth', 3, rng1);
      const titles2 = generateTitleOptions('jazz', 'smooth', 3, rng2);
      expect(titles1).toEqual(titles2);
    });

    it('handles large count request gracefully', () => {
      const rng = createSeededRng(1010);
      // Request more titles than patterns might easily produce uniquely
      const titles = generateTitleOptions('lofi', 'calm', 10, rng);
      // Should return at least some titles, may be less than requested if duplicates prevented
      expect(titles.length).toBeGreaterThan(0);
      expect(titles.length).toBeLessThanOrEqual(10);
    });

    it('all titles are non-empty strings', () => {
      const titles = generateTitleOptions('metal', 'aggressive', 5);
      for (const title of titles) {
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(0);
      }
    });

    it('all titles have no uninterpolated placeholders', () => {
      const titles = generateTitleOptions('folk', 'melancholic', 5);
      for (const title of titles) {
        expect(title).not.toContain('{');
        expect(title).not.toContain('}');
      }
    });
  });
});
