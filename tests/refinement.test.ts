import { describe, test, expect, mock, afterAll } from 'bun:test';

afterAll(() => {
  mock.restore();
});

import { cleanTitle, cleanLyrics } from '@bun/ai/utils';
import {
  buildCombinedSystemPrompt,
  buildCombinedWithLyricsSystemPrompt,
  type RefinementContext,
} from '@bun/prompt/builders';
import { ValidationError } from '@shared/errors';
import { cleanJsonResponse } from '@shared/prompt-utils';

// Test-only helper: Parse a combined JSON response from LLM
interface ParsedCombinedResponse {
  prompt: string;
  title?: string;
  lyrics?: string;
}

function parseJsonResponse(rawResponse: string): ParsedCombinedResponse | null {
  try {
    const cleaned = cleanJsonResponse(rawResponse);
    const parsed = JSON.parse(cleaned) as ParsedCombinedResponse;
    if (!parsed.prompt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

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
      isDebugMode: () => true,
      getUseSunoTags: () => true,
      getOllamaEndpoint: () => 'http://localhost:11434',
      getModel: () => { throw new Error('Should not call LLM in deterministic mode'); },
      postProcess: async (text: string) => text,
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
    
    // Debug tracing is migrated to TraceRun, but trace emission is implemented in later task groups.
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

// ============================================
// Refinement Type Routing Tests (Task 6.4)
// ============================================

describe('Refinement Type Routing', () => {
  /**
   * Create a mock config for testing refinement.
   * All LLM calls are disabled by default to test deterministic behavior.
   */
  function createMockConfig(overrides: Partial<{
    isUseLocalLLM: () => boolean;
    isLyricsMode: () => boolean;
    isMaxMode: () => boolean;
    isDebugMode: () => boolean;
    getUseSunoTags: () => boolean;
    getOllamaEndpoint: () => string;
    getModel: () => never;
    postProcess: (text: string) => Promise<string>;
  }> = {}) {
    return {
      isUseLocalLLM: () => false,
      isLyricsMode: () => false,
      isMaxMode: () => false,
      isDebugMode: () => false,
      getUseSunoTags: () => true,
      getOllamaEndpoint: () => 'http://localhost:11434',
      getModel: () => {
        throw new Error('LLM should not be called');
      },
      postProcess: async (text: string) => text,
      ...overrides,
    };
  }

  describe('style-only refinement (refinementType: "style")', () => {
    test('does not call LLM for style-only refinement', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      let llmCalled = false;
      const mockConfig = createMockConfig({
        getModel: () => {
          llmCalled = true;
          throw new Error('LLM should not be called for style-only refinement');
        },
      });

      const result = await refinePrompt(
        {
          currentPrompt: 'genre: "jazz"\nmood: "smooth"\nstyle tags: "old"',
          currentTitle: 'Jazz Vibes',
          feedback: '', // No feedback for style-only
          refinementType: 'style',
          styleChanges: { seedGenres: ['jazz', 'blues'] },
        },
        mockConfig as any
      );

      // Assert
      expect(llmCalled).toBe(false);
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('returns updated prompt for style-only refinement', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig();
      const currentPrompt = `genre: "jazz"
mood: "smooth, warm"
style tags: "old tags"
instruments: "piano, bass"`;

      const result = await refinePrompt(
        {
          currentPrompt,
          currentTitle: 'My Jazz Song',
          feedback: '',
          refinementType: 'style',
          styleChanges: { seedGenres: ['rock'] },
        },
        mockConfig as any
      );

      // Style-only refinement should produce a valid prompt
      expect(result.text).toBeDefined();
      expect(result.text).toContain('genre:');
      expect(result.title).toBe('My Jazz Song'); // Title preserved
    });

    test('preserves existing lyrics for style-only refinement', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig();
      const existingLyrics = '[VERSE]\nExisting lyrics content';

      const result = await refinePrompt(
        {
          currentPrompt: 'genre: "jazz"\nstyle tags: "smooth"',
          currentTitle: 'Test Song',
          feedback: '',
          currentLyrics: existingLyrics,
          refinementType: 'style',
          styleChanges: { sunoStyles: ['dream-pop'] },
        },
        mockConfig as any
      );

      // Lyrics should be preserved unchanged
      expect(result.lyrics).toBe(existingLyrics);
    });
  });

  describe('lyrics-only refinement (refinementType: "lyrics")', () => {
    // Note: Bootstrap behavior when no lyrics exist is tested in ai-refinement.test.ts
    // which has proper top-level module mocking for LLM calls.

    test('throws ValidationError without feedback text', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig({
        isLyricsMode: () => true,
      });

      // Act & Assert - Empty feedback
      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '',
            currentLyrics: '[VERSE]\nExisting lyrics',
            refinementType: 'lyrics',
          },
          mockConfig as any
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '',
            currentLyrics: '[VERSE]\nExisting lyrics',
            refinementType: 'lyrics',
          },
          mockConfig as any
        )
      ).rejects.toThrow('Feedback is required for lyrics refinement');
    });

    test('throws ValidationError for whitespace-only feedback', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig({
        isLyricsMode: () => true,
      });

      // Act & Assert - Whitespace-only feedback
      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '   \n\t  ',
            currentLyrics: '[VERSE]\nExisting lyrics',
            refinementType: 'lyrics',
          },
          mockConfig as any
        )
      ).rejects.toThrow('Feedback is required for lyrics refinement');
    });
  });

  describe('combined refinement (refinementType: "combined")', () => {
    test('processes both style and lyrics', async () => {
      // Note: This test verifies the combined path is taken, but the actual
      // lyrics refinement will fail without proper LLM setup. We're testing
      // that the routing logic works correctly.
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig({
        isLyricsMode: () => false, // No lyrics mode, so only style is processed
      });

      const result = await refinePrompt(
        {
          currentPrompt: 'genre: "jazz"\nstyle tags: "smooth"',
          currentTitle: 'Combined Test',
          feedback: 'make it more energetic',
          refinementType: 'combined',
          styleChanges: { seedGenres: ['rock'] },
        },
        mockConfig as any
      );

      // Combined refinement should return a result
      expect(result.text).toBeDefined();
      expect(result.title).toBe('Combined Test');
    });
  });

  describe('invalid refinement type', () => {
    test('throws ValidationError for invalid refinement type', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig();

      // Act & Assert - Invalid type 'none'
      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '',
            refinementType: 'none', // Invalid for actual refinement
          },
          mockConfig as any
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '',
            refinementType: 'none',
          },
          mockConfig as any
        )
      ).rejects.toThrow('Invalid refinement type');
    });

    test('throws ValidationError for unknown refinement type', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig();

      // Act & Assert - Unknown type
      await expect(
        refinePrompt(
          {
            currentPrompt: 'genre: "jazz"',
            currentTitle: 'Test',
            feedback: '',
            refinementType: 'unknown' as any, // Invalid type
          },
          mockConfig as any
        )
      ).rejects.toThrow('Invalid refinement type');
    });
  });

  describe('backwards compatibility', () => {
    test('defaults to combined when refinementType not provided', async () => {
      const { refinePrompt } = await import('@bun/ai/refinement');
      
      const mockConfig = createMockConfig({
        isLyricsMode: () => false,
      });

      // No refinementType provided - should default to 'combined'
      const result = await refinePrompt(
        {
          currentPrompt: 'genre: "jazz"\nstyle tags: "smooth"',
          currentTitle: 'Backwards Compat Test',
          feedback: 'make it better',
          // refinementType not provided
        },
        mockConfig as any
      );

      // Should work like combined (default)
      expect(result.text).toBeDefined();
      expect(result.title).toBe('Backwards Compat Test');
    });
  });
});
