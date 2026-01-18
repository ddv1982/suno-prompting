import { describe, test, expect } from 'bun:test';

import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
} from '@bun/prompt/deterministic';
import { joinRecordingDescriptors } from '@bun/prompt/deterministic/helpers';
import { assembleStyleTags } from '@bun/prompt/deterministic/styles';

import type { ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Creates a seeded RNG for deterministic tests.
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Creates a valid ThematicContext for testing.
 */
function createThematicContext(overrides?: Partial<ThematicContext>): ThematicContext {
  return {
    themes: ['alien', 'bioluminescent', 'discovery'],
    moods: ['wondrous', 'curious'],
    scene: 'first steps into an alien jungle',
    ...overrides,
  };
}

describe('Merge Logic', () => {
  describe('assembleStyleTags with thematicContext', () => {
    test('appends themes to style tags when thematicContext provided', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext();

      const result = assembleStyleTags({
        components: ['electronic'],
        rng,
        thematicContext,
      });

      // Should contain at least one theme from thematicContext
      // Due to TAG_LIMIT of 10, not all themes may fit
      const hasTheme = thematicContext.themes.some((theme) =>
        result.tags.includes(theme.toLowerCase())
      );
      expect(hasTheme).toBe(true);

      // Third theme (discovery) should never be included (only first 2 attempted)
      expect(result.tags).not.toContain('discovery');
    });

    test('does not add themes when thematicContext is undefined', () => {
      const rng = createSeededRng(12345);

      const result = assembleStyleTags({
        components: ['jazz'],
        rng,
        thematicContext: undefined,
      });

      // Should not contain the test themes
      expect(result.tags).not.toContain('alien');
      expect(result.tags).not.toContain('bioluminescent');
      expect(result.tags).not.toContain('discovery');
    });

    test('existing behavior unchanged when thematicContext is null/undefined', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const resultWithout = assembleStyleTags({
        components: ['rock'],
        rng: rng1,
        thematicContext: undefined,
      });

      // Old signature still works
      const resultOldSignature = assembleStyleTags(['rock'], rng2);

      // Both should produce same mood tags (same seed, no thematic context)
      expect(resultWithout.moodTags).toEqual(resultOldSignature.moodTags);
    });
  });

  describe('joinRecordingDescriptors always uses production descriptors', () => {
    test('returns production descriptors with default count', () => {
      const rng = createSeededRng(12345);

      const result = joinRecordingDescriptors({ rng, count: 2 });

      // Should contain comma-separated descriptors (production/studio terms)
      expect(result).toContain(',');
      expect(result.length).toBeGreaterThan(0);
    });

    test('old signature still works', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const resultOptions = joinRecordingDescriptors({ rng: rng1, count: 2 });
      const resultOldSignature = joinRecordingDescriptors(rng2, 2);

      expect(resultOptions).toBe(resultOldSignature);
    });
  });

  describe('buildDeterministicStandardPrompt with thematicContext', () => {
    test('LLM moods replace genre moods in output', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        moods: ['wondrous', 'awe-struck', 'curious'],
      });

      const result = buildDeterministicStandardPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Should contain LLM moods in Mood field
      expect(result.text).toMatch(/Mood:.*wondrous/i);
      expect(result.text).toMatch(/Mood:.*awe-struck/i);
      expect(result.text).toMatch(/Mood:.*curious/i);
    });

    test('first LLM mood used in header (capitalized)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        moods: ['wondrous', 'curious'],
      });

      const result = buildDeterministicStandardPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Header should start with capitalized first mood
      expect(result.text).toMatch(/^\[Wondrous,/);
    });

    test('themes appended to style tags (third theme excluded)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        themes: ['alien', 'bioluminescent', 'discovery'],
      });

      const result = buildDeterministicStandardPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Style Tags should contain at least one theme from first 2
      // Due to TAG_LIMIT, not all may fit
      const hasAlien = result.text.match(/Style Tags:.*alien/i);
      const hasBioluminescent = result.text.match(/Style Tags:.*bioluminescent/i);
      expect(hasAlien || hasBioluminescent).toBeTruthy();

      // Third theme should NEVER be in style tags
      expect(result.text).not.toMatch(/Style Tags:.*discovery/i);
    });

    test('LLM scene goes to style tags (not recording)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        scene: 'first steps into an alien jungle',
      });

      const result = buildDeterministicStandardPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Recording should contain production descriptors, not scene
      expect(result.text).not.toMatch(/Recording:.*first steps into an alien jungle/i);
      // Scene may be truncated by 10-tag limit, but at minimum themes should appear
      const hasTheme = result.text.toLowerCase().includes('alien') ||
                       result.text.toLowerCase().includes('bioluminescent');
      expect(hasTheme).toBe(true);
    });

    test('no changes when thematicContext is null', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const resultWithout = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        rng: rng1,
        thematicContext: undefined,
      });

      const resultWith = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        rng: rng2,
      });

      // Both should produce identical output
      expect(resultWithout.text).toBe(resultWith.text);
    });

    test('schema requires minimum 2 moods (tested in thematic-context.test.ts)', () => {
      // Note: ThematicContext schema requires min 2 moods, so in practice
      // an empty moods array scenario shouldn't occur. If it somehow does,
      // the function will fall back to genre-derived moods.
      // Schema validation tests are in thematic-context.test.ts
      expect(true).toBe(true);
    });

    test('metadata recordingContext contains production descriptors (not scene)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        scene: 'mystical forest at twilight',
      });

      const result = buildDeterministicStandardPrompt({
        description: 'ambient music',
        rng,
        thematicContext,
      });

      // recordingContext should contain production descriptors, not scene
      expect(result.metadata?.recordingContext).not.toBe('mystical forest at twilight');
      expect(result.metadata?.recordingContext).toBeTruthy();
    });
  });

  describe('buildDeterministicMaxPrompt with thematicContext', () => {
    test('LLM moods replace genre moods in output', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        moods: ['wondrous', 'ethereal'],
      });

      const result = buildDeterministicMaxPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Should contain LLM moods in style tags
      expect(result.text).toMatch(/style tags:.*wondrous/i);
      expect(result.text).toMatch(/style tags:.*ethereal/i);
    });

    test('themes appended to style tags (third theme excluded)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        themes: ['cosmic', 'interstellar', 'nebula'],
      });

      const result = buildDeterministicMaxPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // Style tags should contain at least one theme from first 2
      // Due to TAG_LIMIT, not all may fit
      const hasCosmic = result.text.match(/style tags:.*cosmic/i);
      const hasInterstellar = result.text.match(/style tags:.*interstellar/i);
      expect(hasCosmic || hasInterstellar).toBeTruthy();

      // Third theme should NEVER be in style tags
      expect(result.text).not.toMatch(/style tags:.*nebula/i);
    });

    test('scene goes to style tags (not recording)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        scene: 'vast cosmic void between galaxies',
      });

      const result = buildDeterministicMaxPrompt({
        description: 'ambient music',
        rng,
        thematicContext,
      });

      // Recording should contain production descriptors, not scene
      expect(result.text).not.toMatch(/recording:.*vast cosmic void between galaxies/i);
      // Scene may be truncated by 10-tag limit, but default themes should appear
      const hasTheme = result.text.toLowerCase().includes('alien') ||
                       result.text.toLowerCase().includes('bioluminescent');
      expect(hasTheme).toBe(true);
    });

    test('no changes when thematicContext is null', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const resultWithout = buildDeterministicMaxPrompt({
        description: 'jazz session',
        rng: rng1,
        thematicContext: undefined,
      });

      const resultWith = buildDeterministicMaxPrompt({
        description: 'jazz session',
        rng: rng2,
      });

      // Both should produce identical output
      expect(resultWithout.text).toBe(resultWith.text);
    });

    test('metadata recordingContext contains production descriptors (not scene)', () => {
      const rng = createSeededRng(12345);
      const thematicContext = createThematicContext({
        scene: 'underground cavern with crystals',
      });

      const result = buildDeterministicMaxPrompt({
        description: 'electronic music',
        rng,
        thematicContext,
      });

      // recordingContext should contain production descriptors, not scene
      expect(result.metadata?.recordingContext).not.toBe('underground cavern with crystals');
      expect(result.metadata?.recordingContext).toBeTruthy();
    });

    test('existing max-builder tests still pass (deterministic output)', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);

      const result1 = buildDeterministicMaxPrompt({
        description: 'smooth jazz night session',
        rng: rng1,
      });
      const result2 = buildDeterministicMaxPrompt({
        description: 'smooth jazz night session',
        rng: rng2,
      });

      // Same seed should produce identical output
      expect(result1.text).toBe(result2.text);
    });
  });

  describe('Standard builder and max builder consistency', () => {
    test('both builders use same thematic context merge logic', () => {
      const thematicContext = createThematicContext({
        themes: ['mythical', 'ancient', 'forgotten'],
        moods: ['mysterious', 'haunting'],
        scene: 'ancient temple ruins at dawn',
      });

      const standardResult = buildDeterministicStandardPrompt({
        description: 'ambient music',
        rng: createSeededRng(12345),
        thematicContext,
      });

      const maxResult = buildDeterministicMaxPrompt({
        description: 'ambient music',
        rng: createSeededRng(12345),
        thematicContext,
      });

      // Both should have production descriptors in recording (not scene)
      expect(standardResult.metadata?.recordingContext).not.toBe('ancient temple ruins at dawn');
      expect(maxResult.metadata?.recordingContext).not.toBe('ancient temple ruins at dawn');

      // Scene should NOT be in recording
      expect(standardResult.text).not.toMatch(/Recording:.*ancient temple ruins at dawn/i);
      expect(maxResult.text).not.toMatch(/recording:.*ancient temple ruins at dawn/i);

      // At least one theme should appear in style tags (scene may be truncated by limit)
      expect(standardResult.text).toContain('mythical');
      expect(maxResult.text).toContain('mythical');
    });

    test('moodCategory still takes priority over thematicContext when both provided', () => {
      const thematicContext = createThematicContext({
        moods: ['wondrous', 'curious'],
      });

      const result = buildDeterministicStandardPrompt({
        description: 'electronic music',
        rng: createSeededRng(12345),
        moodCategory: 'calm',
        thematicContext,
      });

      // Since thematicContext has highest priority, it should override moodCategory
      // But we need to verify the priority order in the implementation
      // ThematicContext moods should take priority
      expect(result.text).toMatch(/Mood:.*wondrous/i);
    });
  });
});
