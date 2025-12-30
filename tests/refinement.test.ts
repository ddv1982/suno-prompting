import { describe, it, expect } from 'bun:test';
import {
  buildCombinedSystemPrompt,
  buildCombinedWithLyricsSystemPrompt,
  type RefinementContext,
} from '@bun/prompt/builders';
import {
  _testCleanJsonResponse,
  _testCleanTitle,
  _testCleanLyrics,
  _testParseJsonResponse,
} from '@bun/ai-engine';

describe('Prompt Builder Refinement', () => {
  describe('buildCombinedSystemPrompt with refinement', () => {
    const refinement: RefinementContext = {
      currentPrompt: 'ambient electronic, soft pads',
      currentTitle: 'Ocean Dreams',
    };

    it('includes refinement mode instructions when context provided', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('REFINEMENT MODE');
      expect(result).toContain('refining an existing music prompt');
    });

    it('includes current prompt and title in template', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('CURRENT STYLE PROMPT:');
      expect(result).toContain('ambient electronic, soft pads');
      expect(result).toContain('CURRENT TITLE:');
      expect(result).toContain('Ocean Dreams');
    });

    it('outputs JSON format with prompt and title fields', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('"prompt":');
      expect(result).toContain('"title":');
    });

    it('works with maxMode enabled', () => {
      const result = buildCombinedSystemPrompt(200, true, true, refinement);
      expect(result).toContain('REFINEMENT MODE');
      expect(result).toContain('MAX MODE');
    });

    it('does not include refinement mode without context', () => {
      const result = buildCombinedSystemPrompt(200, true, false);
      expect(result).not.toContain('REFINEMENT MODE');
      expect(result).not.toContain('CURRENT STYLE PROMPT');
    });
  });

  describe('buildCombinedWithLyricsSystemPrompt with refinement', () => {
    it('includes current lyrics when provided', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nRolling down the highway\nSearching for the light',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('CURRENT LYRICS:');
      expect(result).toContain('Rolling down the highway');
    });

    it('instructs to generate fresh lyrics when currentLyrics is empty', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('generate fresh lyrics');
    });

    it('instructs to generate fresh lyrics when currentLyrics is undefined', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('generate fresh lyrics');
    });

    it('includes lyrics requirements for fresh generation', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('LYRICS REQUIREMENTS');
      expect(result).toContain('[INTRO]');
      expect(result).toContain('[VERSE]');
      expect(result).toContain('[CHORUS]');
    });

    it('does not include lyrics requirements when lyrics exist', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nExisting lyrics here',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).not.toContain('LYRICS REQUIREMENTS FOR NEW LYRICS');
    });

    it('includes max mode header requirement when maxMode enabled', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nTest',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, true, refinement);
      expect(result).toContain('///*****///');
    });

    it('outputs JSON format with prompt, title, and lyrics fields', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nTest',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('"prompt":');
      expect(result).toContain('"title":');
      expect(result).toContain('"lyrics":');
    });
  });
});

describe('AI Engine Helper Methods', () => {
  describe('cleanJsonResponse', () => {
    it('removes markdown code blocks', () => {
      const input = '```json\n{"prompt": "test"}\n```';
      expect(_testCleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    it('handles json without newline after opener', () => {
      const input = '```json{"prompt": "test"}```';
      expect(_testCleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    it('trims whitespace', () => {
      const input = '  {"prompt": "test"}  ';
      expect(_testCleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    it('returns clean json unchanged', () => {
      const input = '{"prompt": "test"}';
      expect(_testCleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });
  });

  describe('cleanTitle', () => {
    it('trims whitespace', () => {
      expect(_testCleanTitle('  Ocean Dreams  ')).toBe('Ocean Dreams');
    });

    it('removes surrounding single quotes', () => {
      expect(_testCleanTitle("'Ocean Dreams'")).toBe('Ocean Dreams');
    });

    it('removes surrounding double quotes', () => {
      expect(_testCleanTitle('"Ocean Dreams"')).toBe('Ocean Dreams');
    });

    it('returns fallback when title is undefined', () => {
      expect(_testCleanTitle(undefined)).toBe('Untitled');
    });

    it('returns fallback when title is empty string', () => {
      expect(_testCleanTitle('')).toBe('Untitled');
    });

    it('returns fallback when title is only whitespace', () => {
      expect(_testCleanTitle('   ')).toBe('Untitled');
    });

    it('uses custom fallback when provided', () => {
      expect(_testCleanTitle(undefined, 'My Default')).toBe('My Default');
    });

    it('preserves internal quotes', () => {
      expect(_testCleanTitle("Ocean's Dream")).toBe("Ocean's Dream");
    });
  });

  describe('cleanLyrics', () => {
    it('trims whitespace', () => {
      expect(_testCleanLyrics('  [VERSE]\nHello  ')).toBe('[VERSE]\nHello');
    });

    it('returns undefined for empty string', () => {
      expect(_testCleanLyrics('')).toBeUndefined();
    });

    it('returns undefined for whitespace only', () => {
      expect(_testCleanLyrics('   ')).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
      expect(_testCleanLyrics(undefined)).toBeUndefined();
    });

    it('preserves valid lyrics', () => {
      const lyrics = '[VERSE]\nLine one\nLine two';
      expect(_testCleanLyrics(lyrics)).toBe(lyrics);
    });
  });

  describe('parseJsonResponse', () => {
    it('parses valid JSON response', () => {
      const input = '{"prompt": "test prompt", "title": "Test Title"}';
      const result = _testParseJsonResponse(input);
      expect(result).toEqual({ prompt: 'test prompt', title: 'Test Title' });
    });

    it('parses JSON with lyrics', () => {
      const input = '{"prompt": "test", "title": "Title", "lyrics": "[VERSE]\\nHello"}';
      const result = _testParseJsonResponse(input);
      expect(result?.lyrics).toBe('[VERSE]\nHello');
    });

    it('removes markdown code blocks before parsing', () => {
      const input = '```json\n{"prompt": "test", "title": "Title"}\n```';
      const result = _testParseJsonResponse(input);
      expect(result).toEqual({ prompt: 'test', title: 'Title' });
    });

    it('returns null for invalid JSON', () => {
      const input = 'not valid json';
      expect(_testParseJsonResponse(input)).toBeNull();
    });

    it('returns null when prompt field is missing', () => {
      const input = '{"title": "Title Only"}';
      expect(_testParseJsonResponse(input)).toBeNull();
    });

    it('returns null when prompt is empty string', () => {
      const input = '{"prompt": "", "title": "Title"}';
      expect(_testParseJsonResponse(input)).toBeNull();
    });
  });
});
