import { describe, it, expect } from 'bun:test';

import {
  RECORDING_DESCRIPTORS,
  GENERIC_STYLE_TAGS,
  selectRealismTags,
  selectElectronicTags,
  isElectronicGenre,
  selectRecordingDescriptors,
  selectGenericTags,
  _testHelpers,
} from '@bun/prompt/realism-tags';

const {
  REALISM_TAGS,
  ELECTRONIC_CLARITY_TAGS,
  GENRE_REALISM_MAP,
  ELECTRONIC_GENRES,
} = _testHelpers;

describe('realism-tags', () => {
  describe('REALISM_TAGS constant', () => {
    it('has all expected categories', () => {
      expect(REALISM_TAGS.roomAcoustics).toBeDefined();
      expect(REALISM_TAGS.micCharacter).toBeDefined();
      expect(REALISM_TAGS.performance).toBeDefined();
      expect(REALISM_TAGS.humanSounds).toBeDefined();
      expect(REALISM_TAGS.instrumentNoises).toBeDefined();
      expect(REALISM_TAGS.analogCharacter).toBeDefined();
      expect(REALISM_TAGS.mixCharacter).toBeDefined();
    });

    it('has non-empty arrays for each category', () => {
      for (const [, tags] of Object.entries(REALISM_TAGS)) {
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThan(0);
      }
    });

    it('has string values in each category', () => {
      for (const tags of Object.values(REALISM_TAGS)) {
        for (const tag of tags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('ELECTRONIC_CLARITY_TAGS constant', () => {
    it('has all expected categories', () => {
      expect(ELECTRONIC_CLARITY_TAGS.bassControl).toBeDefined();
      expect(ELECTRONIC_CLARITY_TAGS.transients).toBeDefined();
      expect(ELECTRONIC_CLARITY_TAGS.spatial).toBeDefined();
      expect(ELECTRONIC_CLARITY_TAGS.distortion).toBeDefined();
      expect(ELECTRONIC_CLARITY_TAGS.arrangement).toBeDefined();
    });

    it('has non-empty arrays for each category', () => {
      for (const [, tags] of Object.entries(ELECTRONIC_CLARITY_TAGS)) {
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('GENRE_REALISM_MAP', () => {
    it('maps acoustic genres to realism categories', () => {
      expect(GENRE_REALISM_MAP.country).toContain('roomAcoustics');
      expect(GENRE_REALISM_MAP.folk).toContain('instrumentNoises');
      expect(GENRE_REALISM_MAP.blues).toContain('humanSounds');
    });

    it('maps rock genres to partial realism', () => {
      expect(GENRE_REALISM_MAP.rock).toContain('performance');
      expect(GENRE_REALISM_MAP.metal).toContain('instrumentNoises');
    });

    it('maps electronic genres to empty arrays', () => {
      expect(GENRE_REALISM_MAP.electronic).toEqual([]);
      expect(GENRE_REALISM_MAP.edm).toEqual([]);
      expect(GENRE_REALISM_MAP.house).toEqual([]);
    });

    it('maps lofi to analog character only', () => {
      expect(GENRE_REALISM_MAP.lofi).toEqual(['analogCharacter']);
    });

    it('maps classical to room and performance', () => {
      expect(GENRE_REALISM_MAP.classical).toContain('roomAcoustics');
      expect(GENRE_REALISM_MAP.classical).toContain('performance');
    });
  });

  describe('ELECTRONIC_GENRES set', () => {
    it('contains expected electronic genres', () => {
      expect(ELECTRONIC_GENRES.has('electronic')).toBe(true);
      expect(ELECTRONIC_GENRES.has('edm')).toBe(true);
      expect(ELECTRONIC_GENRES.has('house')).toBe(true);
      expect(ELECTRONIC_GENRES.has('techno')).toBe(true);
      expect(ELECTRONIC_GENRES.has('dubstep')).toBe(true);
      expect(ELECTRONIC_GENRES.has('synthwave')).toBe(true);
    });

    it('does not contain acoustic genres', () => {
      expect(ELECTRONIC_GENRES.has('jazz')).toBe(false);
      expect(ELECTRONIC_GENRES.has('folk')).toBe(false);
      expect(ELECTRONIC_GENRES.has('country')).toBe(false);
    });
  });

  describe('selectRealismTags', () => {
    it('returns tags for acoustic genres', () => {
      const tags = selectRealismTags('folk', 4);
      expect(tags.length).toBeLessThanOrEqual(4);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('returns empty array for electronic genres', () => {
      const tags = selectRealismTags('electronic');
      expect(tags).toEqual([]);
    });

    it('returns empty array for unmapped genres', () => {
      const tags = selectRealismTags('unknowngenre');
      expect(tags).toEqual([]);
    });

    it('respects count parameter', () => {
      const tags = selectRealismTags('country', 2);
      expect(tags.length).toBeLessThanOrEqual(2);
    });

    it('normalizes genre case', () => {
      const tagsLower = selectRealismTags('folk', 4);
      const tagsUpper = selectRealismTags('FOLK', 4);
      // Both should return tags (though shuffled differently)
      expect(tagsLower.length).toBeGreaterThan(0);
      expect(tagsUpper.length).toBeGreaterThan(0);
    });

    it('trims whitespace from genre', () => {
      const tags = selectRealismTags('  jazz  ', 4);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('returns valid tags from REALISM_TAGS', () => {
      const tags = selectRealismTags('blues', 10);
      const allRealismTags = Object.values(REALISM_TAGS).flat() as string[];
      for (const tag of tags) {
        expect(allRealismTags).toContain(tag);
      }
    });
  });

  describe('selectElectronicTags', () => {
    it('returns electronic clarity tags', () => {
      const tags = selectElectronicTags(4);
      expect(tags.length).toBeLessThanOrEqual(4);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const tags = selectElectronicTags(2);
      expect(tags.length).toBeLessThanOrEqual(2);
    });

    it('returns valid tags from ELECTRONIC_CLARITY_TAGS', () => {
      const tags = selectElectronicTags(10);
      const allElectronicTags = Object.values(ELECTRONIC_CLARITY_TAGS).flat() as string[];
      for (const tag of tags) {
        expect(allElectronicTags).toContain(tag);
      }
    });
  });

  describe('isElectronicGenre', () => {
    it('returns true for electronic genres in set', () => {
      expect(isElectronicGenre('electronic')).toBe(true);
      expect(isElectronicGenre('edm')).toBe(true);
      expect(isElectronicGenre('house')).toBe(true);
      expect(isElectronicGenre('techno')).toBe(true);
    });

    it('returns false for acoustic genres', () => {
      expect(isElectronicGenre('jazz')).toBe(false);
      expect(isElectronicGenre('folk')).toBe(false);
      expect(isElectronicGenre('country')).toBe(false);
    });

    it('returns true for genres containing "electronic"', () => {
      expect(isElectronicGenre('electronic rock')).toBe(true);
      expect(isElectronicGenre('atmospheric electronic')).toBe(true);
    });

    it('returns true for genres containing "synth"', () => {
      expect(isElectronicGenre('synthpop')).toBe(true);
      expect(isElectronicGenre('synth rock')).toBe(true);
    });

    it('returns true for genres containing "edm"', () => {
      expect(isElectronicGenre('progressive edm')).toBe(true);
    });

    it('normalizes case', () => {
      expect(isElectronicGenre('ELECTRONIC')).toBe(true);
      expect(isElectronicGenre('EDM')).toBe(true);
    });

    it('trims whitespace', () => {
      expect(isElectronicGenre('  house  ')).toBe(true);
    });
  });

  describe('selectRecordingDescriptors', () => {
    it('returns recording descriptors', () => {
      const descriptors = selectRecordingDescriptors(3);
      expect(descriptors.length).toBeLessThanOrEqual(3);
      expect(descriptors.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const descriptors = selectRecordingDescriptors(2);
      expect(descriptors.length).toBeLessThanOrEqual(2);
    });

    it('returns valid descriptors from RECORDING_DESCRIPTORS', () => {
      const descriptors = selectRecordingDescriptors(10);
      const allDescriptors = RECORDING_DESCRIPTORS as readonly string[];
      for (const descriptor of descriptors) {
        expect(allDescriptors).toContain(descriptor);
      }
    });
  });

  describe('selectGenericTags', () => {
    it('returns generic style tags', () => {
      const tags = selectGenericTags(4);
      expect(tags.length).toBeLessThanOrEqual(4);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('respects count parameter', () => {
      const tags = selectGenericTags(2);
      expect(tags.length).toBeLessThanOrEqual(2);
    });

    it('returns valid tags from GENERIC_STYLE_TAGS', () => {
      const tags = selectGenericTags(10);
      const allTags = GENERIC_STYLE_TAGS as readonly string[];
      for (const tag of tags) {
        expect(allTags).toContain(tag);
      }
    });
  });

  describe('RECORDING_DESCRIPTORS constant', () => {
    it('has non-empty array', () => {
      expect(RECORDING_DESCRIPTORS.length).toBeGreaterThan(0);
    });

    it('contains string descriptors', () => {
      for (const descriptor of RECORDING_DESCRIPTORS) {
        expect(typeof descriptor).toBe('string');
        expect(descriptor.length).toBeGreaterThan(0);
      }
    });
  });

  describe('GENERIC_STYLE_TAGS constant', () => {
    it('has non-empty array', () => {
      expect(GENERIC_STYLE_TAGS.length).toBeGreaterThan(0);
    });

    it('contains string tags', () => {
      for (const tag of GENERIC_STYLE_TAGS) {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      }
    });
  });
});
