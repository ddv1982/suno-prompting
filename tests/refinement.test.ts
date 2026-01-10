import { describe, test, expect, mock } from 'bun:test';

import {
  buildCombinedSystemPrompt,
  buildCombinedWithLyricsSystemPrompt,
  type RefinementContext,
} from '@bun/prompt/builders';
import {
  cleanJsonResponse,
  cleanTitle,
  cleanLyrics,
  parseJsonResponse,
} from '@shared/prompt-utils';

describe('Prompt Builder Refinement', () => {
  describe('buildCombinedSystemPrompt with refinement', () => {
    const refinement: RefinementContext = {
      currentPrompt: 'ambient electronic, soft pads',
      currentTitle: 'Ocean Dreams',
    };

    test('includes refinement mode instructions when context provided', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('REFINEMENT MODE');
      expect(result).toContain('refining an existing music prompt');
    });

    test('includes current prompt and title in template', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('CURRENT STYLE PROMPT:');
      expect(result).toContain('ambient electronic, soft pads');
      expect(result).toContain('CURRENT TITLE:');
      expect(result).toContain('Ocean Dreams');
    });

    test('outputs JSON format with prompt and title fields', () => {
      const result = buildCombinedSystemPrompt(200, true, false, refinement);
      expect(result).toContain('"prompt":');
      expect(result).toContain('"title":');
    });

    test('works with maxMode enabled', () => {
      const result = buildCombinedSystemPrompt(200, true, true, refinement);
      expect(result).toContain('REFINEMENT MODE');
      expect(result).toContain('MAX MODE');
    });

    test('does not include refinement mode without context', () => {
      const result = buildCombinedSystemPrompt(200, true, false);
      expect(result).not.toContain('REFINEMENT MODE');
      expect(result).not.toContain('CURRENT STYLE PROMPT');
    });
  });

  describe('buildCombinedWithLyricsSystemPrompt with refinement', () => {
    test('includes current lyrics when provided', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nRolling down the highway\nSearching for the light',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('CURRENT LYRICS:');
      expect(result).toContain('Rolling down the highway');
    });

    test('instructs to generate fresh lyrics when currentLyrics is empty', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('generate fresh lyrics');
    });

    test('instructs to generate fresh lyrics when currentLyrics is undefined', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).toContain('generate fresh lyrics');
    });

    test('includes lyrics requirements for fresh generation', () => {
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

    test('does not include lyrics requirements when lyrics exist', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nExisting lyrics here',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, false, refinement);
      expect(result).not.toContain('LYRICS REQUIREMENTS FOR NEW LYRICS');
    });

    test('includes max mode header requirement when maxMode enabled', () => {
      const refinement: RefinementContext = {
        currentPrompt: 'rock anthem',
        currentTitle: 'Thunder Road',
        currentLyrics: '[VERSE]\nTest',
      };
      const result = buildCombinedWithLyricsSystemPrompt(200, true, true, refinement);
      expect(result).toContain('///*****///');
    });

    test('outputs JSON format with prompt, title, and lyrics fields', () => {
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

describe('Deterministic Refinement (Offline Mode)', () => {
  test('uses deterministic style tag regeneration when offline and no lyrics', async () => {
    const { refinePrompt } = await import('@bun/ai/refinement');
    
    const mockConfig = {
      isUseLocalLLM: () => true,
      isLyricsMode: () => false,
      isMaxMode: () => false,
      isDebugMode: () => true, // Enable debug mode to test debug info
      getUseSunoTags: () => true,
      getOllamaEndpoint: () => 'http://localhost:11434',
      getModel: () => { throw new Error('Should not call LLM in deterministic mode'); },
      postProcess: async (text: string) => text,
      buildDebugInfo: (system: string, user: string, response: string) => ({
        systemPrompt: system,
        userPrompt: user,
        rawResponse: response,
      }),
    };

    const currentPrompt = `genre: "jazz"
mood: "smooth, warm"
style tags: "old tags, outdated"
instruments: "piano, bass"
BPM: 90`;

    const result = await refinePrompt(
      {
        currentPrompt,
        currentTitle: 'My Jazz Song',
        feedback: 'make it more energetic',
      },
      mockConfig as any
    );

    // Verify style tags were regenerated (should be different from "old tags, outdated")
    expect(result.text).toContain('style tags:');
    expect(result.text).not.toContain('old tags, outdated');
    
    // Verify prompt structure is preserved
    expect(result.text).toContain('genre: "jazz"');
    expect(result.text).toContain('mood: "smooth, warm"');
    
    // Verify title is preserved
    expect(result.title).toBe('My Jazz Song');
    
    // Verify debug info indicates deterministic mode
    expect(result.debugInfo?.systemPrompt).toContain('DETERMINISTIC_REFINE');
  });

  test('uses LLM when offline but lyrics mode is enabled', async () => {
    // Mock the Ollama availability check to return unavailable BEFORE importing refinePrompt
    const mockCheckOllama = mock(() =>
      Promise.resolve({ available: false, hasGemma: false })
    );
    
    await mock.module('@bun/ai/ollama-availability', () => ({
      checkOllamaAvailable: mockCheckOllama,
      invalidateOllamaCache: mock(() => {}),
    }));
    
    // Re-import after mocking to get the mocked version
    const { refinePrompt } = await import('@bun/ai/refinement');
    
    const mockConfig = {
      isUseLocalLLM: () => true,
      isLyricsMode: () => true, // Lyrics mode ON - should use LLM
      isMaxMode: () => false,
      isDebugMode: () => false,
      getUseSunoTags: () => true,
      getOllamaEndpoint: () => 'http://localhost:11434',
      getModel: () => {
        throw new Error('Should not be called - Ollama check should fail first');
      },
      postProcess: async (text: string) => text,
      buildDebugInfo: (system: string, user: string, response: string) => ({
        systemPrompt: system,
        userPrompt: user,
        rawResponse: response,
      }),
    };

    const currentPrompt = `genre: "jazz"
mood: "smooth"
style tags: "warm"
instruments: "piano"`;

    // Should attempt to use LLM (not deterministic)
    // Will fail Ollama availability check since we mocked it as unavailable
    await expect(
      refinePrompt(
        {
          currentPrompt,
          currentTitle: 'My Song',
          feedback: 'refine it',
          currentLyrics: '[VERSE]\nExisting lyrics',
        },
        mockConfig as any
      )
    ).rejects.toThrow('Ollama');
    
    // Verify that checkOllamaAvailable was called (proves it's NOT using deterministic path)
    expect(mockCheckOllama).toHaveBeenCalled();
  });
});

describe('AI Engine Helper Methods', () => {
  describe('cleanJsonResponse', () => {
    test('removes markdown code blocks', () => {
      const input = '```json\n{"prompt": "test"}\n```';
      expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    test('handles json without newline after opener', () => {
      const input = '```json{"prompt": "test"}```';
      expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    test('trims whitespace', () => {
      const input = '  {"prompt": "test"}  ';
      expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });

    test('returns clean json unchanged', () => {
      const input = '{"prompt": "test"}';
      expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
    });
  });

  describe('cleanTitle', () => {
    test('trims whitespace', () => {
      expect(cleanTitle('  Ocean Dreams  ')).toBe('Ocean Dreams');
    });

    test('removes surrounding single quotes', () => {
      expect(cleanTitle("'Ocean Dreams'")).toBe('Ocean Dreams');
    });

    test('removes surrounding double quotes', () => {
      expect(cleanTitle('"Ocean Dreams"')).toBe('Ocean Dreams');
    });

    test('returns fallback when title is undefined', () => {
      expect(cleanTitle(undefined)).toBe('Untitled');
    });

    test('returns fallback when title is empty string', () => {
      expect(cleanTitle('')).toBe('Untitled');
    });

    test('returns fallback when title is only whitespace', () => {
      expect(cleanTitle('   ')).toBe('Untitled');
    });

    test('uses custom fallback when provided', () => {
      expect(cleanTitle(undefined, 'My Default')).toBe('My Default');
    });

    test('preserves internal quotes', () => {
      expect(cleanTitle("Ocean's Dream")).toBe("Ocean's Dream");
    });
  });

  describe('cleanLyrics', () => {
    test('trims whitespace', () => {
      expect(cleanLyrics('  [VERSE]\nHello  ')).toBe('[VERSE]\nHello');
    });

    test('returns undefined for empty string', () => {
      expect(cleanLyrics('')).toBeUndefined();
    });

    test('returns undefined for whitespace only', () => {
      expect(cleanLyrics('   ')).toBeUndefined();
    });

    test('returns undefined for undefined input', () => {
      expect(cleanLyrics(undefined)).toBeUndefined();
    });

    test('preserves valid lyrics', () => {
      const lyrics = '[VERSE]\nLine one\nLine two';
      expect(cleanLyrics(lyrics)).toBe(lyrics);
    });
  });

  describe('parseJsonResponse', () => {
    test('parses valid JSON response', () => {
      const input = '{"prompt": "test prompt", "title": "Test Title"}';
      const result = parseJsonResponse(input);
      expect(result).toEqual({ prompt: 'test prompt', title: 'Test Title' });
    });

    test('parses JSON with lyrics', () => {
      const input = '{"prompt": "test", "title": "Title", "lyrics": "[VERSE]\\nHello"}';
      const result = parseJsonResponse(input);
      expect(result?.lyrics).toBe('[VERSE]\nHello');
    });

    test('removes markdown code blocks before parsing', () => {
      const input = '```json\n{"prompt": "test", "title": "Title"}\n```';
      const result = parseJsonResponse(input);
      expect(result).toEqual({ prompt: 'test', title: 'Title' });
    });

    test('returns null for invalid JSON', () => {
      const input = 'not valid json';
      expect(parseJsonResponse(input)).toBeNull();
    });

    test('returns null when prompt field is missing', () => {
      const input = '{"title": "Title Only"}';
      expect(parseJsonResponse(input)).toBeNull();
    });

    test('returns null when prompt is empty string', () => {
      const input = '{"prompt": "", "title": "Title"}';
      expect(parseJsonResponse(input)).toBeNull();
    });
  });
});
