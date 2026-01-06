import { describe, it, expect } from 'bun:test';

import {
  QUICK_VIBES_TEMPLATES,
  buildDeterministicQuickVibes,
  generateQuickVibesTitle,
  getQuickVibesTemplate,
} from '@bun/prompt/quick-vibes-templates';

describe('QUICK_VIBES_TEMPLATES', () => {
  it('has templates for all 6 categories', () => {
    const categories = [
      'lofi-study',
      'cafe-coffeeshop',
      'ambient-focus',
      'latenight-chill',
      'cozy-rainy',
      'lofi-chill',
    ] as const;

    for (const category of categories) {
      expect(QUICK_VIBES_TEMPLATES[category]).toBeDefined();
    }
  });

  it('each template has required structure', () => {
    for (const [, template] of Object.entries(QUICK_VIBES_TEMPLATES)) {
      expect(template.genres).toBeDefined();
      expect(template.genres.length).toBeGreaterThan(0);
      expect(template.instruments).toBeDefined();
      expect(template.instruments.length).toBeGreaterThan(0);
      expect(template.moods).toBeDefined();
      expect(template.moods.length).toBeGreaterThan(0);
      expect(template.titleWords).toBeDefined();
      expect(template.titleWords.adjectives.length).toBeGreaterThan(0);
      expect(template.titleWords.nouns.length).toBeGreaterThan(0);
      expect(template.titleWords.contexts.length).toBeGreaterThan(0);
    }
  });
});

describe('buildDeterministicQuickVibes', () => {
  it('returns text and title for lofi-study category', () => {
    const result = buildDeterministicQuickVibes('lofi-study', false, true);

    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('includes wordless vocals when requested', () => {
    const result = buildDeterministicQuickVibes('lofi-study', true, true);

    expect(result.text).toContain('wordless vocals');
  });

  it('uses MAX mode format when maxMode is true', () => {
    const result = buildDeterministicQuickVibes('cafe-coffeeshop', false, true);

    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('Mood:');
    expect(result.text).toContain('Instruments:');
  });

  it('uses simpler format when maxMode is false', () => {
    const result = buildDeterministicQuickVibes('ambient-focus', false, false);

    // Standard mode has genre and mood in first line
    expect(result.text).toContain('Instruments:');
    // Should NOT have the quoted format of max mode
    expect(result.text).not.toContain('Genre: "');
  });

  it('produces deterministic output with same seed', () => {
    let rngIndex = 0;
    const seededRng = () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      return values[(rngIndex++) % values.length]!;
    };

    rngIndex = 0;
    const result1 = buildDeterministicQuickVibes('lofi-chill', false, true, seededRng);

    rngIndex = 0;
    const result2 = buildDeterministicQuickVibes('lofi-chill', false, true, seededRng);

    expect(result1.text).toBe(result2.text);
    expect(result1.title).toBe(result2.title);
  });

  it('produces different output with different RNG', () => {
    const result1 = buildDeterministicQuickVibes('latenight-chill', false, true, () => 0.1);
    const result2 = buildDeterministicQuickVibes('latenight-chill', false, true, () => 0.9);

    // Different RNG values should produce different outputs
    expect(result1.text).not.toBe(result2.text);
  });
});

describe('generateQuickVibesTitle', () => {
  it('generates title from template words', () => {
    const template = QUICK_VIBES_TEMPLATES['lofi-study'];
    const title = generateQuickVibesTitle(template, () => 0.1);

    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  it('sometimes includes context in title', () => {
    const template = QUICK_VIBES_TEMPLATES['cafe-coffeeshop'];
    // RNG < 0.5 will include context
    const titleWithContext = generateQuickVibesTitle(template, () => 0.1);
    // RNG >= 0.5 will not include context
    const titleWithoutContext = generateQuickVibesTitle(template, () => 0.9);

    // One should be longer than the other (has context)
    expect(titleWithContext.split(' ').length).toBeGreaterThan(titleWithoutContext.split(' ').length);
  });
});

describe('getQuickVibesTemplate', () => {
  it('returns template for valid category', () => {
    const template = getQuickVibesTemplate('ambient-focus');

    expect(template).toBeDefined();
    expect(template.genres).toBeDefined();
  });
});
