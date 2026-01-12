import { describe, it, expect } from 'bun:test';

import {
  ENSEMBLE_PRESETS,
  ENSEMBLE_NAMES,
  expandEnsemble,
  getEnsemblesForGenre,
  isEnsemble,
  getEnsemble,
  selectEnsembleForGenre,
} from '@bun/instruments';

describe('Ensemble Presets', () => {
  describe('ENSEMBLE_PRESETS', () => {
    it('should have 10 ensemble presets', () => {
      expect(ENSEMBLE_PRESETS.length).toBe(10);
    });

    it('should have all required ensembles', () => {
      const expectedNames = [
        'string quartet',
        'horn section',
        'gospel choir',
        'brass band',
        'jazz combo',
        'rock band',
        'chamber orchestra',
        'synth stack',
        'world percussion',
        'electronic kit',
      ];
      for (const name of expectedNames) {
        const found = ENSEMBLE_PRESETS.find((p) => p.name === name);
        expect(found).toBeDefined();
      }
    });

    it('should have 3-4 instruments per ensemble', () => {
      for (const preset of ENSEMBLE_PRESETS) {
        expect(preset.instruments.length).toBeGreaterThanOrEqual(3);
        expect(preset.instruments.length).toBeLessThanOrEqual(5);
      }
    });

    it('should have genre associations for each ensemble', () => {
      for (const preset of ENSEMBLE_PRESETS) {
        expect(preset.genres.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ENSEMBLE_NAMES', () => {
    it('should contain all ensemble names', () => {
      expect(ENSEMBLE_NAMES.length).toBe(10);
      expect(ENSEMBLE_NAMES).toContain('string quartet');
      expect(ENSEMBLE_NAMES).toContain('rock band');
    });
  });

  describe('expandEnsemble', () => {
    it('should expand string quartet to individual instruments', () => {
      const instruments = expandEnsemble('string quartet');
      expect(instruments).toContain('violin');
      expect(instruments).toContain('viola');
      expect(instruments).toContain('cello');
      expect(instruments.length).toBeGreaterThanOrEqual(4);
    });

    it('should expand horn section to individual instruments', () => {
      const instruments = expandEnsemble('horn section');
      expect(instruments).toContain('trumpet');
      expect(instruments).toContain('trombone');
      expect(instruments).toContain('saxophone');
    });

    it('should expand rock band to individual instruments', () => {
      const instruments = expandEnsemble('rock band');
      expect(instruments).toContain('electric guitar');
      expect(instruments).toContain('bass guitar');
      expect(instruments).toContain('drums');
    });

    it('should return single-item array for non-ensemble names', () => {
      const instruments = expandEnsemble('piano');
      expect(instruments).toEqual(['piano']);
    });

    it('should be case-insensitive', () => {
      const instruments = expandEnsemble('ROCK BAND');
      expect(instruments).toContain('electric guitar');
    });
  });

  describe('getEnsemblesForGenre', () => {
    it('should return appropriate ensembles for jazz', () => {
      const ensembles = getEnsemblesForGenre('jazz');
      const names = ensembles.map((e) => e.name);
      expect(names).toContain('jazz combo');
      expect(names).toContain('horn section');
    });

    it('should return appropriate ensembles for electronic', () => {
      const ensembles = getEnsemblesForGenre('electronic');
      const names = ensembles.map((e) => e.name);
      expect(names).toContain('synth stack');
      expect(names).toContain('electronic kit');
    });

    it('should return appropriate ensembles for rock', () => {
      const ensembles = getEnsemblesForGenre('rock');
      const names = ensembles.map((e) => e.name);
      expect(names).toContain('rock band');
    });

    it('should return empty array for unknown genres', () => {
      const ensembles = getEnsemblesForGenre('unknown-genre-xyz');
      expect(ensembles).toEqual([]);
    });
  });

  describe('isEnsemble', () => {
    it('should return true for valid ensemble names', () => {
      expect(isEnsemble('string quartet')).toBe(true);
      expect(isEnsemble('rock band')).toBe(true);
      expect(isEnsemble('synth stack')).toBe(true);
    });

    it('should return false for non-ensemble names', () => {
      expect(isEnsemble('piano')).toBe(false);
      expect(isEnsemble('guitar')).toBe(false);
      expect(isEnsemble('random')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isEnsemble('STRING QUARTET')).toBe(true);
      expect(isEnsemble('Rock Band')).toBe(true);
    });
  });

  describe('getEnsemble', () => {
    it('should return ensemble preset by name', () => {
      const preset = getEnsemble('jazz combo');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('jazz combo');
      expect(preset?.instruments).toContain('piano');
    });

    it('should return undefined for unknown names', () => {
      const preset = getEnsemble('unknown');
      expect(preset).toBeUndefined();
    });
  });

  describe('selectEnsembleForGenre', () => {
    it('should return an ensemble for valid genres', () => {
      const ensemble = selectEnsembleForGenre('jazz', () => 0.5);
      expect(ensemble).toBeDefined();
      expect(ensemble?.genres).toContain('jazz');
    });

    it('should return undefined for genres with no matching ensembles', () => {
      const ensemble = selectEnsembleForGenre('unknown-genre-xyz');
      expect(ensemble).toBeUndefined();
    });

    it('should produce deterministic results with fixed RNG', () => {
      const fixedRng = () => 0.5;
      const result1 = selectEnsembleForGenre('jazz', fixedRng);
      const result2 = selectEnsembleForGenre('jazz', fixedRng);
      expect(result1).toEqual(result2);
    });
  });
});
