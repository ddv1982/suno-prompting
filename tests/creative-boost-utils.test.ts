import { describe, it, expect } from 'bun:test';

import { getCreativityLevel } from '@shared/creative-boost-utils';

describe('getCreativityLevel (shared)', () => {
  describe('low range (0-20)', () => {
    it('returns "low" for value 0', () => {
      expect(getCreativityLevel(0)).toBe('low');
    });

    it('returns "low" for value 20 (boundary)', () => {
      expect(getCreativityLevel(20)).toBe('low');
    });
  });

  describe('safe range (21-40)', () => {
    it('returns "safe" for value 21 (boundary)', () => {
      expect(getCreativityLevel(21)).toBe('safe');
    });

    it('returns "safe" for value 25 (slider position)', () => {
      expect(getCreativityLevel(25)).toBe('safe');
    });

    it('returns "safe" for value 40 (boundary)', () => {
      expect(getCreativityLevel(40)).toBe('safe');
    });
  });

  describe('normal range (41-60)', () => {
    it('returns "normal" for value 41 (boundary)', () => {
      expect(getCreativityLevel(41)).toBe('normal');
    });

    it('returns "normal" for value 50 (slider position)', () => {
      expect(getCreativityLevel(50)).toBe('normal');
    });

    it('returns "normal" for value 60 (boundary)', () => {
      expect(getCreativityLevel(60)).toBe('normal');
    });
  });

  describe('adventurous range (61-80)', () => {
    it('returns "adventurous" for value 61 (boundary)', () => {
      expect(getCreativityLevel(61)).toBe('adventurous');
    });

    it('returns "adventurous" for value 75 (slider position)', () => {
      expect(getCreativityLevel(75)).toBe('adventurous');
    });

    it('returns "adventurous" for value 80 (boundary)', () => {
      expect(getCreativityLevel(80)).toBe('adventurous');
    });
  });

  describe('high range (81-100)', () => {
    it('returns "high" for value 81 (boundary)', () => {
      expect(getCreativityLevel(81)).toBe('high');
    });

    it('returns "high" for value 100 (slider position)', () => {
      expect(getCreativityLevel(100)).toBe('high');
    });
  });
});
