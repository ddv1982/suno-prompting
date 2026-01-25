import { describe, it, expect } from 'bun:test';

import {
  QUICK_VIBES_TEMPLATES,
  buildDeterministicQuickVibes,
  generateQuickVibesTitle,
  getQuickVibesTemplate,
} from '@bun/prompt/quick-vibes';

import type { QuickVibesCategory } from '@shared/types';

describe('Quick Vibes Templates v3.0', () => {
  describe('Template Registry', () => {
    it('should have 16 total categories', () => {
      const categoryCount = Object.keys(QUICK_VIBES_TEMPLATES).length;
      expect(categoryCount).toBe(16);
    });

    it('should have all original 6 categories', () => {
      const originalCategories: QuickVibesCategory[] = [
        'lofi-study',
        'cafe-coffeeshop',
        'ambient-focus',
        'latenight-chill',
        'cozy-rainy',
        'lofi-chill',
      ];
      for (const category of originalCategories) {
        expect(QUICK_VIBES_TEMPLATES[category]).toBeDefined();
      }
    });

    it('should have all 10 new v3.0 categories', () => {
      const newCategories: QuickVibesCategory[] = [
        'workout-energy',
        'morning-sunshine',
        'sunset-golden',
        'dinner-party',
        'road-trip',
        'gaming-focus',
        'romantic-evening',
        'meditation-zen',
        'creative-flow',
        'party-night',
      ];
      for (const category of newCategories) {
        expect(QUICK_VIBES_TEMPLATES[category]).toBeDefined();
      }
    });
  });

  describe('New Category Templates Structure', () => {
    const newCategories: QuickVibesCategory[] = [
      'workout-energy',
      'morning-sunshine',
      'sunset-golden',
      'dinner-party',
      'road-trip',
      'gaming-focus',
      'romantic-evening',
      'meditation-zen',
      'creative-flow',
      'party-night',
    ];

    for (const category of newCategories) {
      describe(category, () => {
        it('should have at least 6 genres', () => {
          const template = QUICK_VIBES_TEMPLATES[category];
          expect(template.genres.length).toBeGreaterThanOrEqual(6);
        });

        it('should have at least 4 instrument combinations', () => {
          const template = QUICK_VIBES_TEMPLATES[category];
          expect(template.instruments.length).toBeGreaterThanOrEqual(4);
        });

        it('should have at least 6 moods', () => {
          const template = QUICK_VIBES_TEMPLATES[category];
          expect(template.moods.length).toBeGreaterThanOrEqual(6);
        });

        it('should have title word pools', () => {
          const template = QUICK_VIBES_TEMPLATES[category];
          expect(template.titleWords.adjectives.length).toBeGreaterThan(0);
          expect(template.titleWords.nouns.length).toBeGreaterThan(0);
          expect(template.titleWords.contexts.length).toBeGreaterThan(0);
        });

        it('should have 3+ instruments per combination', () => {
          const template = QUICK_VIBES_TEMPLATES[category];
          for (const combo of template.instruments) {
            expect(combo.length).toBeGreaterThanOrEqual(3);
          }
        });
      });
    }
  });

  describe('buildDeterministicQuickVibes for new categories', () => {
    const newCategories: QuickVibesCategory[] = [
      'workout-energy',
      'morning-sunshine',
      'sunset-golden',
      'dinner-party',
      'road-trip',
      'gaming-focus',
      'romantic-evening',
      'meditation-zen',
      'creative-flow',
      'party-night',
    ];

    for (const category of newCategories) {
      it(`should generate valid prompt for ${category}`, () => {
        const result = buildDeterministicQuickVibes(category, false, false, () => 0.5);
        expect(result.text).toBeTruthy();
        expect(result.text.length).toBeGreaterThan(10);
        expect(result.title).toBeTruthy();
      });

      it(`should generate MAX mode prompt for ${category}`, () => {
        const result = buildDeterministicQuickVibes(category, false, true, () => 0.5);
        // MAX mode uses lowercase field names
        expect(result.text).toContain('genre:');
        expect(result.text).toContain('mood:');
        expect(result.text).toContain('instruments:');
      });

      it(`should include wordless vocals when requested for ${category}`, () => {
        const result = buildDeterministicQuickVibes(category, true, false, () => 0.5);
        expect(result.text).toContain('wordless vocals');
      });
    }
  });

  describe('generateQuickVibesTitle for new categories', () => {
    const newCategories: QuickVibesCategory[] = [
      'workout-energy',
      'morning-sunshine',
      'sunset-golden',
      'dinner-party',
      'road-trip',
      'gaming-focus',
      'romantic-evening',
      'meditation-zen',
      'creative-flow',
      'party-night',
    ];

    for (const category of newCategories) {
      it(`should generate valid title for ${category}`, () => {
        const template = QUICK_VIBES_TEMPLATES[category];
        const title = generateQuickVibesTitle(template, () => 0.5);
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(3);
      });

      it(`should produce deterministic titles for ${category}`, () => {
        const template = QUICK_VIBES_TEMPLATES[category];
        const fixedRng = () => 0.3;
        const title1 = generateQuickVibesTitle(template, fixedRng);
        const title2 = generateQuickVibesTitle(template, fixedRng);
        expect(title1).toBe(title2);
      });
    }
  });

  describe('getQuickVibesTemplate', () => {
    it('should return template for new categories', () => {
      const template = getQuickVibesTemplate('workout-energy');
      expect(template).toBeDefined();
      expect(template.genres).toContain('EDM');
    });
  });

  describe('Template Content Quality', () => {
    it('workout-energy should have high-energy genres', () => {
      const template = QUICK_VIBES_TEMPLATES['workout-energy'];
      expect(template.genres).toContain('EDM');
      expect(template.genres).toContain('hardstyle');
      expect(template.moods).toContain('powerful');
      expect(template.moods).toContain('intense');
    });

    it('morning-sunshine should have bright, uplifting elements', () => {
      const template = QUICK_VIBES_TEMPLATES['morning-sunshine'];
      expect(template.genres).toContain('indie pop');
      expect(template.moods).toContain('bright');
      expect(template.moods).toContain('hopeful');
    });

    it('meditation-zen should have peaceful, ambient elements', () => {
      const template = QUICK_VIBES_TEMPLATES['meditation-zen'];
      expect(template.genres).toContain('ambient');
      expect(template.genres).toContain('meditation');
      expect(template.moods).toContain('peaceful');
      expect(template.moods).toContain('serene');
    });

    it('party-night should have dance-friendly elements', () => {
      const template = QUICK_VIBES_TEMPLATES['party-night'];
      expect(template.genres).toContain('house');
      expect(template.genres).toContain('disco');
      expect(template.moods).toContain('euphoric');
      expect(template.moods).toContain('party');
    });
  });
});
