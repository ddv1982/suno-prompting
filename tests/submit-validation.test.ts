import { describe, expect, test } from 'bun:test';

import {
  FullPromptSubmitSchema,
  FullPromptRefineSchema,
  QuickVibesSubmitSchema,
  QuickVibesRefineSchema,
  CreativeBoostSubmitSchema,
} from '@shared/schemas/submit-validation';

// Helper functions that wrap the schemas for backward-compatible test syntax
const canSubmitFullPrompt = (
  input: Parameters<typeof FullPromptSubmitSchema.safeParse>[0]
): boolean => FullPromptSubmitSchema.safeParse(input).success;

const canRefineFullPrompt = (
  input: Parameters<typeof FullPromptRefineSchema.safeParse>[0]
): boolean => FullPromptRefineSchema.safeParse(input).success;

const canSubmitQuickVibes = (
  input: Parameters<typeof QuickVibesSubmitSchema.safeParse>[0]
): boolean => QuickVibesSubmitSchema.safeParse(input).success;

const canRefineQuickVibes = (
  input: Parameters<typeof QuickVibesRefineSchema.safeParse>[0]
): boolean => QuickVibesRefineSchema.safeParse(input).success;

const canSubmitCreativeBoost = (
  input: Parameters<typeof CreativeBoostSubmitSchema.safeParse>[0]
): boolean => CreativeBoostSubmitSchema.safeParse(input).success;

describe('canSubmitFullPrompt', () => {
  test('returns false when no input provided', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(false);
  });

  test('returns true with description only', () => {
    expect(
      canSubmitFullPrompt({
        description: 'A jazz song',
        lyricsTopic: '',
        lyricsMode: false,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns true with advanced selection only', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        hasAdvancedSelection: true,
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns true with advanced selection in lyrics mode (no topic required)', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: '',
        lyricsMode: true,
        hasAdvancedSelection: true,
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns true with lyrics topic only in lyrics mode', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: 'Love and heartbreak',
        lyricsMode: true,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns false with lyrics topic when not in lyrics mode', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: 'Love and heartbreak',
        lyricsMode: false,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(false);
  });

  test('trims whitespace from description', () => {
    expect(
      canSubmitFullPrompt({
        description: '   ',
        lyricsTopic: '',
        lyricsMode: false,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(false);
  });

  test('trims whitespace from lyrics topic', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: '   ',
        lyricsMode: true,
        hasAdvancedSelection: false,
        sunoStyles: [],
      })
    ).toBe(false);
  });

  test('returns true with suno styles only', () => {
    expect(
      canSubmitFullPrompt({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        hasAdvancedSelection: false,
        sunoStyles: ['dream-pop'],
      })
    ).toBe(true);
  });
});

describe('canSubmitQuickVibes', () => {
  test('returns false when no input provided', () => {
    expect(
      canSubmitQuickVibes({
        category: null,
        customDescription: '',
        sunoStyles: [],
      })
    ).toBe(false);
  });

  test('returns true with category only', () => {
    expect(
      canSubmitQuickVibes({
        category: 'chill',
        customDescription: '',
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns true with description only', () => {
    expect(
      canSubmitQuickVibes({
        category: null,
        customDescription: 'Relaxing ambient',
        sunoStyles: [],
      })
    ).toBe(true);
  });

  test('returns true with suno styles only', () => {
    expect(
      canSubmitQuickVibes({
        category: null,
        customDescription: '',
        sunoStyles: ['Lo-fi Hip Hop'],
      })
    ).toBe(true);
  });

  test('trims whitespace from description', () => {
    expect(
      canSubmitQuickVibes({
        category: null,
        customDescription: '   ',
        sunoStyles: [],
      })
    ).toBe(false);
  });
});

describe('canRefineQuickVibes', () => {
  const original = {
    category: 'lofi-study' as const,
    customDescription: '',
    sunoStyles: [] as string[],
  };

  test('returns false when nothing changed', () => {
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: '',
        sunoStyles: [],
        original,
      })
    ).toBe(false);
  });

  test('returns true when category changed', () => {
    expect(
      canRefineQuickVibes({
        category: 'cafe-coffeeshop',
        customDescription: '',
        sunoStyles: [],
        original,
      })
    ).toBe(true);
  });

  test('returns true when category changed to null', () => {
    expect(
      canRefineQuickVibes({
        category: null,
        customDescription: '',
        sunoStyles: [],
        original,
      })
    ).toBe(true);
  });

  test('returns true when description added', () => {
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: 'more upbeat',
        sunoStyles: [],
        original,
      })
    ).toBe(true);
  });

  test('returns true when suno styles added', () => {
    expect(
      canRefineQuickVibes({
        category: null,
        customDescription: '',
        sunoStyles: ['Jazz'],
        original,
      })
    ).toBe(true);
  });

  test('returns true when suno styles changed', () => {
    const originalWithStyles = { ...original, sunoStyles: ['Jazz'] };
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: '',
        sunoStyles: ['Rock'],
        original: originalWithStyles,
      })
    ).toBe(true);
  });

  test('returns true when suno styles order changed', () => {
    const originalWithStyles = { ...original, sunoStyles: ['Jazz', 'Rock'] };
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: '',
        sunoStyles: ['Rock', 'Jazz'],
        original: originalWithStyles,
      })
    ).toBe(true);
  });

  test('returns false when only whitespace added to description', () => {
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: '   ',
        sunoStyles: [],
        original,
      })
    ).toBe(false);
  });

  test('falls back to canSubmitQuickVibes when no original', () => {
    expect(
      canRefineQuickVibes({
        category: 'lofi-study',
        customDescription: '',
        sunoStyles: [],
        original: null,
      })
    ).toBe(true);

    expect(
      canRefineQuickVibes({
        category: null,
        customDescription: '',
        sunoStyles: [],
        original: null,
      })
    ).toBe(false);
  });
});

