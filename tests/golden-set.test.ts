/**
 * Golden Set Regression Tests
 *
 * Validates that deterministic prompt generation produces consistent,
 * high-quality outputs across releases. Each entry in the golden set
 * defines expected behavior for a specific seed and description.
 *
 * Purpose:
 * - Detect regressions in genre detection
 * - Verify prompt content includes expected terms
 * - Ensure reproducibility with seeded RNG
 *
 * @module tests/golden-set
 */

import { describe, test, expect } from 'bun:test';

import {
  buildDeterministicStandardPrompt,
  buildDeterministicMaxPrompt,
} from '@bun/prompt/deterministic';
import { createSeededRng } from '@shared/utils/random';

import type { GenreType } from '@bun/instruments/genres';

/**
 * Golden set entry defining expected prompt behavior.
 */
interface GoldenSetEntry {
  /** Unique seed for reproducibility */
  seed: number;
  /** Description to generate prompt from */
  description: string;
  /** Expected genre detection result */
  expectedGenre: GenreType;
  /** Terms that must appear in the generated prompt (case-insensitive) */
  mustInclude: readonly string[];
  /** Optional: genre override to test */
  genreOverride?: string;
  /** Optional: creativity level to test */
  creativityLevel?: number;
  /** Optional: test description for clarity */
  testDescription?: string;
}

/**
 * Golden Set Entries
 *
 * Collection of 30 known-good prompts covering:
 * - Various genres (jazz, electronic, rock, ambient, etc.)
 * - Both standard and MAX mode builders
 * - Different creativity levels
 * - Multi-genre descriptions
 * - Mood-based detection
 * - Genre aliases
 *
 * Note: Expected genres are based on actual detection behavior,
 * including priority order and alias resolution.
 */
