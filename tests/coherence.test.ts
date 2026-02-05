/**
 * Coherence Validation Test Suite
 *
 * Comprehensive tests for coherence validation with 10 known-good
 * and 10 known-bad combinations to ensure musical coherence checking
 * works correctly across different creativity levels.
 *
 * Tests cover:
 * - Known-good combinations that should pass at all creativity levels
 * - Known-bad combinations that fail at low creativity but pass at high
 * - validateAndFixCoherence filtering behavior
 * - Edge cases and boundary conditions
 */

import { test, expect, describe } from 'bun:test';

import {
  checkCoherence,
  validateAndFixCoherence,
  getConflictDescription,
  getAllConflictRuleIds,
} from '@bun/prompt/deterministic/coherence';

describe('Coherence Validation', () => {
  describe('known-good combinations', () => {
    /**
     * 10 known-good instrument-production combinations that should
     * always be coherent regardless of creativity level.
     */
    const goodCombinations = [
      {
        name: 'jazz piano with intimate production',
        instruments: ['jazz piano', 'upright bass', 'brushed drums'],
        tags: ['intimate', 'warm', 'natural dynamics'],
      },
      {
        name: 'distorted guitar with aggressive production',
        instruments: ['distorted guitar', 'heavy bass', 'power drums'],
        tags: ['aggressive', 'powerful', 'wide stereo'],
      },
      {
        name: 'synth pad with digital processing',
        instruments: ['synth pad', 'arpeggiator', 'sub bass'],
        tags: ['wide stereo', 'digital', 'polished production'],
      },
      {
        name: 'acoustic guitar with natural production',
        instruments: ['acoustic guitar', 'vocals'],
        tags: ['natural', 'organic', 'room reverb'],
      },
      {
        name: 'orchestra with concert hall production',
        instruments: ['string section', 'woodwinds', 'brass'],
        tags: ['hall reverb', 'dynamic range', 'concert hall'],
      },
      {
        name: 'electronic with futuristic production',
        instruments: ['synthesizer', 'drum machine', 'modular'],
        tags: ['futuristic', 'sci-fi', 'wide stereo'],
      },
      {
        name: 'vintage instruments with warm production',
        instruments: ['wurlitzer', 'rhodes', 'vintage keys'],
        tags: ['warm', 'analog', 'tape saturation'],
      },
      {
        name: 'delicate instruments with soft production',
        instruments: ['music box', 'celesta', 'glockenspiel'],
        tags: ['soft', 'gentle', 'intimate', 'whisper'],
      },
      {
        name: 'heavy metal with crushing production',
        instruments: ['heavy guitar', 'double kick', 'bass'],
        tags: ['crushing', 'brutal', 'aggressive'],
      },
      {
        name: 'lo-fi with bedroom instruments',
        instruments: ['bedroom guitar', 'drum machine', 'synth'],
        tags: ['lo-fi', 'dusty', 'cassette', 'vinyl crackle'],
      },
    ];

    test.each(goodCombinations)('$name is valid at low creativity', ({ instruments, tags }) => {
      // Arrange
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    test.each(goodCombinations)('$name is valid at high creativity', ({ instruments, tags }) => {
      // Arrange
      const creativityLevel = 80;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    test.each(goodCombinations)(
      '$name is valid at normal creativity (50)',
      ({ instruments, tags }) => {
        // Arrange
        const creativityLevel = 50;

        // Act
        const result = checkCoherence(instruments, tags, creativityLevel);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.conflicts).toHaveLength(0);
      }
    );
  });

  describe('known-bad combinations', () => {
    /**
     * 10 known-bad instrument-production combinations that should
     * fail coherence check at low creativity but pass at high creativity.
     */
    const badCombinations = [
      {
        name: 'distorted guitar with intimate production',
        instruments: ['distorted guitar', 'overdriven amp'],
        tags: ['intimate bedroom recording', 'whisper'],
        expectedConflict: 'distorted-intimate',
      },
      {
        name: 'heavy bass with gentle production',
        instruments: ['fuzz bass', 'crushing drums'],
        tags: ['gentle acoustic space', 'soft dynamics'],
        expectedConflict: 'distorted-intimate',
      },
      {
        name: 'acoustic guitar with glitch processing',
        instruments: ['acoustic guitar', 'nylon string'],
        tags: ['glitch', 'bitcrushed', 'digital distortion'],
        expectedConflict: 'acoustic-digital',
      },
      {
        name: 'upright bass with vocoder',
        instruments: ['upright bass', 'acoustic piano'],
        tags: ['vocoder', 'autotune', 'robotic'],
        expectedConflict: 'acoustic-digital',
      },
      {
        name: 'symphony orchestra with lo-fi production',
        instruments: ['symphony orchestra', 'string section'],
        tags: ['lo-fi', 'vinyl crackle', 'cassette'],
        expectedConflict: 'orchestral-lofi',
      },
      {
        name: 'philharmonic with tape hiss',
        instruments: ['philharmonic strings', 'chamber orchestra'],
        tags: ['tape hiss', 'dusty', 'bedroom production'],
        expectedConflict: 'orchestral-lofi',
      },
      {
        name: 'music box with aggressive production',
        instruments: ['music box', 'celesta'],
        tags: ['crushing compression', 'aggressive mix'],
        expectedConflict: 'delicate-aggressive',
      },
      {
        name: 'glockenspiel with brutal production',
        instruments: ['glockenspiel', 'kalimba', 'wind chimes'],
        tags: ['brutal', 'slamming', 'punishing'],
        expectedConflict: 'delicate-aggressive',
      },
      {
        name: 'phonograph with futuristic production',
        instruments: ['phonograph recording', 'gramophone'],
        tags: ['futuristic', 'sci-fi', 'cyber'],
        expectedConflict: 'vintage-futuristic',
      },
      {
        name: 'antique instruments with space age production',
        instruments: ['antique piano', '1920s brass'],
        tags: ['space age', 'neural processing', 'ai-generated'],
        expectedConflict: 'vintage-futuristic',
      },
    ];

    test.each(badCombinations)(
      '$name is invalid at low creativity (≤60)',
      ({ instruments, tags, expectedConflict }) => {
        // Arrange
        const creativityLevel = 30;

        // Act
        const result = checkCoherence(instruments, tags, creativityLevel);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.conflicts).toContain(expectedConflict);
        expect(result.suggestions).toBeDefined();
      }
    );

    test.each(badCombinations)(
      '$name is valid at high creativity (>60)',
      ({ instruments, tags }) => {
        // Arrange
        const creativityLevel = 80;

        // Act
        const result = checkCoherence(instruments, tags, creativityLevel);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.conflicts).toHaveLength(0);
      }
    );

    test('creativity boundary at 60 is strict', () => {
      // Arrange
      const instruments = ['distorted guitar'];
      const tags = ['intimate bedroom'];
      const creativityAt60 = 60;
      const creativityAt61 = 61;

      // Act
      const resultAt60 = checkCoherence(instruments, tags, creativityAt60);
      const resultAt61 = checkCoherence(instruments, tags, creativityAt61);

      // Assert
      expect(resultAt60.valid).toBe(false);
      expect(resultAt61.valid).toBe(true);
    });
  });

  describe('validateAndFixCoherence', () => {
    test('returns original tags when valid', () => {
      // Arrange
      const instruments = ['jazz piano', 'bass'];
      const tags = ['warm', 'intimate', 'natural'];
      const creativityLevel = 30;

      // Act
      const result = validateAndFixCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result).toEqual(tags);
    });

    test('removes conflicting tags when invalid', () => {
      // Arrange
      const instruments = ['distorted guitar', 'heavy bass'];
      const tags = ['intimate bedroom', 'warm', 'wide stereo'];
      const creativityLevel = 30;

      // Act
      const result = validateAndFixCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result).not.toContain('intimate bedroom');
      expect(result).toContain('warm');
      expect(result).toContain('wide stereo');
    });

    test('keeps all tags at high creativity', () => {
      // Arrange
      const instruments = ['distorted guitar', 'heavy bass'];
      const tags = ['intimate bedroom', 'warm', 'wide stereo'];
      const creativityLevel = 80;

      // Act
      const result = validateAndFixCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result).toEqual(tags);
    });

    test('handles multiple conflicting tags', () => {
      // Arrange
      const instruments = ['acoustic guitar', 'upright bass'];
      const tags = ['glitch', 'bitcrushed', 'warm', 'vocoder', 'natural'];
      const creativityLevel = 30;

      // Act
      const result = validateAndFixCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result).not.toContain('glitch');
      expect(result).not.toContain('bitcrushed');
      expect(result).not.toContain('vocoder');
      expect(result).toContain('warm');
      expect(result).toContain('natural');
    });

    test('returns empty array when all tags conflict', () => {
      // Arrange
      const instruments = ['distorted guitar'];
      const tags = ['intimate', 'whisper', 'bedroom', 'gentle'];
      const creativityLevel = 30;

      // Act
      const result = validateAndFixCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    test('empty instruments array is valid', () => {
      // Arrange
      const instruments: string[] = [];
      const tags = ['aggressive', 'intimate', 'glitch'];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
    });

    test('empty tags array is valid', () => {
      // Arrange
      const instruments = ['distorted guitar', 'symphony orchestra'];
      const tags: string[] = [];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
    });

    test('both empty arrays is valid', () => {
      // Arrange
      const instruments: string[] = [];
      const tags: string[] = [];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
    });

    test('creativity level 0 applies strict checking', () => {
      // Arrange
      const instruments = ['distorted guitar'];
      const tags = ['intimate'];
      const creativityLevel = 0;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(false);
    });

    test('creativity level 100 is permissive', () => {
      // Arrange
      const instruments = ['distorted guitar', 'symphony orchestra', 'music box', 'phonograph'];
      const tags = ['intimate', 'lo-fi', 'aggressive', 'futuristic'];
      const creativityLevel = 100;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(true);
    });

    test('case insensitive matching', () => {
      // Arrange
      const instruments = ['DISTORTED GUITAR'];
      const tags = ['INTIMATE bedroom'];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.conflicts).toContain('distorted-intimate');
    });

    test('partial match detection', () => {
      // Arrange - "distorted" is part of instrument name
      const instruments = ['slightly distorted amp'];
      const tags = ['very intimate setting'];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(false);
    });
  });

  describe('helper functions', () => {
    test('getAllConflictRuleIds returns all 5 rules', () => {
      // Act
      const ruleIds = getAllConflictRuleIds();

      // Assert
      expect(ruleIds).toHaveLength(5);
      expect(ruleIds).toContain('distorted-intimate');
      expect(ruleIds).toContain('acoustic-digital');
      expect(ruleIds).toContain('orchestral-lofi');
      expect(ruleIds).toContain('delicate-aggressive');
      expect(ruleIds).toContain('vintage-futuristic');
    });

    test('getConflictDescription returns description for valid id', () => {
      // Act
      const description = getConflictDescription('distorted-intimate');

      // Assert
      expect(description).toBe('Distorted instruments with intimate production');
    });

    test('getConflictDescription returns undefined for invalid id', () => {
      // Act
      const description = getConflictDescription('invalid-rule');

      // Assert
      expect(description).toBeUndefined();
    });
  });

  describe('multiple conflicts', () => {
    test('detects multiple conflicts in single check', () => {
      // Arrange - combines multiple conflict patterns
      const instruments = ['distorted guitar', 'acoustic piano', 'symphony orchestra'];
      const tags = ['intimate', 'glitch', 'lo-fi'];
      const creativityLevel = 30;

      // Act
      const result = checkCoherence(instruments, tags, creativityLevel);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(1);
    });
  });
});
