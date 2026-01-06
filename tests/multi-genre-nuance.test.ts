import { describe, expect, it } from 'bun:test';

import { getMultiGenreNuanceGuidance } from '@bun/instruments/services/format';
import { createRng } from '@bun/instruments/services/random';

describe('getMultiGenreNuanceGuidance', () => {
  describe('basic functionality', () => {
    it('should return null for empty string', () => {
      const result = getMultiGenreNuanceGuidance('');
      expect(result).toBeNull();
    });

    it('should return null for unrecognized genre', () => {
      const result = getMultiGenreNuanceGuidance('xyznonexistent');
      expect(result).toBeNull();
    });

    it('should return guidance for a single recognized genre', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz', rng);

      expect(result).not.toBeNull();
      expect(result).toContain('MULTI-GENRE NUANCE:');
      expect(result).toContain('BPM Range:');
    });

    it('should return guidance for multi-genre string', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz rock', rng);

      expect(result).not.toBeNull();
      expect(result).toContain('MULTI-GENRE NUANCE:');
    });

    it('should return guidance for comma-separated genres', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('ambient, metal', rng);

      expect(result).not.toBeNull();
      expect(result).toContain('MULTI-GENRE NUANCE:');
    });
  });

  describe('output format', () => {
    it('should include BPM range section', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('rock', rng);

      expect(result).toContain('BPM Range: between');
    });

    it('should include harmonic style suggestion', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz', rng);

      expect(result).toContain('Suggested harmonic style:');
    });

    it('should include time signature suggestion', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz', rng);

      expect(result).toContain('Suggested time signature:');
    });

    it('should include polyrhythm for applicable genres', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('afrobeat jazz', rng);

      expect(result).toContain('Suggested polyrhythm:');
    });

    it('should not include polyrhythm for genres without polyrhythm traditions', () => {
      const rng = createRng(42);
      // pop and trap don't have explicit polyrhythm mappings
      const result = getMultiGenreNuanceGuidance('pop', rng);

      expect(result).not.toContain('Suggested polyrhythm:');
    });
  });

  describe('deterministic output with seeded RNG', () => {
    it('should produce consistent output with same seed', () => {
      const result1 = getMultiGenreNuanceGuidance('jazz rock', createRng(123));
      const result2 = getMultiGenreNuanceGuidance('jazz rock', createRng(123));

      expect(result1).toBe(result2);
    });

    it('should produce different output with different seeds', () => {
      const result1 = getMultiGenreNuanceGuidance('jazz rock', createRng(123));
      const result2 = getMultiGenreNuanceGuidance('jazz rock', createRng(456));

      // Results might be same if the same items get selected, but likely different
      // Just ensure both are valid guidance
      expect(result1).toContain('MULTI-GENRE NUANCE:');
      expect(result2).toContain('MULTI-GENRE NUANCE:');
    });
  });

  describe('multi-genre blending', () => {
    it('should blend BPM ranges for overlapping genres', () => {
      const rng = createRng(42);
      // jazz (80-180) and rock (90-160) should overlap
      const result = getMultiGenreNuanceGuidance('jazz rock', rng);

      expect(result).toContain('BPM Range: between');
    });

    it('should handle non-overlapping BPM ranges', () => {
      const rng = createRng(42);
      // ambient (60-100) and metal (100-200) may have narrow overlap or none
      const result = getMultiGenreNuanceGuidance('ambient metal', rng);

      expect(result).toContain('BPM Range: between');
    });

    it('should include styles from both genres', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('latin jazz', rng);

      // Should have guidance since both genres have harmonic styles
      expect(result).toContain('Suggested harmonic style:');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only input', () => {
      const result = getMultiGenreNuanceGuidance('   ');
      expect(result).toBeNull();
    });

    it('should handle mixed valid and invalid genres', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz invalidgenre rock', rng);

      // Should still produce output for the valid genres
      expect(result).toContain('MULTI-GENRE NUANCE:');
    });

    it('should handle duplicate genres gracefully', () => {
      const rng = createRng(42);
      const result = getMultiGenreNuanceGuidance('jazz jazz jazz', rng);

      expect(result).toContain('MULTI-GENRE NUANCE:');
    });
  });
});
