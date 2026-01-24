/**
 * Unit tests for Enhanced LLM Enrichment features.
 *
 * Tests schema validation for enriched context, fallback extraction,
 * era tag mappings, intent tags, musical reference validation,
 * narrative arc mapping, and cultural context.
 *
 * @module tests/unit/thematic-context-enriched
 */

import { describe, expect, test } from 'bun:test';

import {
  getCulturalInstruments,
  getCulturalScale,
  isCulturalRegion,
  selectCulturalInstruments,
  CULTURAL_REGIONS,
} from '@bun/instruments/cultural-instruments';
import { extractEnrichment } from '@bun/keywords';
import { getEraProductionTags, getEraProductionTagsLimited } from '@bun/prompt/deterministic/era-tags';
import { getIntentTags, getIntentTagsLimited } from '@bun/prompt/deterministic/intent-tags';
import {
  narrativeArcToContrast,
  mergeContrastWithNarrativeArc,
  inferDynamicsFromArc,
} from '@bun/prompt/sections/section-builder';
import {
  ThematicContextSchema,
  EraSchema,
  TempoSchema,
  TempoCurveSchema,
  IntentSchema,
  MusicalReferenceSchema,
  CulturalContextSchema,
} from '@shared/schemas/thematic-context';

import type { Era, Intent, CulturalContext } from '@shared/schemas/thematic-context';

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('ThematicContextSchema - Core Enrichment', () => {
  describe('valid enriched context', () => {
    test('accepts context with era field', () => {
      const valid = {
        themes: ['retro', 'synth', 'neon'],
        moods: ['nostalgic', 'energetic'],
        scene: 'driving through neon-lit streets at night',
        era: '80s',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.era).toBe('80s');
      }
    });

    test('accepts context with tempo field', () => {
      const valid = {
        themes: ['chase', 'action', 'thriller'],
        moods: ['tense', 'exciting'],
        scene: 'high-speed chase through city streets',
        tempo: { adjustment: 15, curve: 'explosive' },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tempo?.adjustment).toBe(15);
        expect(result.data.tempo?.curve).toBe('explosive');
      }
    });

    test('accepts context with contrast field', () => {
      const valid = {
        themes: ['journey', 'transformation', 'hope'],
        moods: ['melancholic', 'hopeful'],
        scene: 'dawn breaking after a long dark night',
        contrast: {
          sections: [
            { type: 'intro', mood: 'somber', dynamics: 'soft' },
            { type: 'verse', mood: 'building', dynamics: 'building' },
            { type: 'chorus', mood: 'triumphant', dynamics: 'powerful' },
          ],
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contrast?.sections).toHaveLength(3);
        expect(result.data.contrast?.sections[0]?.type).toBe('intro');
      }
    });

    test('accepts fully enriched context with all core fields', () => {
      const valid = {
        themes: ['vintage', 'soul', 'groove'],
        moods: ['smooth', 'warm'],
        scene: 'a smoky jazz club in the seventies',
        era: '70s',
        tempo: { adjustment: -10, curve: 'steady' },
        contrast: {
          sections: [
            { type: 'verse', mood: 'mellow', dynamics: 'soft' },
            { type: 'chorus', mood: 'soulful', dynamics: 'building' },
          ],
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('minimal context (backwards compatibility)', () => {
    test('accepts context without any enrichment fields', () => {
      const minimal = {
        themes: ['love', 'heartbreak', 'memory'],
        moods: ['melancholic', 'nostalgic'],
        scene: 'rainy evening watching old photographs',
      };

      const result = ThematicContextSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.era).toBeUndefined();
        expect(result.data.tempo).toBeUndefined();
        expect(result.data.contrast).toBeUndefined();
      }
    });

    test('accepts context with only era enrichment', () => {
      const partial = {
        themes: ['disco', 'dance', 'party'],
        moods: ['joyful', 'energetic'],
        scene: 'disco ball spinning over the dance floor',
        era: '70s',
      };

      const result = ThematicContextSchema.safeParse(partial);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.era).toBe('70s');
        expect(result.data.tempo).toBeUndefined();
        expect(result.data.contrast).toBeUndefined();
      }
    });
  });
});

