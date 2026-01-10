import { describe, expect, test } from 'bun:test';

import {
  canSubmitFullPrompt,
  canSubmitQuickVibes,
  canRefineQuickVibes,
  canSubmitCreativeBoost,
} from '@shared/submit-validation';

describe('canSubmitFullPrompt', () => {
  test('returns false when no input provided', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
    })).toBe(false);
  });

  test('returns true with description only', () => {
    expect(canSubmitFullPrompt({
      description: 'A jazz song',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
    })).toBe(true);
  });

  test('returns true with advanced selection only', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: true,
    })).toBe(true);
  });

  test('returns true with advanced selection in lyrics mode (no topic required)', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: '',
      lyricsMode: true,
      hasAdvancedSelection: true,
    })).toBe(true);
  });

  test('returns true with lyrics topic only in lyrics mode', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: 'Love and heartbreak',
      lyricsMode: true,
      hasAdvancedSelection: false,
    })).toBe(true);
  });

  test('returns false with lyrics topic when not in lyrics mode', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: 'Love and heartbreak',
      lyricsMode: false,
      hasAdvancedSelection: false,
    })).toBe(false);
  });

  test('trims whitespace from description', () => {
    expect(canSubmitFullPrompt({
      description: '   ',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
    })).toBe(false);
  });

  test('trims whitespace from lyrics topic', () => {
    expect(canSubmitFullPrompt({
      description: '',
      lyricsTopic: '   ',
      lyricsMode: true,
      hasAdvancedSelection: false,
    })).toBe(false);
  });
});

describe('canSubmitQuickVibes', () => {
  test('returns false when no input provided', () => {
    expect(canSubmitQuickVibes({
      category: null,
      customDescription: '',
      sunoStyles: [],
    })).toBe(false);
  });

  test('returns true with category only', () => {
    expect(canSubmitQuickVibes({
      category: 'chill',
      customDescription: '',
      sunoStyles: [],
    })).toBe(true);
  });

  test('returns true with description only', () => {
    expect(canSubmitQuickVibes({
      category: null,
      customDescription: 'Relaxing ambient',
      sunoStyles: [],
    })).toBe(true);
  });

  test('returns true with suno styles only', () => {
    expect(canSubmitQuickVibes({
      category: null,
      customDescription: '',
      sunoStyles: ['Lo-fi Hip Hop'],
    })).toBe(true);
  });

  test('trims whitespace from description', () => {
    expect(canSubmitQuickVibes({
      category: null,
      customDescription: '   ',
      sunoStyles: [],
    })).toBe(false);
  });
});

describe('canRefineQuickVibes', () => {
  const original = {
    category: 'lofi-study' as const,
    customDescription: '',
    sunoStyles: [] as string[],
  };

  test('returns false when nothing changed', () => {
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: [],
      original,
    })).toBe(false);
  });

  test('returns true when category changed', () => {
    expect(canRefineQuickVibes({
      category: 'cafe-coffeeshop',
      customDescription: '',
      sunoStyles: [],
      original,
    })).toBe(true);
  });

  test('returns true when category changed to null', () => {
    expect(canRefineQuickVibes({
      category: null,
      customDescription: '',
      sunoStyles: [],
      original,
    })).toBe(true);
  });

  test('returns true when description added', () => {
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: 'more upbeat',
      sunoStyles: [],
      original,
    })).toBe(true);
  });

  test('returns true when suno styles added', () => {
    expect(canRefineQuickVibes({
      category: null,
      customDescription: '',
      sunoStyles: ['Jazz'],
      original,
    })).toBe(true);
  });

  test('returns true when suno styles changed', () => {
    const originalWithStyles = { ...original, sunoStyles: ['Jazz'] };
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: ['Rock'],
      original: originalWithStyles,
    })).toBe(true);
  });

  test('returns true when suno styles order changed', () => {
    const originalWithStyles = { ...original, sunoStyles: ['Jazz', 'Rock'] };
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: ['Rock', 'Jazz'],
      original: originalWithStyles,
    })).toBe(true);
  });

  test('returns false when only whitespace added to description', () => {
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: '   ',
      sunoStyles: [],
      original,
    })).toBe(false);
  });

  test('falls back to canSubmitQuickVibes when no original', () => {
    expect(canRefineQuickVibes({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: [],
      original: null,
    })).toBe(true);

    expect(canRefineQuickVibes({
      category: null,
      customDescription: '',
      sunoStyles: [],
      original: null,
    })).toBe(false);
  });
});

describe('canSubmitCreativeBoost', () => {
  test('returns false when no input provided', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(false);
  });

  test('returns true with description only', () => {
    expect(canSubmitCreativeBoost({
      description: 'Upbeat electronic',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(true);
  });

  test('returns true with lyrics topic in lyrics mode', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: 'Summer adventures',
      lyricsMode: true,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(true);
  });

  test('returns false with lyrics topic when not in lyrics mode', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: 'Summer adventures',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(false);
  });

  test('returns true with suno styles only', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: ['Indie Rock'],
      seedGenres: [],
    })).toBe(true);
  });

  test('returns true with seed genres only', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: ['jazz'],
    })).toBe(true);
  });

  test('trims whitespace from description', () => {
    expect(canSubmitCreativeBoost({
      description: '   ',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(false);
  });

  test('trims whitespace from lyrics topic', () => {
    expect(canSubmitCreativeBoost({
      description: '',
      lyricsTopic: '   ',
      lyricsMode: true,
      sunoStyles: [],
      seedGenres: [],
    })).toBe(false);
  });
});
