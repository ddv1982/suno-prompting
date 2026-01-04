import { describe, it, expect } from 'bun:test';

import {
  buildSystemPrompt,
  buildContextualPrompt,
  buildMaxModeSystemPrompt,
  buildMaxModeContextualPrompt,
} from '@bun/prompt/builders';

import type { ModeSelection } from '@bun/instruments/selection';

const createEmptySelection = (): ModeSelection => ({
  genre: null,
  combination: null,
  singleMode: null,
  polyrhythmCombination: null,
  timeSignature: null,
  timeSignatureJourney: null,
  reasoning: '',
});

describe('builders', () => {
  describe('buildSystemPrompt', () => {
    it('includes character limit constraint', () => {
      const result = buildSystemPrompt(1000, false);
      expect(result).toContain('1000 characters');
    });

    it('includes critical rules', () => {
      const result = buildSystemPrompt(1000, false);
      expect(result).toContain('PRESERVE');
      expect(result).toContain('NEVER repeat');
    });

    it('includes section tags when useSunoTags is true', () => {
      const result = buildSystemPrompt(1000, true);
      expect(result).toContain('[INTRO]');
      expect(result).toContain('[VERSE]');
      expect(result).toContain('[CHORUS]');
      expect(result).toContain('[BRIDGE]');
      expect(result).toContain('[OUTRO]');
    });

    it('excludes section tags when useSunoTags is false', () => {
      const result = buildSystemPrompt(1000, false);
      expect(result).not.toContain('[INTRO]');
      expect(result).not.toContain('[VERSE]');
    });

    it('includes performance tags when useSunoTags is true', () => {
      const result = buildSystemPrompt(1000, true);
      expect(result).toContain('(breathy)');
      expect(result).toContain('(belt)');
    });
  });

  describe('buildContextualPrompt', () => {
    it('includes user description', () => {
      const description = 'A melancholic jazz ballad';
      const result = buildContextualPrompt(description, createEmptySelection());
      expect(result).toContain(description);
    });

    it('includes song concept header', () => {
      const result = buildContextualPrompt('test', createEmptySelection());
      expect(result).toContain("USER'S SONG CONCEPT");
    });

    it('adds technical guidance section when genre present', () => {
      const selection = { ...createEmptySelection(), genre: 'jazz' as const };
      const result = buildContextualPrompt('test', selection);
      expect(result).toContain('TECHNICAL GUIDANCE');
    });

    it('adds technical guidance when combination present', () => {
      const selection = { ...createEmptySelection(), combination: 'major_minor' as const };
      const result = buildContextualPrompt('test', selection);
      expect(result).toContain('TECHNICAL GUIDANCE');
    });

    it('adds technical guidance when singleMode present', () => {
      const selection = { ...createEmptySelection(), singleMode: 'lydian' as const };
      const result = buildContextualPrompt('test', selection);
      expect(result).toContain('TECHNICAL GUIDANCE');
    });

    it('omits technical guidance when selection is empty', () => {
      const result = buildContextualPrompt('simple song', createEmptySelection());
      expect(result).not.toContain('TECHNICAL GUIDANCE');
    });
  });

  describe('buildMaxModeSystemPrompt', () => {
    it('includes MAX MODE header instructions', () => {
      const result = buildMaxModeSystemPrompt(1000);
      expect(result).toContain('MAX MODE');
    });

    it('includes metadata format instructions', () => {
      const result = buildMaxModeSystemPrompt(1000);
      expect(result).toContain('genre:');
      expect(result).toContain('bpm:');
      expect(result).toContain('instruments:');
      expect(result).toContain('style tags:');
      expect(result).toContain('recording:');
    });

    it('warns against section tags', () => {
      const result = buildMaxModeSystemPrompt(1000);
      expect(result).toContain('NO section tags');
    });

    it('includes character limit', () => {
      const result = buildMaxModeSystemPrompt(500);
      expect(result).toContain('500 characters');
    });

    it('includes style tag examples', () => {
      const result = buildMaxModeSystemPrompt(1000);
      expect(result).toContain('STYLE TAGS EXAMPLES');
    });
  });

  describe('buildMaxModeContextualPrompt', () => {
    it('includes user description', () => {
      const description = 'An ambient soundscape';
      const result = buildMaxModeContextualPrompt(description, createEmptySelection());
      expect(result).toContain(description);
    });

    it('includes detected context section', () => {
      const result = buildMaxModeContextualPrompt('test', createEmptySelection());
      expect(result).toContain('DETECTED CONTEXT');
    });

    it('uses acoustic as default genre', () => {
      const result = buildMaxModeContextualPrompt('test', createEmptySelection());
      expect(result).toContain('Genre: acoustic');
    });

    it('includes genre-specific info when genre detected', () => {
      const selection = { ...createEmptySelection(), genre: 'jazz' as const };
      const result = buildMaxModeContextualPrompt('test', selection);
      expect(result).toContain('Tempo:');
      expect(result).toContain('BPM');
    });

    it('includes vocal style for detected genre', () => {
      const selection = { ...createEmptySelection(), genre: 'rock' as const };
      const result = buildMaxModeContextualPrompt('test', selection);
      expect(result).toContain('Vocal style:');
    });

    it('includes production descriptor for detected genre', () => {
      const selection = { ...createEmptySelection(), genre: 'electronic' as const };
      const result = buildMaxModeContextualPrompt('test', selection);
      expect(result).toContain('Production:');
    });

    it('includes chord progression for detected genre', () => {
      const selection = { ...createEmptySelection(), genre: 'blues' as const };
      const result = buildMaxModeContextualPrompt('test', selection);
      expect(result).toContain('Chord progression:');
    });

    it('includes suggested instruments for detected genre', () => {
      const selection = { ...createEmptySelection(), genre: 'jazz' as const };
      const result = buildMaxModeContextualPrompt('test', selection);
      expect(result).toContain('Suggested instruments:');
    });

    it('extracts user-mentioned instruments from description', () => {
      const result = buildMaxModeContextualPrompt(
        'A song with piano and drums',
        { ...createEmptySelection(), genre: 'jazz' as const }
      );
      expect(result).toContain('User mentioned instruments:');
    });
  });
});
