import { describe, test, expect } from 'bun:test';

import { toTitleCase } from '@shared/text-utils';

describe('toTitleCase', () => {
  describe('basic title case', () => {
    test('capitalizes first letter of each word', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('indie rock')).toBe('Indie Rock');
    });

    test('handles single word', () => {
      expect(toTitleCase('jazz')).toBe('Jazz');
      expect(toTitleCase('pop')).toBe('Pop');
    });

    test('converts uppercase to proper case', () => {
      expect(toTitleCase('ROCK')).toBe('Rock');
      expect(toTitleCase('INDIE ROCK')).toBe('Indie Rock');
    });

    test('handles empty string', () => {
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('special cases', () => {
    test('handles R&B correctly', () => {
      expect(toTitleCase('r&b')).toBe('R&B');
      expect(toTitleCase('alternative r&b')).toBe('Alternative R&B');
    });

    test('handles Lo-Fi correctly', () => {
      expect(toTitleCase('lo-fi')).toBe('Lo-Fi');
      expect(toTitleCase('lo-fi hip hop')).toBe('Lo-Fi Hip Hop');
    });

    test('handles K-Pop and J-Pop correctly', () => {
      expect(toTitleCase('k-pop')).toBe('K-Pop');
      expect(toTitleCase('j-pop')).toBe('J-Pop');
    });

    test('handles G-Funk and P-Funk correctly', () => {
      expect(toTitleCase('g-funk')).toBe('G-Funk');
      expect(toTitleCase('p-funk')).toBe('P-Funk');
    });

    test('handles EDM correctly', () => {
      expect(toTitleCase('edm')).toBe('EDM');
      expect(toTitleCase('edm disco')).toBe('EDM Disco');
    });
  });

  describe('hyphenated words', () => {
    test('handles numeric prefixes', () => {
      expect(toTitleCase('16-bit')).toBe('16-Bit');
      expect(toTitleCase('16-bit celtic')).toBe('16-Bit Celtic');
      expect(toTitleCase('2-step')).toBe('2-Step');
    });

    test('handles regular hyphenated words', () => {
      expect(toTitleCase('afro-jazz')).toBe('Afro-Jazz');
      expect(toTitleCase('afro-cuban jazz')).toBe('Afro-Cuban Jazz');
    });

    test('handles mixed hyphenated words', () => {
      expect(toTitleCase('nu-disco')).toBe('Nu-Disco');
    });
  });

  describe('complex style combinations', () => {
    test('handles multi-word styles with special cases', () => {
      expect(toTitleCase('lo-fi afro-cuban jazz')).toBe('Lo-Fi Afro-Cuban Jazz');
      expect(toTitleCase('k-pop acoustic texas blues')).toBe('K-Pop Acoustic Texas Blues');
    });

    test('handles Suno V5 style examples', () => {
      expect(toTitleCase('acid house boom bap')).toBe('Acid House Boom Bap');
      expect(toTitleCase('ambient techno hyphy')).toBe('Ambient Techno Hyphy');
      expect(toTitleCase('dreamy shoegaze')).toBe('Dreamy Shoegaze');
    });
  });
});