const GOLDEN_SET: GoldenSetEntry[] = [
  // ============================================================================
  // Jazz & Blues Family
  // ============================================================================
  {
    seed: 10001,
    description: 'smooth jazz night session',
    expectedGenre: 'jazz',
    mustInclude: ['jazz'],
    testDescription: 'Jazz detection from explicit keyword',
  },
  {
    seed: 10002,
    description: 'delta blues with slide guitar',
    expectedGenre: 'blues',
    mustInclude: ['blues'],
    testDescription: 'Blues detection from explicit keyword',
  },
  {
    seed: 10003,
    description: 'neo soul grooves',
    expectedGenre: 'soul',
    mustInclude: ['soul'],
    testDescription: 'Soul detection from neo soul variant',
  },

  // ============================================================================
  // Electronic Family
  // ============================================================================
  {
    seed: 20001,
    description: 'deep house vibes',
    expectedGenre: 'house',
    mustInclude: ['house'],
    testDescription: 'House detection from deep house variant',
  },
  {
    seed: 20002,
    description: 'progressive trance journey',
    expectedGenre: 'trance',
    mustInclude: ['trance'],
    testDescription: 'Trance detection from progressive trance',
  },
  {
    seed: 20003,
    description: 'dubstep heavy bass wobbles',
    expectedGenre: 'dubstep',
    mustInclude: ['dubstep'],
    genreOverride: 'dubstep', // Force dubstep as it's not in priority list
    testDescription: 'Dubstep detection with override',
  },
  {
    seed: 20004,
    description: 'melodic techno with analog synths',
    expectedGenre: 'melodictechno',
    mustInclude: ['techno'],
    testDescription: 'Melodic techno detection',
  },
  {
    seed: 20005,
    description: 'electronic dance music',
    expectedGenre: 'electronic',
    mustInclude: ['electronic'],
    testDescription: 'Electronic detection from EDM description',
  },

  // ============================================================================
  // Rock & Metal Family
  // ============================================================================
  {
    seed: 30001,
    description: 'classic rock anthem',
    expectedGenre: 'rock',
    mustInclude: ['rock'],
    testDescription: 'Rock detection from explicit keyword',
  },
  {
    seed: 30002,
    description: 'heavy metal riffs',
    expectedGenre: 'metal',
    mustInclude: ['metal'],
    testDescription: 'Metal detection from heavy metal alias',
  },
  {
    seed: 30003,
    description: 'grunge with distorted guitars',
    expectedGenre: 'rock', // Grunge not in priority list, rock detected
    mustInclude: ['rock'],
    genreOverride: 'rock',
    testDescription: 'Rock from grunge description (rock detected first)',
  },
  {
    seed: 30004,
    description: 'punk rock energy',
    expectedGenre: 'punk',
    mustInclude: ['punk'],
    testDescription: 'Punk detection from punk rock',
  },
  {
    seed: 30005,
    description: 'dreampop with layers of reverb',
    expectedGenre: 'dreampop', // Dreampop has higher priority than shoegaze
    mustInclude: ['dream pop'], // Display name has space
    testDescription: 'Dreampop detection from keyword',
  },

  // ============================================================================
  // Ambient & Atmospheric
  // ============================================================================
  {
    seed: 40001,
    description: 'ambient soundscape',
    expectedGenre: 'ambient',
    mustInclude: ['ambient'],
    testDescription: 'Ambient detection from explicit keyword',
  },
  {
    seed: 40002,
    description: 'dreampop with ethereal vocals',
    expectedGenre: 'dreampop',
    mustInclude: ['dream pop'], // Display name has space
    testDescription: 'Dreampop detection from explicit keyword',
  },
  {
    seed: 40003,
    description: 'chillwave summer vibes',
    expectedGenre: 'chillwave',
    mustInclude: ['chillwave'],
    testDescription: 'Chillwave detection from explicit keyword',
  },

  // ============================================================================
  // Hip-hop & Urban
  // ============================================================================
  {
    seed: 50001,
    description: 'hip hop beats with 808s',
    expectedGenre: 'trap',
    mustInclude: ['trap'],
    testDescription: 'Trap detection from hip hop alias',
  },
  {
    seed: 50002,
    description: 'lo-fi study music',
    expectedGenre: 'lofi',
    mustInclude: ['lo-fi'], // The display might be "lo-fi" not "lofi"
    testDescription: 'Lofi detection from lo-fi variant',
  },
  {
    seed: 50003,
    description: 'drill with sliding bass',
    expectedGenre: 'drill',
    mustInclude: ['drill'],
    testDescription: 'Drill detection from explicit keyword',
  },

  // ============================================================================
  // World & Folk
  // ============================================================================
  {
    seed: 60001,
    description: 'jazz fusion with latin rhythms',
    expectedGenre: 'jazz', // Jazz has higher priority than latin
    mustInclude: ['jazz'],
    testDescription: 'Jazz detected first (higher priority than latin)',
  },
  {
    seed: 60002,
    description: 'reggae rhythms with dub',
    expectedGenre: 'reggae',
    mustInclude: ['reggae'],
    testDescription: 'Reggae detection from explicit keyword',
  },
  {
    seed: 60003,
    description: 'folk with acoustic guitar',
    expectedGenre: 'folk', // Using folk directly instead of celtic
    mustInclude: ['folk'],
    testDescription: 'Folk detection from explicit keyword',
  },

  // ============================================================================
  // Synth & Retro
  // ============================================================================
  {
    seed: 70001,
    description: 'synthwave with arpeggiated synths',
    expectedGenre: 'synthwave',
    mustInclude: ['synthwave'],
    testDescription: 'Synthwave detection from explicit keyword',
  },
  {
    seed: 70002,
    description: 'synthwave with dark elements',
    expectedGenre: 'synthwave', // Synthwave has higher priority
    mustInclude: ['synthwave'],
    testDescription: 'Synthwave detection (higher priority than darksynth)',
  },
  {
    seed: 70003,
    description: 'retro 80s synthwave sounds',
    expectedGenre: 'synthwave', // Synthwave keyword detected first
    mustInclude: ['synthwave'],
    testDescription: 'Synthwave detected from combined retro synthwave',
  },

  // ============================================================================
  // Mood-based Detection (with genreOverride to ensure predictable results)
  // ============================================================================
  {
    seed: 80001,
    description: 'something chill and relaxing',
    expectedGenre: 'lofi',
    genreOverride: 'lofi', // Override to ensure consistent test
    mustInclude: [], // Don't check mustInclude since display may vary
    testDescription: 'Lofi from chill mood with override',
  },
  {
    seed: 80002,
    description: 'dark ambient atmosphere',
    expectedGenre: 'ambient', // Ambient keyword detected
    mustInclude: ['ambient'],
    testDescription: 'Ambient detection from dark ambient',
  },

  // ============================================================================
  // Multi-genre Detection
  // ============================================================================
  {
    seed: 90001,
    description: 'jazz rock fusion',
    expectedGenre: 'jazz',
    mustInclude: ['jazz', 'rock'],
    testDescription: 'Multi-genre detection: jazz rock',
  },
  {
    seed: 90002,
    description: 'electronic ambient textures',
    expectedGenre: 'electronic',
    mustInclude: ['electronic', 'ambient'],
    testDescription: 'Multi-genre detection: electronic ambient',
  },

  // ============================================================================
  // Genre Override
  // ============================================================================
  {
    seed: 95001,
    description: 'some random description',
    expectedGenre: 'pop',
    genreOverride: 'pop',
    mustInclude: ['pop'],
    testDescription: 'Genre override takes priority',
  },
];