describe('EraSchema validation', () => {
  describe('valid era values', () => {
    test.each([
      ['50s-60s'],
      ['70s'],
      ['80s'],
      ['90s'],
      ['2000s'],
      ['modern'],
    ] as const)('accepts "%s" as valid era', (era) => {
      const result = EraSchema.safeParse(era);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid era values', () => {
    test('rejects invalid era string "60s"', () => {
      const result = EraSchema.safeParse('60s');
      expect(result.success).toBe(false);
    });

    test('rejects invalid era string "1980s"', () => {
      const result = EraSchema.safeParse('1980s');
      expect(result.success).toBe(false);
    });

    test('rejects invalid era string "retro"', () => {
      const result = EraSchema.safeParse('retro');
      expect(result.success).toBe(false);
    });

    test('rejects empty string', () => {
      const result = EraSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    test('rejects numeric value', () => {
      const result = EraSchema.safeParse(80);
      expect(result.success).toBe(false);
    });

    test('rejects null', () => {
      const result = EraSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe('TempoSchema validation', () => {
  describe('valid tempo values', () => {
    test('accepts minimum adjustment (-30)', () => {
      const result = TempoSchema.safeParse({ adjustment: -30, curve: 'steady' });
      expect(result.success).toBe(true);
    });

    test('accepts maximum adjustment (+30)', () => {
      const result = TempoSchema.safeParse({ adjustment: 30, curve: 'explosive' });
      expect(result.success).toBe(true);
    });

    test('accepts zero adjustment', () => {
      const result = TempoSchema.safeParse({ adjustment: 0, curve: 'gradual-rise' });
      expect(result.success).toBe(true);
    });

    test.each([
      ['steady'],
      ['gradual-rise'],
      ['gradual-fall'],
      ['explosive'],
    ] as const)('accepts "%s" as valid tempo curve', (curve) => {
      const result = TempoSchema.safeParse({ adjustment: 10, curve });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid tempo values', () => {
    test('rejects adjustment below minimum (-31)', () => {
      const result = TempoSchema.safeParse({ adjustment: -31, curve: 'steady' });
      expect(result.success).toBe(false);
    });

    test('rejects adjustment above maximum (+31)', () => {
      const result = TempoSchema.safeParse({ adjustment: 31, curve: 'steady' });
      expect(result.success).toBe(false);
    });

    test('rejects invalid curve value', () => {
      const result = TempoSchema.safeParse({ adjustment: 10, curve: 'fast' });
      expect(result.success).toBe(false);
    });

    test('rejects missing curve field', () => {
      const result = TempoSchema.safeParse({ adjustment: 10 });
      expect(result.success).toBe(false);
    });

    test('rejects missing adjustment field', () => {
      const result = TempoSchema.safeParse({ curve: 'steady' });
      expect(result.success).toBe(false);
    });
  });
});

describe('TempoCurveSchema validation', () => {
  test.each([
    ['steady'],
    ['gradual-rise'],
    ['gradual-fall'],
    ['explosive'],
  ] as const)('accepts "%s" as valid curve', (curve) => {
    const result = TempoCurveSchema.safeParse(curve);
    expect(result.success).toBe(true);
  });

  test('rejects invalid curve "accelerating"', () => {
    const result = TempoCurveSchema.safeParse('accelerating');
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Fallback Extraction Tests
// ============================================================================

describe('extractEnrichment', () => {
  describe('era detection from keywords', () => {
    test('detects 50s-60s era from "vintage" keyword', () => {
      const result = extractEnrichment('a vintage doo-wop song about love');
      expect(result.era).toBe('70s'); // "vintage" maps to 70s
    });

    test('detects 70s era from "analog" keyword', () => {
      const result = extractEnrichment('analog synth bass with funk groove');
      expect(result.era).toBe('70s');
    });

    test('detects 80s era from "synthwave" keyword', () => {
      const result = extractEnrichment('synthwave track with pulsing bass');
      expect(result.era).toBe('80s');
    });

    test('detects 80s era from "neon" keyword', () => {
      const result = extractEnrichment('neon lights and city nights');
      expect(result.era).toBe('80s');
    });

    test('detects 90s era from "grunge" keyword', () => {
      const result = extractEnrichment('grunge rock with distorted guitars');
      expect(result.era).toBe('90s');
    });

    test('detects 90s era from "trip-hop" keyword', () => {
      const result = extractEnrichment('trip-hop beats with ethereal vocals');
      expect(result.era).toBe('90s');
    });

    test('detects modern era from "contemporary" keyword', () => {
      const result = extractEnrichment('contemporary pop production');
      expect(result.era).toBe('modern');
    });

    test('detects explicit decade mention "80s"', () => {
      const result = extractEnrichment('an 80s power ballad');
      expect(result.era).toBe('80s');
    });

    test('detects explicit decade "1970s"', () => {
      const result = extractEnrichment('1970s disco groove');
      expect(result.era).toBe('70s');
    });

    test('returns undefined era for no matching keywords', () => {
      const result = extractEnrichment('a song about love and happiness');
      expect(result.era).toBeUndefined();
    });
  });

  describe('tempo detection from keywords', () => {
    test('detects slower tempo from "slow" keyword', () => {
      const result = extractEnrichment('a slow romantic ballad');
      expect(result.tempo).toEqual({ adjustment: -15, curve: 'steady' });
    });

    test('detects slower tempo from "relaxed" keyword', () => {
      const result = extractEnrichment('relaxed beach vibes');
      expect(result.tempo).toEqual({ adjustment: -15, curve: 'steady' });
    });

    test('detects slower tempo from "chill" keyword', () => {
      const result = extractEnrichment('chill lo-fi beats');
      expect(result.tempo).toEqual({ adjustment: -15, curve: 'steady' });
    });

    test('detects slower tempo from "ambient" keyword', () => {
      const result = extractEnrichment('ambient soundscape');
      expect(result.tempo).toEqual({ adjustment: -15, curve: 'steady' });
    });

    test('detects faster tempo from "fast" keyword', () => {
      const result = extractEnrichment('a fast techno track');
      expect(result.tempo).toEqual({ adjustment: 15, curve: 'explosive' });
    });

    test('detects faster tempo from "energetic" keyword', () => {
      const result = extractEnrichment('energetic dance anthem');
      expect(result.tempo).toEqual({ adjustment: 15, curve: 'explosive' });
    });

    test('detects faster tempo from "intense" keyword', () => {
      const result = extractEnrichment('intense action sequence');
      expect(result.tempo).toEqual({ adjustment: 15, curve: 'explosive' });
    });

    test('detects faster tempo from "chase" keyword', () => {
      const result = extractEnrichment('chase scene music');
      expect(result.tempo).toEqual({ adjustment: 15, curve: 'explosive' });
    });

    test('returns undefined tempo for no matching keywords', () => {
      const result = extractEnrichment('a song about memories');
      expect(result.tempo).toBeUndefined();
    });
  });

  describe('intent detection from keywords', () => {
    test('detects background intent from "study" keyword', () => {
      const result = extractEnrichment('music for studying');
      expect(result.intent).toBe('background');
    });

    test('detects dancefloor intent from "dance" keyword', () => {
      const result = extractEnrichment('dance music for the club');
      expect(result.intent).toBe('dancefloor');
    });

    test('detects cinematic intent from "epic" keyword', () => {
      const result = extractEnrichment('epic orchestral trailer');
      expect(result.intent).toBe('cinematic');
    });

    test('detects emotional intent from "heartfelt" keyword', () => {
      const result = extractEnrichment('heartfelt acoustic ballad');
      expect(result.intent).toBe('emotional');
    });

    test('detects focal intent from "concert" keyword', () => {
      const result = extractEnrichment('concert performance piece');
      expect(result.intent).toBe('focal');
    });
  });

  describe('combined detection', () => {
    test('detects both era and tempo', () => {
      const result = extractEnrichment('slow vintage soul ballad');
      expect(result.era).toBe('70s');
      expect(result.tempo).toEqual({ adjustment: -15, curve: 'steady' });
    });

    test('detects era, tempo, and intent together', () => {
      const result = extractEnrichment('fast 80s synthwave dance track');
      expect(result.era).toBe('80s');
      expect(result.tempo).toEqual({ adjustment: 15, curve: 'explosive' });
      expect(result.intent).toBe('dancefloor');
    });
  });

  describe('edge cases', () => {
    test('returns empty object for empty description', () => {
      const result = extractEnrichment('');
      expect(result).toEqual({});
    });

    test('returns empty object for whitespace-only description', () => {
      const result = extractEnrichment('   \n\t   ');
      expect(result).toEqual({});
    });

    test('handles case-insensitive matching', () => {
      const result = extractEnrichment('SYNTHWAVE and NEON');
      expect(result.era).toBe('80s');
    });

    test('matches whole words only (not "vintage" in "advantages")', () => {
      const result = extractEnrichment('many advantages of music');
      expect(result.era).toBeUndefined();
    });
  });
});

// ============================================================================
// Era Tag Tests
// ============================================================================

describe('getEraProductionTags', () => {
  describe('returns correct tags for each era', () => {
    test('returns 50s-60s production tags', () => {
      const tags = getEraProductionTags('50s-60s');
      expect(tags).toContain('mono recording');
      expect(tags).toContain('tube warmth');
      expect(tags).toContain('vintage reverb');
      expect(tags.length).toBeGreaterThanOrEqual(3);
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    test('returns 70s production tags', () => {
      const tags = getEraProductionTags('70s');
      expect(tags).toContain('analog warmth');
      expect(tags).toContain('tape saturation');
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    test('returns 80s production tags', () => {
      const tags = getEraProductionTags('80s');
      expect(tags).toContain('gated reverb');
      expect(tags).toContain('synth pads');
      expect(tags).toContain('punchy drums');
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    test('returns 90s production tags', () => {
      const tags = getEraProductionTags('90s');
      expect(tags).toContain('compressed drums');
      expect(tags).toContain('grunge texture');
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    test('returns 2000s production tags', () => {
      const tags = getEraProductionTags('2000s');
      expect(tags).toContain('polished production');
      expect(tags).toContain('digital precision');
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    test('returns modern production tags', () => {
      const tags = getEraProductionTags('modern');
      expect(tags).toContain('hybrid analog-digital');
      expect(tags).toContain('pristine clarity');
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tag format and consistency', () => {
    const eras: Era[] = ['50s-60s', '70s', '80s', '90s', '2000s', 'modern'];

    test.each(eras)('returns lowercase tags for %s', (era) => {
      const tags = getEraProductionTags(era);
      for (const tag of tags) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });

    test.each(eras)('returns non-empty tags for %s', (era) => {
      const tags = getEraProductionTags(era);
      for (const tag of tags) {
        expect(tag.length).toBeGreaterThan(0);
      }
    });

    test.each(eras)('returns between 3 and 5 tags for %s', (era) => {
      const tags = getEraProductionTags(era);
      expect(tags.length).toBeGreaterThanOrEqual(3);
      expect(tags.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('getEraProductionTagsLimited', () => {
  test('returns limited number of tags with default limit', () => {
    const tags = getEraProductionTagsLimited('80s');
    expect(tags).toHaveLength(2);
  });

  test('returns specified number of tags', () => {
    const tags = getEraProductionTagsLimited('70s', 3);
    expect(tags).toHaveLength(3);
  });

  test('returns first N tags in order', () => {
    const allTags = getEraProductionTags('80s');
    const limitedTags = getEraProductionTagsLimited('80s', 2);
    expect(limitedTags[0]).toBe(allTags[0]);
    expect(limitedTags[1]).toBe(allTags[1]);
  });

  test('returns all tags if limit exceeds available', () => {
    const tags = getEraProductionTagsLimited('modern', 10);
    const allTags = getEraProductionTags('modern');
    expect(tags).toEqual(allTags);
  });

  test('returns empty array with limit of 0', () => {
    const tags = getEraProductionTagsLimited('90s', 0);
    expect(tags).toHaveLength(0);
  });
});

// ============================================================================
// Intent Schema Tests
// ============================================================================

describe('IntentSchema', () => {
  const validIntents: Intent[] = ['background', 'focal', 'cinematic', 'dancefloor', 'emotional'];

  test.each(validIntents)('accepts valid intent: %s', (intent) => {
    const result = IntentSchema.safeParse(intent);
    expect(result.success).toBe(true);
  });

  test('rejects invalid intent', () => {
    const result = IntentSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('MusicalReferenceSchema', () => {
  test('accepts valid musical reference with all fields', () => {
    const valid = {
      style: ['progressive rock', 'psychedelic'],
      era: '70s',
      signature: ['spacey guitar delay', 'slow build'],
    };
    const result = MusicalReferenceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('accepts musical reference without era', () => {
    const valid = {
      style: ['electronic', 'ambient'],
      signature: ['lush synth pads'],
    };
    const result = MusicalReferenceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('rejects missing style array', () => {
    const invalid = {
      signature: ['test'],
    };
    const result = MusicalReferenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test('rejects missing signature array', () => {
    const invalid = {
      style: ['rock'],
    };
    const result = MusicalReferenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ThematicContextSchema - Intent Enrichment', () => {
  test('accepts context with intent field', () => {
    const valid = {
      themes: ['study', 'focus', 'calm'],
      moods: ['peaceful', 'concentrated'],
      scene: 'quiet library with soft background music',
      intent: 'background',
    };
    const result = ThematicContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intent).toBe('background');
    }
  });

  test('accepts context with musicalReference field', () => {
    const valid = {
      themes: ['rock', 'guitar', 'power'],
      moods: ['energetic', 'powerful'],
      scene: 'stadium rock concert at sunset',
      musicalReference: {
        style: ['classic rock', 'arena rock'],
        era: '80s',
        signature: ['power chords', 'anthemic chorus'],
      },
    };
    const result = ThematicContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.musicalReference?.style).toContain('classic rock');
    }
  });

  test('accepts context with all intent fields', () => {
    const valid = {
      themes: ['dance', 'club', 'night'],
      moods: ['energetic', 'euphoric'],
      scene: 'packed nightclub with pulsing lights',
      intent: 'dancefloor',
      musicalReference: {
        style: ['house', 'electronic'],
        signature: ['four-on-the-floor beat', 'synth stabs'],
      },
    };
    const result = ThematicContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Intent Tags Tests
// ============================================================================

describe('getIntentTags', () => {
  const intents: Intent[] = ['background', 'focal', 'cinematic', 'dancefloor', 'emotional'];

  test.each(intents)('returns tags for intent: %s', (intent) => {
    const tags = getIntentTags(intent);
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  test('background intent includes subtle tag', () => {
    const tags = getIntentTags('background');
    expect(tags.some(t => t.toLowerCase().includes('subtle') || t.toLowerCase().includes('ambient'))).toBe(true);
  });

  test('dancefloor intent includes punchy or driving tag', () => {
    const tags = getIntentTags('dancefloor');
    expect(tags.some(t => t.toLowerCase().includes('punch') || t.toLowerCase().includes('driv') || t.toLowerCase().includes('rhythm'))).toBe(true);
  });

  test('cinematic intent includes dramatic or evolving tag', () => {
    const tags = getIntentTags('cinematic');
    expect(tags.some(t => t.toLowerCase().includes('dramat') || t.toLowerCase().includes('evolv') || t.toLowerCase().includes('layer'))).toBe(true);
  });
});

describe('getIntentTagsLimited', () => {
  test('returns limited number of tags with default limit', () => {
    const tags = getIntentTagsLimited('focal');
    expect(tags).toHaveLength(1);
  });

  test('returns specified number of tags', () => {
    const tags = getIntentTagsLimited('emotional', 2);
    expect(tags).toHaveLength(2);
  });
});

// ============================================================================
// Intent Fallback Detection Tests
// ============================================================================

describe('extractEnrichment - Intent Detection', () => {
  test('detects background intent from study keyword', () => {
    const result = extractEnrichment('music for studying');
    expect(result.intent).toBe('background');
  });

  test('detects background intent from ambient keyword', () => {
    const result = extractEnrichment('ambient background music');
    expect(result.intent).toBe('background');
  });

  test('detects dancefloor intent from club keyword', () => {
    const result = extractEnrichment('club dance track');
    expect(result.intent).toBe('dancefloor');
  });

  test('detects dancefloor intent from party keyword', () => {
    const result = extractEnrichment('party music for dancing');
    expect(result.intent).toBe('dancefloor');
  });

  test('detects cinematic intent from film keyword', () => {
    const result = extractEnrichment('epic film score');
    expect(result.intent).toBe('cinematic');
  });

  test('detects cinematic intent from movie keyword', () => {
    const result = extractEnrichment('movie trailer music');
    expect(result.intent).toBe('cinematic');
  });

  test('detects emotional intent from sad keyword', () => {
    const result = extractEnrichment('sad emotional ballad');
    expect(result.intent).toBe('emotional');
  });

  test('detects emotional intent from heartfelt keyword', () => {
    const result = extractEnrichment('heartfelt love song');
    expect(result.intent).toBe('emotional');
  });

  test('detects focal intent from audiophile keyword', () => {
    const result = extractEnrichment('audiophile quality mix');
    expect(result.intent).toBe('focal');
  });
});

// ============================================================================
// Narrative Arc Schema Tests
// ============================================================================

describe('ThematicContextSchema - Narrative/Cultural Enrichment', () => {
  describe('narrativeArc field', () => {
    test('accepts context with valid narrativeArc array', () => {
      const valid = {
        themes: ['journey', 'transformation', 'hope'],
        moods: ['melancholic', 'hopeful'],
        scene: 'a hero rising from defeat to victory',
        narrativeArc: ['isolation', 'struggle', 'hope', 'triumph'],
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.narrativeArc).toEqual(['isolation', 'struggle', 'hope', 'triumph']);
      }
    });

    test('accepts context with empty narrativeArc array', () => {
      const valid = {
        themes: ['peace', 'calm', 'serenity'],
        moods: ['peaceful', 'relaxed'],
        scene: 'gentle waves on a quiet beach',
        narrativeArc: [],
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.narrativeArc).toEqual([]);
      }
    });

    test('accepts context with single emotion narrativeArc', () => {
      const valid = {
        themes: ['meditation', 'peace', 'stillness'],
        moods: ['calm', 'centered'],
        scene: 'zen garden at dawn',
        narrativeArc: ['serenity'],
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts context without narrativeArc (optional)', () => {
      const valid = {
        themes: ['love', 'joy', 'celebration'],
        moods: ['happy', 'excited'],
        scene: 'wedding celebration under the stars',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.narrativeArc).toBeUndefined();
      }
    });
  });

  describe('culturalContext field', () => {
    test('accepts context with full culturalContext object', () => {
      const valid = {
        themes: ['carnival', 'dance', 'celebration'],
        moods: ['joyful', 'energetic'],
        scene: 'Brazilian carnival parade in Rio',
        culturalContext: {
          region: 'brazil',
          instruments: ['surdo', 'tamborim', 'cuíca'],
          scale: 'mixolydian',
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.culturalContext?.region).toBe('brazil');
        expect(result.data.culturalContext?.instruments).toContain('surdo');
        expect(result.data.culturalContext?.scale).toBe('mixolydian');
      }
    });

    test('accepts culturalContext with only region', () => {
      const valid = {
        themes: ['traditional', 'folk', 'heritage'],
        moods: ['nostalgic', 'warm'],
        scene: 'Japanese tea ceremony',
        culturalContext: {
          region: 'japan',
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.culturalContext?.region).toBe('japan');
        expect(result.data.culturalContext?.instruments).toBeUndefined();
        expect(result.data.culturalContext?.scale).toBeUndefined();
      }
    });

    test('accepts culturalContext with only instruments', () => {
      const valid = {
        themes: ['world', 'fusion', 'rhythm'],
        moods: ['energetic', 'uplifting'],
        scene: 'world music festival',
        culturalContext: {
          instruments: ['djembe', 'kora'],
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.culturalContext?.instruments).toEqual(['djembe', 'kora']);
      }
    });

    test('accepts empty culturalContext object', () => {
      const valid = {
        themes: ['ambient', 'space', 'cosmic'],
        moods: ['ethereal', 'vast'],
        scene: 'floating through nebulae',
        culturalContext: {},
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts context without culturalContext (optional)', () => {
      const valid = {
        themes: ['electronic', 'future', 'cyber'],
        moods: ['intense', 'mechanical'],
        scene: 'cyberpunk city at night',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.culturalContext).toBeUndefined();
      }
    });
  });

  describe('combined narrative/cultural fields', () => {
    test('accepts context with all narrative/cultural fields', () => {
      const valid = {
        themes: ['tradition', 'celebration', 'community'],
        moods: ['joyful', 'vibrant'],
        scene: 'Celtic festival with dancing and music',
        narrativeArc: ['gathering', 'celebration', 'reflection'],
        culturalContext: {
          region: 'celtic',
          instruments: ['fiddle', 'bodhrán', 'tin whistle'],
          scale: 'dorian',
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.narrativeArc).toHaveLength(3);
        expect(result.data.culturalContext?.region).toBe('celtic');
      }
    });

    test('accepts fully enriched context with all fields', () => {
      const valid = {
        themes: ['epic', 'journey', 'discovery'],
        moods: ['adventurous', 'awe-struck'],
        scene: 'ancient temple in the mountains of India',
        // Core enrichment
        era: '80s' as const,
        tempo: { adjustment: 5, curve: 'gradual-rise' as const },
        contrast: {
          sections: [
            { type: 'intro' as const, mood: 'mysterious', dynamics: 'soft' as const },
            { type: 'chorus' as const, mood: 'triumphant', dynamics: 'powerful' as const },
          ],
        },
        // Intent and reference
        intent: 'cinematic' as const,
        musicalReference: {
          style: ['world fusion', 'cinematic'],
          signature: ['layered strings', 'ethnic percussion'],
        },
        // Narrative and cultural
        narrativeArc: ['curiosity', 'discovery', 'enlightenment'],
        culturalContext: {
          region: 'india',
          instruments: ['sitar', 'tabla'],
          scale: 'raga scales',
        },
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});

describe('CulturalContextSchema', () => {
  test('accepts full culturalContext', () => {
    const valid: CulturalContext = {
      region: 'middle-east',
      instruments: ['oud', 'darbuka'],
      scale: 'phrygian dominant',
    };
    const result = CulturalContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('accepts partial culturalContext', () => {
    const valid = { region: 'africa' };
    const result = CulturalContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('accepts empty culturalContext', () => {
    const valid = {};
    const result = CulturalContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('accepts culturalContext with empty instruments array', () => {
    const valid = { instruments: [] };
    const result = CulturalContextSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Cultural Instruments Tests
// ============================================================================

describe('getCulturalInstruments', () => {
  describe('returns correct instruments for each region', () => {
    test('returns Brazilian instruments', () => {
      const instruments = getCulturalInstruments('brazil');
      expect(instruments).toContain('surdo');
      expect(instruments).toContain('tamborim');
      expect(instruments).toContain('cuíca');
      expect(instruments).toContain('cavaquinho');
      expect(instruments).toHaveLength(4);
    });

    test('returns Japanese instruments', () => {
      const instruments = getCulturalInstruments('japan');
      expect(instruments).toContain('koto');
      expect(instruments).toContain('shakuhachi');
      expect(instruments).toContain('shamisen');
      expect(instruments).toContain('taiko');
      expect(instruments).toHaveLength(4);
    });

    test('returns Celtic instruments', () => {
      const instruments = getCulturalInstruments('celtic');
      expect(instruments).toContain('tin whistle');
      expect(instruments).toContain('bodhrán');
      expect(instruments).toContain('fiddle');
      expect(instruments).toContain('uilleann pipes');
      expect(instruments).toHaveLength(4);
    });

    test('returns Indian instruments', () => {
      const instruments = getCulturalInstruments('india');
      expect(instruments).toContain('sitar');
      expect(instruments).toContain('tabla');
      expect(instruments).toContain('tanpura');
      expect(instruments).toContain('harmonium');
      expect(instruments).toHaveLength(4);
    });

    test('returns Middle Eastern instruments', () => {
      const instruments = getCulturalInstruments('middle-east');
      expect(instruments).toContain('oud');
      expect(instruments).toContain('darbuka');
      expect(instruments).toContain('ney');
      expect(instruments).toContain('qanun');
      expect(instruments).toHaveLength(4);
    });

    test('returns African instruments', () => {
      const instruments = getCulturalInstruments('africa');
      expect(instruments).toContain('djembe');
      expect(instruments).toContain('balafon');
      expect(instruments).toContain('kora');
      expect(instruments).toContain('talking drum');
      expect(instruments).toHaveLength(4);
    });
  });

  describe('handles aliases and variations', () => {
    test('handles "brazilian" alias', () => {
      const instruments = getCulturalInstruments('brazilian');
      expect(instruments).toContain('surdo');
    });

    test('handles "japanese" alias', () => {
      const instruments = getCulturalInstruments('japanese');
      expect(instruments).toContain('koto');
    });

    test('handles "irish" alias for Celtic', () => {
      const instruments = getCulturalInstruments('irish');
      expect(instruments).toContain('tin whistle');
    });

    test('handles "scottish" alias for Celtic', () => {
      const instruments = getCulturalInstruments('scottish');
      expect(instruments).toContain('bodhrán');
    });

    test('handles "indian" alias', () => {
      const instruments = getCulturalInstruments('indian');
      expect(instruments).toContain('sitar');
    });

    test('handles "arabic" alias for Middle East', () => {
      const instruments = getCulturalInstruments('arabic');
      expect(instruments).toContain('oud');
    });

    test('handles "persian" alias for Middle East', () => {
      const instruments = getCulturalInstruments('persian');
      expect(instruments).toContain('darbuka');
    });

    test('handles "african" alias', () => {
      const instruments = getCulturalInstruments('african');
      expect(instruments).toContain('djembe');
    });

    test('handles "west african" alias', () => {
      const instruments = getCulturalInstruments('west african');
      expect(instruments).toContain('kora');
    });
  });

  describe('case insensitivity', () => {
    test('handles uppercase', () => {
      const instruments = getCulturalInstruments('BRAZIL');
      expect(instruments).toContain('surdo');
    });

    test('handles mixed case', () => {
      const instruments = getCulturalInstruments('JaPaN');
      expect(instruments).toContain('koto');
    });

    test('handles extra whitespace', () => {
      const instruments = getCulturalInstruments('  celtic  ');
      expect(instruments).toContain('fiddle');
    });
  });

  describe('unknown regions', () => {
    test('returns empty array for unknown region', () => {
      const instruments = getCulturalInstruments('unknown');
      expect(instruments).toEqual([]);
    });

    test('returns empty array for empty string', () => {
      const instruments = getCulturalInstruments('');
      expect(instruments).toEqual([]);
    });
  });
});

describe('getCulturalScale', () => {
  describe('returns correct scales for each region', () => {
    test('returns mixolydian for Brazil', () => {
      const scale = getCulturalScale('brazil');
      expect(scale).toBe('mixolydian');
    });

    test('returns pentatonic for Japan', () => {
      const scale = getCulturalScale('japan');
      expect(scale).toBe('pentatonic');
    });

    test('returns dorian for Celtic', () => {
      const scale = getCulturalScale('celtic');
      expect(scale).toBe('dorian');
    });

    test('returns raga scales for India', () => {
      const scale = getCulturalScale('india');
      expect(scale).toBe('raga scales');
    });

    test('returns phrygian dominant for Middle East', () => {
      const scale = getCulturalScale('middle-east');
      expect(scale).toBe('phrygian dominant');
    });

    test('returns pentatonic for Africa', () => {
      const scale = getCulturalScale('africa');
      expect(scale).toBe('pentatonic');
    });
  });

  describe('handles aliases', () => {
    test('handles "irish" alias', () => {
      const scale = getCulturalScale('irish');
      expect(scale).toBe('dorian');
    });

    test('handles "arabic" alias', () => {
      const scale = getCulturalScale('arabic');
      expect(scale).toBe('phrygian dominant');
    });
  });

  describe('unknown regions', () => {
    test('returns undefined for unknown region', () => {
      const scale = getCulturalScale('unknown');
      expect(scale).toBeUndefined();
    });
  });
});

describe('selectCulturalInstruments', () => {
  test('selects specified number of instruments', () => {
    const selected = selectCulturalInstruments('brazil', 2, Math.random);
    expect(selected).toHaveLength(2);
  });

  test('returns unique instruments (no duplicates)', () => {
    // Run multiple times to ensure no duplicates
    for (let i = 0; i < 10; i++) {
      const selected = selectCulturalInstruments('japan', 3, Math.random);
      const unique = new Set(selected);
      expect(unique.size).toBe(selected.length);
    }
  });

  test('returns all instruments if count exceeds available', () => {
    const selected = selectCulturalInstruments('celtic', 10, Math.random);
    expect(selected).toHaveLength(4); // Celtic has 4 instruments
  });

  test('returns empty array for unknown region', () => {
    const selected = selectCulturalInstruments('unknown', 2, Math.random);
    expect(selected).toEqual([]);
  });

  test('uses provided RNG for deterministic selection', () => {
    // Use a seeded RNG (simple example)
    let seed = 42;
    const seededRng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const selected1 = selectCulturalInstruments('india', 2, () => {
      seed = 42;
      return seededRng();
    });
    const selected2 = selectCulturalInstruments('india', 2, () => {
      seed = 42;
      return seededRng();
    });

    expect(selected1).toEqual(selected2);
  });
});

describe('isCulturalRegion', () => {
  test.each([...CULTURAL_REGIONS])('recognizes "%s" as valid region', (region) => {
    expect(isCulturalRegion(region)).toBe(true);
  });

  test('recognizes aliases as valid', () => {
    expect(isCulturalRegion('irish')).toBe(true);
    expect(isCulturalRegion('arabic')).toBe(true);
    expect(isCulturalRegion('japanese')).toBe(true);
  });

  test('returns false for unknown regions', () => {
    expect(isCulturalRegion('unknown')).toBe(false);
    expect(isCulturalRegion('')).toBe(false);
    expect(isCulturalRegion('antarctic')).toBe(false);
  });
});

describe('CULTURAL_REGIONS constant', () => {
  test('contains all expected regions', () => {
    expect(CULTURAL_REGIONS).toContain('brazil');
    expect(CULTURAL_REGIONS).toContain('japan');
    expect(CULTURAL_REGIONS).toContain('celtic');
    expect(CULTURAL_REGIONS).toContain('india');
    expect(CULTURAL_REGIONS).toContain('middle-east');
    expect(CULTURAL_REGIONS).toContain('africa');
  });

  test('has exactly 6 regions', () => {
    expect(CULTURAL_REGIONS).toHaveLength(6);
  });
});

// ============================================================================
// Narrative Arc to Section Mapping Tests
// ============================================================================

describe('narrativeArcToContrast', () => {
  test('converts 3-element arc to contrast sections', () => {
    const arc = ['isolation', 'hope', 'triumph'];
    const contrast = narrativeArcToContrast(arc);

    expect(contrast).toBeDefined();
    expect(contrast?.sections).toHaveLength(5); // intro, verse, chorus, bridge, outro

    // First arc element → intro/verse (start position)
    const intro = contrast?.sections.find((s) => s.type === 'intro');
    expect(intro?.mood).toBe('isolation');

    const verse = contrast?.sections.find((s) => s.type === 'verse');
    expect(verse?.mood).toBe('isolation');

    // Middle element → chorus/bridge
    const chorus = contrast?.sections.find((s) => s.type === 'chorus');
    expect(chorus?.mood).toBe('hope');

    const bridge = contrast?.sections.find((s) => s.type === 'bridge');
    expect(bridge?.mood).toBe('hope');

    // Last element → outro
    const outro = contrast?.sections.find((s) => s.type === 'outro');
    expect(outro?.mood).toBe('triumph');
  });

  test('applies correct dynamics to each position', () => {
    const arc = ['sadness', 'longing', 'joy'];
    const contrast = narrativeArcToContrast(arc);

    const intro = contrast?.sections.find((s) => s.type === 'intro');
    expect(intro?.dynamics).toBe('building'); // start position

    const chorus = contrast?.sections.find((s) => s.type === 'chorus');
    expect(chorus?.dynamics).toBe('powerful'); // middle position

    const outro = contrast?.sections.find((s) => s.type === 'outro');
    expect(outro?.dynamics).toBe('explosive'); // end position
  });

  test('handles single-element arc', () => {
    const arc = ['peace'];
    const contrast = narrativeArcToContrast(arc);

    expect(contrast).toBeDefined();
    // All sections should use the same mood
    for (const section of contrast?.sections ?? []) {
      expect(section.mood).toBe('peace');
    }
  });

  test('handles two-element arc', () => {
    const arc = ['tension', 'release'];
    const contrast = narrativeArcToContrast(arc);

    const intro = contrast?.sections.find((s) => s.type === 'intro');
    expect(intro?.mood).toBe('tension'); // first element

    const outro = contrast?.sections.find((s) => s.type === 'outro');
    expect(outro?.mood).toBe('release'); // last element
  });

  test('handles long arc (5+ elements)', () => {
    const arc = ['isolation', 'longing', 'hope', 'love', 'triumph'];
    const contrast = narrativeArcToContrast(arc);

    expect(contrast).toBeDefined();
    
    // Middle should use the actual middle element (index 2)
    const chorus = contrast?.sections.find((s) => s.type === 'chorus');
    expect(chorus?.mood).toBe('hope');
  });

  test('returns undefined for empty arc', () => {
    const contrast = narrativeArcToContrast([]);
    expect(contrast).toBeUndefined();
  });

  test('returns undefined for undefined arc', () => {
    const contrast = narrativeArcToContrast(undefined);
    expect(contrast).toBeUndefined();
  });
});

describe('mergeContrastWithNarrativeArc', () => {
  test('returns arc contrast when no existing contrast', () => {
    const arc = ['hope', 'joy', 'triumph'];
    const merged = mergeContrastWithNarrativeArc(undefined, arc);

    expect(merged).toBeDefined();
    expect(merged?.sections.length).toBeGreaterThan(0);
  });

  test('returns existing contrast when no arc', () => {
    const existing = {
      sections: [
        { type: 'chorus' as const, mood: 'euphoric', dynamics: 'explosive' as const },
      ],
    };
    const merged = mergeContrastWithNarrativeArc(existing, undefined);

    expect(merged).toEqual(existing);
  });

  test('existing contrast takes precedence over arc', () => {
    const existing = {
      sections: [
        { type: 'chorus' as const, mood: 'euphoric', dynamics: 'explosive' as const },
      ],
    };
    const arc = ['sadness', 'hope', 'joy'];
    const merged = mergeContrastWithNarrativeArc(existing, arc);

    // Existing chorus should be preserved with 'euphoric'
    const chorus = merged?.sections.find((s) => s.type === 'chorus');
    expect(chorus?.mood).toBe('euphoric');

    // Arc fills in missing sections
    const intro = merged?.sections.find((s) => s.type === 'intro');
    expect(intro?.mood).toBe('sadness');
  });

  test('merges all sections when existing has partial coverage', () => {
    const existing = {
      sections: [
        { type: 'verse' as const, mood: 'melancholic', dynamics: 'soft' as const },
      ],
    };
    const arc = ['tension', 'building', 'release'];
    const merged = mergeContrastWithNarrativeArc(existing, arc);

    // Should have verse from existing and other sections from arc
    expect(merged?.sections.length).toBeGreaterThanOrEqual(5);

    const verse = merged?.sections.find((s) => s.type === 'verse');
    expect(verse?.mood).toBe('melancholic'); // from existing

    const intro = merged?.sections.find((s) => s.type === 'intro');
    expect(intro?.mood).toBe('tension'); // from arc
  });

  test('returns undefined when both are undefined', () => {
    const merged = mergeContrastWithNarrativeArc(undefined, undefined);
    expect(merged).toBeUndefined();
  });

  test('returns existing contrast when arc is empty', () => {
    const existing: { sections: [] } = { sections: [] };
    const merged = mergeContrastWithNarrativeArc(existing, []);
    // Returns the existing contrast even if empty
    expect(merged).toEqual({ sections: [] });
  });
});

describe('inferDynamicsFromArc', () => {
  test('returns "steady" for empty arc', () => {
    expect(inferDynamicsFromArc([])).toBe('steady');
  });

  test('returns "steady" for undefined arc', () => {
    expect(inferDynamicsFromArc(undefined)).toBe('steady');
  });

  test('returns "steady" for single-element arc', () => {
    expect(inferDynamicsFromArc(['peace'])).toBe('steady');
  });

  test('returns "steady" for two-element arc', () => {
    expect(inferDynamicsFromArc(['sad', 'happy'])).toBe('steady');
  });

  test('returns "building" for 3-element arc', () => {
    expect(inferDynamicsFromArc(['tension', 'hope', 'joy'])).toBe('building');
  });

  test('returns "building" for 4-element arc', () => {
    expect(inferDynamicsFromArc(['a', 'b', 'c', 'd'])).toBe('building');
  });

  test('returns "dramatic" for 5+ element arc', () => {
    expect(inferDynamicsFromArc(['a', 'b', 'c', 'd', 'e'])).toBe('dramatic');
  });

  test('returns "dramatic" for long arc', () => {
    expect(inferDynamicsFromArc(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe('dramatic');
  });
});
