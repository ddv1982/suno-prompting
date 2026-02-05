import { describe, it, expect } from 'bun:test';

import {
  QUICK_VIBES_TEMPLATES,
  buildDeterministicQuickVibes,
  generateQuickVibesTitle,
  getQuickVibesTemplate,
} from '@bun/prompt/quick-vibes';

import type { TraceCollector } from '@bun/trace';
import type { TraceDecisionEvent } from '@shared/types/trace';

// =============================================================================
// Test Constants - RNG values for deterministic testing
// =============================================================================

/** RNG value that triggers "with context" branch (< 0.5) */
const RNG_WITH_CONTEXT = 0.1;

/** RNG value that triggers "without context" branch (>= 0.5) */
const RNG_WITHOUT_CONTEXT = 0.9;

/** Fixed RNG values for deterministic comparison tests */
const RNG_FIXED_LOW = 0.1;
const RNG_FIXED_HIGH = 0.9;

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
    const result = buildDeterministicQuickVibes('lofi-study', true);

    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('uses MAX mode format when maxMode is true', () => {
    const result = buildDeterministicQuickVibes('cafe-coffeeshop', true);

    // MAX mode uses lowercase field names with quoted values
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('mood:');
    expect(result.text).toContain('instruments:');
  });

  it('uses simpler format when maxMode is false', () => {
    const result = buildDeterministicQuickVibes('ambient-focus', false);

    // Standard mode has genre and mood in first line, Instruments capitalized
    expect(result.text).toContain('Instruments:');
    // Should NOT have the quoted lowercase format of max mode
    expect(result.text).not.toContain('genre: "');
  });

  it('produces deterministic output with same seed', () => {
    let rngIndex = 0;
    const seededRng = () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      return values[rngIndex++ % values.length]!;
    };

    rngIndex = 0;
    const result1 = buildDeterministicQuickVibes('lofi-chill', true, seededRng);

    rngIndex = 0;
    const result2 = buildDeterministicQuickVibes('lofi-chill', true, seededRng);

    expect(result1.text).toBe(result2.text);
    expect(result1.title).toBe(result2.title);
  });

  it('produces different output with different RNG', () => {
    const result1 = buildDeterministicQuickVibes('latenight-chill', true, () => RNG_FIXED_LOW);
    const result2 = buildDeterministicQuickVibes('latenight-chill', true, () => RNG_FIXED_HIGH);

    // Different RNG values should produce different outputs
    expect(result1.text).not.toBe(result2.text);
  });
});

describe('generateQuickVibesTitle', () => {
  it('generates title from template words', () => {
    const template = QUICK_VIBES_TEMPLATES['lofi-study'];
    const title = generateQuickVibesTitle(template, () => RNG_FIXED_LOW);

    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  it('sometimes includes context in title', () => {
    const template = QUICK_VIBES_TEMPLATES['cafe-coffeeshop'];
    // RNG < 0.5 triggers context suffix
    const titleWithContext = generateQuickVibesTitle(template, () => RNG_WITH_CONTEXT);
    // RNG >= 0.5 skips context suffix
    const titleWithoutContext = generateQuickVibesTitle(template, () => RNG_WITHOUT_CONTEXT);

    // Title with context should have more words
    expect(titleWithContext.split(' ').length).toBeGreaterThan(
      titleWithoutContext.split(' ').length
    );
  });
});

describe('getQuickVibesTemplate', () => {
  it('returns template for valid category', () => {
    const template = getQuickVibesTemplate('ambient-focus');

    expect(template).toBeDefined();
    expect(template.genres).toBeDefined();
  });
});

describe('trace instrumentation', () => {
  it('records trace decisions when collector provided', () => {
    const events: Partial<TraceDecisionEvent>[] = [];
    const mockTrace = {
      enabled: true,
      addDecisionEvent: (event: Omit<TraceDecisionEvent, 'id' | 'ts' | 'tMs' | 'type'>) => {
        events.push(event);
      },
    } as TraceCollector;

    buildDeterministicQuickVibes('lofi-study', true, {
      maxMode: true,
      rng: () => 0.5,
      trace: mockTrace,
    });

    expect(events).toHaveLength(4);
    expect(events.map((e) => e.key)).toEqual([
      'quickVibes.genre.select',
      'quickVibes.instruments.select',
      'quickVibes.mood.select',
      'quickVibes.title.generate',
    ]);
  });

  it('includes selection candidates in trace events', () => {
    const events: Partial<TraceDecisionEvent>[] = [];
    const mockTrace = {
      enabled: true,
      addDecisionEvent: (event: Omit<TraceDecisionEvent, 'id' | 'ts' | 'tMs' | 'type'>) => {
        events.push(event);
      },
    } as TraceCollector;

    buildDeterministicQuickVibes('lofi-study', true, {
      maxMode: true,
      rng: () => 0.5,
      trace: mockTrace,
    });

    const genreEvent = events.find((e) => e.key === 'quickVibes.genre.select');
    expect(genreEvent?.selection?.method).toBe('pickRandom');
    expect(genreEvent?.selection?.candidatesCount).toBeGreaterThan(0);
  });

  it('does not throw when trace is undefined', () => {
    expect(() => {
      buildDeterministicQuickVibes('lofi-study', true, {
        maxMode: true,
        rng: () => 0.5,
      });
    }).not.toThrow();
  });
});
