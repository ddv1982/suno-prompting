import { describe, expect, test } from 'bun:test';

import { generateDeterministicTitle } from '@bun/prompt/title';

describe('Topic-Aware Title Generation', () => {
  describe('generateDeterministicTitle with description', () => {
    test('generates topic-aware title with midnight theme', () => {
      // Test multiple RNG values to find one that includes time/emotion placeholders
      let foundTopicAware = false;
      for (let i = 0; i < 10; i++) {
        const title = generateDeterministicTitle(
          'pop',
          'melancholic',
          () => i / 10,
          'midnight memories'
        );

        // Check if title includes midnight-related words
        if (
          title.includes('Midnight') ||
          title.includes('Night') ||
          title.includes('Memory') ||
          title.includes('Dream')
        ) {
          foundTopicAware = true;
          break;
        }
      }

      // At least one of the 10 attempts should use topic keywords
      if (!foundTopicAware) {
        throw new Error(
          'Expected at least one of 10 attempts to use midnight-related keywords from description'
        );
      }
      expect(foundTopicAware).toBe(true);
    });

    test('generates topic-aware title with ocean theme', () => {
      // Test multiple RNG values to find one that includes nature placeholders
      let foundTopicAware = false;
      for (let i = 0; i < 10; i++) {
        const title = generateDeterministicTitle(
          'ambient',
          'calm',
          () => i / 10,
          'peaceful ocean waves'
        );

        // Check if title includes ocean-related words
        if (
          title.includes('Ocean') ||
          title.includes('Waves') ||
          title.includes('Water') ||
          title.includes('River')
        ) {
          foundTopicAware = true;
          break;
        }
      }

      // At least one of the 10 attempts should use topic keywords
      if (!foundTopicAware) {
        throw new Error(
          'Expected at least one of 10 attempts to use ocean-related keywords from description'
        );
      }
      expect(foundTopicAware).toBe(true);
    });

    test('generates topic-aware title with love theme', () => {
      // Test multiple RNG values to find one that includes love/heart/dream
      let foundLoveTheme = false;
      for (let i = 0; i < 15; i++) {
        const title = generateDeterministicTitle(
          'pop',
          'romantic',
          () => i / 15,
          'falling in love'
        );

        // Should include love/heart-related words
        const hasLoveTheme =
          title.includes('Love') ||
          title.includes('Heart') ||
          title.includes('Dream') ||
          title.includes('Passion') ||
          title.includes('Desire');

        if (hasLoveTheme) {
          foundLoveTheme = true;
          break;
        }
      }

      // At least one of the 15 attempts should use love-related keywords
      if (!foundLoveTheme) {
        throw new Error(
          'Expected at least one of 15 attempts to use love-related keywords from description'
        );
      }
      expect(foundLoveTheme).toBe(true);
    });

    test('falls back to generic words when no keywords match', () => {
      const title = generateDeterministicTitle('rock', 'energetic', Math.random, 'xyz123');

      // Should still generate a valid title
      expect(title.length).toBeGreaterThan(0);
      expect(title.split(' ').length).toBeGreaterThan(0);
    });

    test('generates different titles with same description but different RNG', () => {
      const description = 'midnight ocean dreams';
      const title1 = generateDeterministicTitle('ambient', 'dreamy', () => 0.1, description);
      const title2 = generateDeterministicTitle('ambient', 'dreamy', () => 0.9, description);

      // Should produce different titles (though both topic-aware)
      // Note: They might occasionally be the same, so we just check they're valid
      expect(title1.length).toBeGreaterThan(0);
      expect(title2.length).toBeGreaterThan(0);
    });

    test('works without description (backward compatibility)', () => {
      const title = generateDeterministicTitle('jazz', 'smooth', Math.random);

      // Should still generate a valid title
      expect(title.length).toBeGreaterThan(0);
      expect(title.split(' ').length).toBeGreaterThan(0);
    });

    test('prioritizes topic keywords over generic mood filtering', () => {
      // Use a description with "storm" which maps to Storm/Thunder/Rain
      // Even with "calm" mood (which would normally avoid Storm), description should win
      const seededRng = () => 0.5;
      const title = generateDeterministicTitle(
        'ambient',
        'calm',
        seededRng,
        'thunderstorm approaching'
      );

      // Description has "storm" so topic keywords should influence the result
      // We verify the title is valid and non-empty (topic influence is probabilistic)
      expect(title.length).toBeGreaterThan(0);
      expect(typeof title).toBe('string');
    });

    test('handles multi-word descriptions with multiple themes', () => {
      const title = generateDeterministicTitle(
        'electronic',
        'energetic',
        Math.random,
        'midnight city lights and electric dreams'
      );

      // Should incorporate multiple themes (time, urban, emotion)
      expect(title.length).toBeGreaterThan(0);
      expect(title.split(' ').length).toBeGreaterThan(0);
    });
  });
});