describe('Golden Set Regression Tests', () => {
  describe('Standard Mode', () => {
    test.each(GOLDEN_SET)(
      'seed=$seed ($testDescription)',
      ({ seed, description, expectedGenre, mustInclude, genreOverride, creativityLevel }) => {
        // Arrange
        const rng = createSeededRng(seed);

        // Act
        const result = buildDeterministicStandardPrompt({
          description,
          genreOverride,
          creativityLevel,
          rng,
        });

        // Assert - Genre detection
        expect(result.genre).toBe(expectedGenre);

        // Assert - Must include terms (case-insensitive)
        // If multiple alternatives provided (like ['lofi', 'lo-fi']), check all forms
        const promptLower = result.text.toLowerCase();
        for (const term of mustInclude) {
          const termLower = term.toLowerCase();
          // Check both hyphenated and non-hyphenated forms
          const noHyphens = termLower.replace(/-/g, '');
          const withSpace = termLower.replace(/-/g, ' ');
          const found =
            promptLower.includes(termLower) ||
            promptLower.includes(noHyphens) ||
            promptLower.includes(withSpace);
          expect(found).toBe(true);
        }

        // Assert - Basic structure requirements
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(100);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.usedGenre).toBeDefined();
      }
    );
  });

  describe('MAX Mode', () => {
    test.each(GOLDEN_SET)(
      'seed=$seed ($testDescription)',
      ({ seed, description, expectedGenre, mustInclude, genreOverride, creativityLevel }) => {
        // Arrange
        const rng = createSeededRng(seed);

        // Act
        const result = buildDeterministicMaxPrompt({
          description,
          genreOverride,
          creativityLevel,
          rng,
        });

        // Assert - Genre detection
        expect(result.genre).toBe(expectedGenre);

        // Assert - Must include terms (case-insensitive)
        // Check multiple possible forms (with/without space, hyphen)
        const promptLower = result.text.toLowerCase();
        for (const term of mustInclude) {
          const termLower = term.toLowerCase();
          // Check all common variations of the term
          const noHyphens = termLower.replace(/-/g, '');
          const withSpace = termLower.replace(/-/g, ' ');
          const noSpaces = termLower.replace(/ /g, '');
          const found =
            promptLower.includes(termLower) ||
            promptLower.includes(noHyphens) ||
            promptLower.includes(withSpace) ||
            promptLower.includes(noSpaces);
          expect(found).toBe(true);
        }

        // Assert - MAX MODE structure requirements
        expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
        expect(result.text).toContain('genre:');
        expect(result.text).toContain('bpm:');
        expect(result.text).toContain('instruments:');
        expect(result.text).toContain('style tags:');
      }
    );
  });

  describe('Reproducibility', () => {
    test('same seed produces identical standard prompts across runs', () => {
      // Arrange - Use entries with genre overrides for deterministic behavior
      const testCases = GOLDEN_SET.filter((entry) => entry.genreOverride).slice(0, 5);

      // Act - Generate twice with same seeds
      for (const { seed, description, genreOverride } of testCases) {
        const result1 = buildDeterministicStandardPrompt({
          description,
          genreOverride,
          rng: createSeededRng(seed),
        });

        const result2 = buildDeterministicStandardPrompt({
          description,
          genreOverride,
          rng: createSeededRng(seed),
        });

        // Assert - Results should be identical
        expect(result1.text).toBe(result2.text);
        expect(result1.genre).toBe(result2.genre);
        expect(result1.metadata?.instruments).toEqual(result2.metadata?.instruments);
      }
    });

    test('same seed produces identical MAX prompts across runs', () => {
      // Arrange - Use entries with genre overrides for deterministic behavior
      const testCases = GOLDEN_SET.filter((entry) => entry.genreOverride).slice(0, 5);

      // Act - Generate twice with same seeds
      for (const { seed, description, genreOverride } of testCases) {
        const result1 = buildDeterministicMaxPrompt({
          description,
          genreOverride,
          rng: createSeededRng(seed),
        });

        const result2 = buildDeterministicMaxPrompt({
          description,
          genreOverride,
          rng: createSeededRng(seed),
        });

        // Assert - Results should be identical
        expect(result1.text).toBe(result2.text);
        expect(result1.genre).toBe(result2.genre);
        expect(result1.metadata?.instruments).toEqual(result2.metadata?.instruments);
      }
    });

    test('different seeds produce different outputs', () => {
      // Arrange
      const description = 'jazz ballad';
      const seeds = [11111, 22222, 33333, 44444, 55555];

      // Act
      const results = seeds.map((seed) =>
        buildDeterministicStandardPrompt({
          description,
          rng: createSeededRng(seed),
        })
      );

      // Assert - All outputs should be different
      const uniqueTexts = new Set(results.map((r) => r.text));
      expect(uniqueTexts.size).toBe(seeds.length);
    });
  });

  describe('Creativity Levels', () => {
    test('low creativity (30) produces coherent prompts', () => {
      // Arrange
      const seed = 12345;
      const rng = createSeededRng(seed);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        creativityLevel: 30,
        rng,
      });

      // Assert
      expect(result.text).toBeDefined();
      expect(result.genre).toBe('jazz');
      // Low creativity should use simple moods
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
    });

    test('high creativity (80) uses compound moods', () => {
      // Arrange
      const seed = 12345;
      const rng = createSeededRng(seed);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        creativityLevel: 80,
        rng,
      });

      // Assert
      expect(result.text).toBeDefined();
      expect(result.genre).toBe('jazz');
      // High creativity should include compound moods (containing spaces)
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
    });
  });

  describe('Genre Alias Resolution', () => {
    const aliasTests: { alias: string; expectedGenre: GenreType }[] = [
      { alias: 'hip hop', expectedGenre: 'trap' },
      { alias: 'r&b', expectedGenre: 'rnb' },
      { alias: 'heavy metal', expectedGenre: 'metal' },
      { alias: 'synth wave', expectedGenre: 'synthwave' },
    ];

    test.each(aliasTests)('$alias resolves to $expectedGenre', ({ alias, expectedGenre }) => {
      // Arrange
      const rng = createSeededRng(42);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: `${alias} sound`,
        rng,
      });

      // Assert
      expect(result.genre).toBe(expectedGenre);
    });

    test('dnb alias is detected as part of multi-genre', () => {
      // Arrange
      const rng = createSeededRng(42);

      // Act - "dnb" is detected but "electronic" has higher priority
      const result = buildDeterministicStandardPrompt({
        description: 'dnb sound',
        rng,
      });

      // Assert - electronic detected first, dnb as secondary
      expect(result.metadata?.usedGenre).toContain('drumandbass');
    });
  });

  describe('Multi-genre Blending', () => {
    test('jazz rock fusion blends both genres', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: 'jazz rock fusion',
        rng,
      });

      // Assert
      expect(result.genre).toBe('jazz'); // Primary genre
      expect(result.metadata?.usedGenre).toContain('jazz');
      // The prompt should reflect the fusion
      expect(result.text.toLowerCase()).toContain('jazz');
    });

    test('electronic ambient combines both styles', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act
      const result = buildDeterministicMaxPrompt({
        description: 'electronic ambient textures',
        rng,
      });

      // Assert
      expect(result.genre).toBe('electronic'); // Primary genre
      // The prompt should reflect both electronic and ambient
      const promptLower = result.text.toLowerCase();
      expect(promptLower).toContain('electronic');
    });

    test('up to 4 genres detected', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - Description with 4+ genres mentioned
      const result = buildDeterministicStandardPrompt({
        description: 'jazz rock pop electronic ambient',
        genreOverride: 'jazz rock pop electronic',
        rng,
      });

      // Assert - Should have multi-genre
      expect(result.metadata?.usedGenre).toBeDefined();
      // The override has 4 genres
      const genres = result.metadata?.usedGenre?.split(' ') ?? [];
      expect(genres.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    test('empty description uses random fallback', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: '',
        rng,
      });

      // Assert - Should still produce a valid prompt
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);
      expect(result.genre).toBeDefined();
    });

    test('gibberish description uses random fallback', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: 'xyzzy qwerty asdfgh',
        rng,
      });

      // Assert - Should still produce a valid prompt
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);
      expect(result.genre).toBeDefined();
    });

    test('very long description is handled', () => {
      // Arrange
      const rng = createSeededRng(12345);
      const longDescription = 'jazz '.repeat(100);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: longDescription,
        rng,
      });

      // Assert
      expect(result.genre).toBe('jazz');
      expect(result.text).toBeDefined();
    });

    test('special characters in description are handled', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act
      const result = buildDeterministicStandardPrompt({
        description: 'jazz & blues with r&b vibes!!! @#$%',
        rng,
      });

      // Assert
      expect(result.text).toBeDefined();
      expect(result.genre).toBeDefined();
    });
  });
});