describe('canSubmitCreativeBoost', () => {
  test('returns false when no input provided', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(false);
  });

  test('returns true with description only', () => {
    expect(
      canSubmitCreativeBoost({
        description: 'Upbeat electronic',
        lyricsTopic: '',
        lyricsMode: false,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(true);
  });

  test('returns true with lyrics topic in lyrics mode', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: 'Summer adventures',
        lyricsMode: true,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(true);
  });

  test('returns false with lyrics topic when not in lyrics mode', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: 'Summer adventures',
        lyricsMode: false,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(false);
  });

  test('returns true with suno styles only', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        sunoStyles: ['Indie Rock'],
        seedGenres: [],
      })
    ).toBe(true);
  });

  test('returns true with seed genres only', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: '',
        lyricsMode: false,
        sunoStyles: [],
        seedGenres: ['jazz'],
      })
    ).toBe(true);
  });

  test('trims whitespace from description', () => {
    expect(
      canSubmitCreativeBoost({
        description: '   ',
        lyricsTopic: '',
        lyricsMode: false,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(false);
  });

  test('trims whitespace from lyrics topic', () => {
    expect(
      canSubmitCreativeBoost({
        description: '',
        lyricsTopic: '   ',
        lyricsMode: true,
        sunoStyles: [],
        seedGenres: [],
      })
    ).toBe(false);
  });
});

// ============================================
// canRefineFullPrompt Tests (Task 6.3)
// ============================================

describe('canRefineFullPrompt', () => {
  describe('no refinement possible', () => {
    test('returns false when no feedback and no style changes', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(false);
    });

    test('returns false when no feedback and no style changes (lyrics mode OFF)', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: undefined,
          lyricsMode: false,
        })
      ).toBe(false);
    });

    test('handles whitespace-only feedback as empty', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '   ',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(false);
    });

    test('handles tabs and newlines as empty feedback', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '\t\n  \r\n',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(false);
    });
  });

  describe('style-only refinement', () => {
    test('returns true when style changes present (even empty feedback)', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: { seedGenres: ['rock'] },
          lyricsMode: true,
        })
      ).toBe(true);
    });

    test('returns true when style changes have multiple fields', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: {
            seedGenres: ['jazz', 'blues'],
            sunoStyles: ['smooth-jazz'],
          },
          lyricsMode: true,
        })
      ).toBe(true);
    });

    test('returns true with style changes in lyrics mode OFF', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: { sunoStyles: ['dream-pop'] },
          lyricsMode: false,
        })
      ).toBe(true);
    });

    test('returns true with empty arrays in styleChanges (still a defined object)', () => {
      // An object with empty arrays is still a defined styleChanges object
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: { seedGenres: [] },
          lyricsMode: true,
        })
      ).toBe(true);
    });
  });

  describe('feedback-only refinement', () => {
    test('returns true when feedback text present (even no style changes)', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'make it more emotional',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(true);
    });

    test('returns true when feedback present in lyrics mode OFF', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'add more bass',
          styleChanges: undefined,
          lyricsMode: false,
        })
      ).toBe(true);
    });

    test('returns true with short feedback text', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'x',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(true);
    });

    test('returns true with long feedback text', () => {
      expect(
        canRefineFullPrompt({
          feedbackText:
            'Make the lyrics more poetic and add metaphors about the ocean and waves crashing on the shore. The chorus should be more memorable and catchy.',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(true);
    });
  });

  describe('combined refinement (both present)', () => {
    test('returns true when both feedback and style changes present', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'make it more emotional',
          styleChanges: { seedGenres: ['rock'] },
          lyricsMode: true,
        })
      ).toBe(true);
    });

    test('returns true with both present in lyrics mode OFF', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'more bass',
          styleChanges: { sunoStyles: ['grunge', 'rock'] },
          lyricsMode: false,
        })
      ).toBe(true);
    });

    test('returns true with full styleChanges object', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: 'darker mood',
          styleChanges: {
            seedGenres: ['metal'],
            sunoStyles: ['death-metal'],
            bpm: 180,
            instruments: ['electric-guitar', 'bass', 'drums'],
            mood: ['dark', 'aggressive'],
          },
          lyricsMode: true,
        })
      ).toBe(true);
    });
  });

  describe('handles undefined vs empty styleChanges correctly', () => {
    test('undefined styleChanges with no feedback returns false', () => {
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: undefined,
          lyricsMode: true,
        })
      ).toBe(false);
    });

    test('defined styleChanges (even empty object) returns true', () => {
      // Note: An empty object {} is truthy, so this should return true
      // However, the actual implementation checks for undefined specifically
      expect(
        canRefineFullPrompt({
          feedbackText: '',
          styleChanges: {},
          lyricsMode: true,
        })
      ).toBe(true);
    });
  });
});
