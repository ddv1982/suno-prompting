import { describe, it, expect } from 'bun:test';

import {
  ERA_INSTRUMENTS,
  INSTRUMENT_ERAS,
  selectEraInstruments,
  getEraInstruments,
  isEraInstrument,
  getInstrumentEras,
  getEraForGenre,
} from '@bun/instruments';

describe('Era-Tagged Instruments', () => {
  describe('ERA_INSTRUMENTS', () => {
    it('should have all 4 eras defined', () => {
      expect(ERA_INSTRUMENTS['70s']).toBeDefined();
      expect(ERA_INSTRUMENTS['80s']).toBeDefined();
      expect(ERA_INSTRUMENTS['90s']).toBeDefined();
      expect(ERA_INSTRUMENTS.modern).toBeDefined();
    });

    it('should have at least 8 instruments per era', () => {
      for (const era of INSTRUMENT_ERAS) {
        expect(ERA_INSTRUMENTS[era].length).toBeGreaterThanOrEqual(8);
      }
    });

    it('should have unique instruments within each era', () => {
      for (const era of INSTRUMENT_ERAS) {
        const instruments = ERA_INSTRUMENTS[era];
        const uniqueSet = new Set(instruments);
        expect(uniqueSet.size).toBe(instruments.length);
      }
    });
  });

  describe('selectEraInstruments', () => {
    it('should select requested number of instruments', () => {
      const result = selectEraInstruments('80s', 3, () => 0.5);
      expect(result).toHaveLength(3);
    });

    it('should not exceed available instruments', () => {
      const result = selectEraInstruments('70s', 100);
      expect(result.length).toBeLessThanOrEqual(ERA_INSTRUMENTS['70s'].length);
    });

    it('should return unique instruments', () => {
      const result = selectEraInstruments('90s', 5, () => 0.5);
      const uniqueSet = new Set(result);
      expect(uniqueSet.size).toBe(result.length);
    });

    it('should return instruments from the specified era', () => {
      const result = selectEraInstruments('80s', 3, () => 0.3);
      const eraInstruments = new Set(ERA_INSTRUMENTS['80s']);
      for (const instrument of result) {
        expect(eraInstruments.has(instrument)).toBe(true);
      }
    });

    it('should produce deterministic results with fixed RNG', () => {
      const fixedRng = () => 0.5;
      const result1 = selectEraInstruments('modern', 3, fixedRng);
      const result2 = selectEraInstruments('modern', 3, fixedRng);
      expect(result1).toEqual(result2);
    });
  });

  describe('getEraInstruments', () => {
    it('should return all instruments for an era', () => {
      const instruments = getEraInstruments('80s');
      expect(instruments.length).toBeGreaterThan(0);
      expect(instruments).toContain('DX7');
      expect(instruments).toContain('LinnDrum');
    });
  });

  describe('isEraInstrument', () => {
    it('should return true for valid era instruments', () => {
      expect(isEraInstrument('DX7', '80s')).toBe(true);
      expect(isEraInstrument('TB-303', '90s')).toBe(true);
      expect(isEraInstrument('Moog synthesizer', '70s')).toBe(true);
    });

    it('should return false for instruments not in the era', () => {
      expect(isEraInstrument('DX7', '70s')).toBe(false);
      expect(isEraInstrument('TB-303', '80s')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isEraInstrument('dx7', '80s')).toBe(true);
      expect(isEraInstrument('MOOG SYNTHESIZER', '70s')).toBe(true);
    });
  });

  describe('getInstrumentEras', () => {
    it('should return eras for known instruments', () => {
      const eras = getInstrumentEras('DX7');
      expect(eras).toContain('80s');
    });

    it('should return empty array for unknown instruments', () => {
      const eras = getInstrumentEras('unknown-instrument');
      expect(eras).toEqual([]);
    });
  });
});

describe('Genre-Era Mapping', () => {
  describe('getEraForGenre', () => {
    it('should return 80s for synthwave genres', () => {
      expect(getEraForGenre('synthwave')).toBe('80s');
      expect(getEraForGenre('outrun')).toBe('80s');
      expect(getEraForGenre('darksynth')).toBe('80s');
    });

    it('should return 90s for 90s genres', () => {
      expect(getEraForGenre('grunge')).toBe('90s');
      expect(getEraForGenre('jungle')).toBe('90s');
      expect(getEraForGenre('uk garage')).toBe('90s');
    });

    it('should return 70s for 70s genres', () => {
      expect(getEraForGenre('disco')).toBe('70s');
      expect(getEraForGenre('funk')).toBe('70s');
    });

    it('should return modern for unmapped genres', () => {
      expect(getEraForGenre('rock')).toBe('modern');
      expect(getEraForGenre('pop')).toBe('modern');
      expect(getEraForGenre('unknown')).toBe('modern');
    });

    it('should be case-insensitive', () => {
      expect(getEraForGenre('SYNTHWAVE')).toBe('80s');
      expect(getEraForGenre('Grunge')).toBe('90s');
    });
  });
});
