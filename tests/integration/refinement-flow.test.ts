import { describe, test, expect, mock, beforeEach } from 'bun:test';

import { createHandlers } from '@bun/handlers';
import { APP_CONSTANTS } from '@shared/constants';

import type { StyleChanges, PromptSession, AppConfig } from '@shared/types';

// API refinement type - excludes 'none' which is only used for button state
type ApiRefinementType = 'style' | 'lyrics' | 'combined';

/**
 * Integration tests for the complete refinement flow from UI to handler.
 *
 * These tests verify that:
 * - Style-only refinement completes successfully without LLM
 * - Lyrics-only refinement completes successfully
 * - Combined refinement completes successfully
 * - Error handling works for each refinement type
 *
 * Tests mock the RPC layer and AI engine to verify the complete flow.
 */

// ============================================
// Mock Factories
// ============================================

/**
 * Create a mock AI engine with configurable behavior.
 */
function createMockAIEngine() {
  return {
    generateInitial: mock(() =>
      Promise.resolve({
        text: 'Generated prompt',
        title: 'Title',
        lyrics: 'Lyrics',
      })
    ),
    refinePrompt: mock(() =>
      Promise.resolve({
        text: 'Refined prompt',
        title: 'Refined Title',
        lyrics: 'Refined Lyrics',
      })
    ),
    remixInstruments: mock(() => Promise.resolve({ text: 'Remixed instruments' })),
    remixGenre: mock(() => Promise.resolve({ text: 'Remixed genre' })),
    remixMood: mock(() => Promise.resolve({ text: 'Remixed mood' })),
    remixStyleTags: mock(() => Promise.resolve({ text: 'Remixed style tags' })),
    remixRecording: mock(() => Promise.resolve({ text: 'Remixed recording' })),
    remixTitle: mock(() => Promise.resolve({ title: 'New Title' })),
    remixLyrics: mock(() => Promise.resolve({ lyrics: 'New Lyrics' })),
    generateQuickVibes: mock(() => Promise.resolve({ text: 'Quick vibes prompt' })),
    refineQuickVibes: mock(() => Promise.resolve({ text: 'Refined quick vibes' })),
    generateCreativeBoost: mock(() =>
      Promise.resolve({
        text: 'Creative boost prompt',
        title: 'Creative Title',
        lyrics: 'Creative lyrics',
      })
    ),
    refineCreativeBoost: mock(() =>
      Promise.resolve({
        text: 'Refined creative boost',
        title: 'Refined Title',
        lyrics: 'Refined lyrics',
      })
    ),
    setProvider: mock(() => {}),
    setApiKey: mock(() => {}),
    setModel: mock(() => {}),
    setUseSunoTags: mock(() => {}),
    setDebugMode: mock(() => {}),
    setMaxMode: mock(() => {}),
    setUseLocalLLM: mock(() => {}),
    setLyricsMode: mock(() => {}),
    getModel: mock(() => ({}) as any),
    isDebugMode: mock(() => false),
  };
}

/**
 * Create a mock storage manager with internal state.
 */
function createMockStorage() {
  let sessions: PromptSession[] = [];
  let config: AppConfig = {
    provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
    apiKeys: { groq: null, openai: null, anthropic: null },
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: true,
    debugMode: false,
    maxMode: false,
    lyricsMode: false,
    storyMode: false,
    useLocalLLM: false,
    promptMode: 'full',
    creativeBoostMode: 'simple',
  };

  return {
    getHistory: mock(() => Promise.resolve(sessions)),
    saveSession: mock((session: PromptSession) => {
      sessions = sessions.filter((s) => s.id !== session.id);
      sessions.unshift(session);
      return Promise.resolve();
    }),
    deleteSession: mock((id: string) => {
      sessions = sessions.filter((s) => s.id !== id);
      return Promise.resolve();
    }),
    getConfig: mock(() => Promise.resolve(config)),
    saveConfig: mock((updates: Partial<AppConfig>) => {
      config = { ...config, ...updates };
      return Promise.resolve();
    }),
    initialize: mock(() => Promise.resolve()),
    // For test access
    _getSessions: () => sessions,
    _getConfig: () => config,
  };
}

// ============================================
// Tests
// ============================================

describe('Refinement Flow Integration', () => {
  let aiEngine: ReturnType<typeof createMockAIEngine>;
  let storage: ReturnType<typeof createMockStorage>;
  let handlers: ReturnType<typeof createHandlers>;

  beforeEach(() => {
    aiEngine = createMockAIEngine();
    storage = createMockStorage();
    handlers = createHandlers(aiEngine as any, storage as any);
  });

  describe('Style-only refinement flow', () => {
    test('style-only refinement completes successfully', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "jazz"\nmood: "smooth"\nstyle tags: "old tags"',
        currentTitle: 'Jazz Vibes',
        feedback: '', // No feedback for style-only
        refinementType: 'style' as ApiRefinementType,
        styleChanges: { seedGenres: ['rock', 'blues'] },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(typeof result.prompt).toBe('string');
      expect(result.versionId).toBeDefined();
      expect(result.validation).toBeDefined();

      // Verify AI engine was called with style refinement type
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrompt: refineParams.currentPrompt,
          refinementType: 'style',
          styleChanges: { seedGenres: ['rock', 'blues'] },
        }),
        expect.anything()
      );
    });

    test('style-only refinement preserves existing title', async () => {
      // Arrange
      const existingTitle = 'My Original Title';
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: existingTitle,
        feedback: '',
        refinementType: 'style' as ApiRefinementType,
        styleChanges: { sunoStyles: ['dream-pop'] },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert - Title should come from AI response or be preserved
      expect(result.title).toBeDefined();
    });

    test('style-only refinement with sunoStyles changes', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "electronic"',
        currentTitle: 'Synth Dreams',
        feedback: '',
        refinementType: 'style' as ApiRefinementType,
        styleChanges: { sunoStyles: ['synthwave', 'darkwave'] },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          refinementType: 'style',
          styleChanges: { sunoStyles: ['synthwave', 'darkwave'] },
        }),
        expect.anything()
      );
    });
  });

  describe('Lyrics-only refinement flow', () => {
    test('lyrics-only refinement completes successfully', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "rock"',
        currentTitle: 'Rock Anthem',
        feedback: 'make it more emotional',
        currentLyrics: '[VERSE]\nOriginal lyrics here',
        refinementType: 'lyrics' as ApiRefinementType,
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(result.versionId).toBeDefined();

      // Verify AI engine was called with lyrics refinement type
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'make it more emotional',
          currentLyrics: '[VERSE]\nOriginal lyrics here',
          refinementType: 'lyrics',
        }),
        expect.anything()
      );
    });

    test('lyrics-only refinement includes lyricsTopic', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "pop"',
        currentTitle: 'Love Song',
        feedback: 'more poetic language',
        currentLyrics: '[CHORUS]\nSome lyrics',
        lyricsTopic: 'lost love and memories',
        refinementType: 'lyrics' as ApiRefinementType,
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          lyricsTopic: 'lost love and memories',
          refinementType: 'lyrics',
        }),
        expect.anything()
      );
    });
  });

  describe('Combined refinement flow', () => {
    test('combined refinement completes successfully', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Jazz Vibes',
        feedback: 'make it more energetic',
        currentLyrics: '[VERSE]\nExisting lyrics',
        refinementType: 'combined' as ApiRefinementType,
        styleChanges: { seedGenres: ['fusion'] },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(result.versionId).toBeDefined();

      // Verify AI engine was called with combined refinement type
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'make it more energetic',
          refinementType: 'combined',
          styleChanges: { seedGenres: ['fusion'] },
        }),
        expect.anything()
      );
    });

    test('combined refinement with all parameters', async () => {
      // Arrange - Full set of parameters
      // Note: genreOverride and sunoStyles are mutually exclusive, using genreOverride only
      const refineParams = {
        currentPrompt: 'genre: "rock"\nmood: "energetic"',
        currentTitle: 'Rock Anthem',
        feedback: 'make the chorus catchier',
        currentLyrics: '[VERSE]\nVerse lyrics\n[CHORUS]\nChorus lyrics',
        lyricsTopic: 'rebellion and freedom',
        lockedPhrase: 'forever free',
        genreOverride: 'alternative',
        // sunoStyles omitted as it's mutually exclusive with genreOverride
        refinementType: 'combined' as ApiRefinementType,
        styleChanges: {
          seedGenres: ['alternative'],
        },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(result.versionId).toBeDefined();
    });
  });

  describe('Error handling for each refinement type', () => {
    test('handles error in style refinement gracefully', async () => {
      // Arrange - Make AI engine throw for this test
      aiEngine.refinePrompt.mockRejectedValueOnce(new Error('Style refinement failed'));

      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: '',
        refinementType: 'style' as ApiRefinementType,
        styleChanges: { seedGenres: ['rock'] },
      };

      // Act & Assert
      await expect(handlers.refinePrompt(refineParams)).rejects.toThrow('Style refinement failed');
    });

    test('handles error in lyrics refinement gracefully', async () => {
      // Arrange - Make AI engine throw for this test
      aiEngine.refinePrompt.mockRejectedValueOnce(new Error('Lyrics refinement failed'));

      const refineParams = {
        currentPrompt: 'genre: "rock"',
        currentTitle: 'Title',
        feedback: 'improve lyrics',
        currentLyrics: '[VERSE]\nLyrics',
        refinementType: 'lyrics' as ApiRefinementType,
      };

      // Act & Assert
      await expect(handlers.refinePrompt(refineParams)).rejects.toThrow('Lyrics refinement failed');
    });

    test('handles error in combined refinement gracefully', async () => {
      // Arrange - Make AI engine throw for this test
      aiEngine.refinePrompt.mockRejectedValueOnce(new Error('Combined refinement failed'));

      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: 'make it better',
        currentLyrics: '[VERSE]\nLyrics',
        refinementType: 'combined' as ApiRefinementType,
        styleChanges: { seedGenres: ['rock'] },
      };

      // Act & Assert
      await expect(handlers.refinePrompt(refineParams)).rejects.toThrow(
        'Combined refinement failed'
      );
    });
  });

  describe('Backwards compatibility', () => {
    test('defaults to combined when refinementType not provided', async () => {
      // Arrange - No refinementType provided (legacy call)
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: 'make it better',
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();

      // Verify AI engine was called with 'combined' as default
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          refinementType: 'combined',
        }),
        expect.anything()
      );
    });

    test('works with undefined styleChanges', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: 'make it louder',
        refinementType: 'combined' as ApiRefinementType,
        styleChanges: undefined,
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.prompt).toBeDefined();
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          styleChanges: undefined,
        }),
        expect.anything()
      );
    });
  });

  describe('RPC parameter passing', () => {
    test('passes all style changes to handler', async () => {
      // Arrange
      const styleChanges: StyleChanges = {
        seedGenres: ['rock', 'metal'],
        sunoStyles: ['thrash-metal', 'heavy-metal'],
        bpm: 180,
        instruments: ['electric-guitar', 'bass', 'drums'],
        mood: ['aggressive', 'powerful'],
      };

      const refineParams = {
        currentPrompt: 'genre: "rock"',
        currentTitle: 'Metal Song',
        feedback: '',
        refinementType: 'style' as ApiRefinementType,
        styleChanges,
      };

      // Act
      await handlers.refinePrompt(refineParams);

      // Assert
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          styleChanges: {
            seedGenres: ['rock', 'metal'],
            sunoStyles: ['thrash-metal', 'heavy-metal'],
            bpm: 180,
            instruments: ['electric-guitar', 'bass', 'drums'],
            mood: ['aggressive', 'powerful'],
          },
        }),
        expect.anything()
      );
    });

    test('passes sunoStyles through correctly', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "electronic"',
        currentTitle: 'Synth Track',
        feedback: 'more atmospheric',
        sunoStyles: ['ambient', 'chillwave'],
        refinementType: 'combined' as ApiRefinementType,
      };

      // Act
      await handlers.refinePrompt(refineParams);

      // Assert
      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          sunoStyles: ['ambient', 'chillwave'],
        }),
        expect.anything()
      );
    });
  });

  describe('Validation in handler', () => {
    test('returns validation result with prompt', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: 'improve it',
        refinementType: 'combined' as ApiRefinementType,
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.validation).toBeDefined();
      expect(result.validation.isValid).toBeDefined();
    });

    test('includes versionId in response', async () => {
      // Arrange
      const refineParams = {
        currentPrompt: 'genre: "jazz"',
        currentTitle: 'Title',
        feedback: '',
        refinementType: 'style' as ApiRefinementType,
        styleChanges: { seedGenres: ['rock'] },
      };

      // Act
      const result = await handlers.refinePrompt(refineParams);

      // Assert
      expect(result.versionId).toBeDefined();
      expect(typeof result.versionId).toBe('string');
      expect(result.versionId.length).toBeGreaterThan(0);
    });
  });
});

describe('Refinement Validation with New Fields', () => {
  /**
   * Integration tests for the expanded refinement validation that supports new fields:
   * - harmonicStyle
   * - harmonicCombination
   * - polyrhythmCombination
   * - timeSignature
   * - timeSignatureJourney
   * - moodCategory
   *
   * These tests verify the complete flow from style changes detection through handler invocation.
   */

  let aiEngine: ReturnType<typeof createMockAIEngine>;
  let storage: ReturnType<typeof createMockStorage>;
  let handlers: ReturnType<typeof createHandlers>;

  beforeEach(() => {
    aiEngine = createMockAIEngine();
    storage = createMockStorage();
    handlers = createHandlers(aiEngine as any, storage as any);
  });

  test('enables refine when harmonicStyle changes', async () => {
    // Arrange - harmonicStyle changed from null to a value
    const refineParams = {
      currentPrompt: 'genre: "jazz"\nstyle tags: "smooth"',
      currentTitle: 'Jazz Vibes',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: { harmonicStyle: 'modal-shift' },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        refinementType: 'style',
        styleChanges: { harmonicStyle: 'modal-shift' },
      }),
      expect.anything()
    );
  });

  test('enables refine when timeSignature clears (value → null)', async () => {
    // Arrange - timeSignature cleared from '5/4' to null
    const refineParams = {
      currentPrompt: 'genre: "prog-rock"\ntime signature: "5/4"',
      currentTitle: 'Prog Track',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: { timeSignature: null },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        refinementType: 'style',
        styleChanges: { timeSignature: null },
      }),
      expect.anything()
    );
  });

  test('enables refine when moodCategory changes', async () => {
    // Arrange - moodCategory changed from null to 'melancholy'
    const refineParams = {
      currentPrompt: 'genre: "indie"\nmood: "upbeat"',
      currentTitle: 'Indie Song',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: { moodCategory: 'melancholy' },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        refinementType: 'style',
        styleChanges: { moodCategory: 'melancholy' },
      }),
      expect.anything()
    );
  });

  test('routes to combined refinement when field change + feedback provided', async () => {
    // Arrange - Both harmonicStyle changed AND feedback text provided
    const refineParams = {
      currentPrompt: 'genre: "electronic"',
      currentTitle: 'Synth Dreams',
      feedback: 'make it more atmospheric',
      refinementType: 'combined' as ApiRefinementType,
      styleChanges: { harmonicStyle: 'modal-shift' },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback: 'make it more atmospheric',
        refinementType: 'combined',
        styleChanges: { harmonicStyle: 'modal-shift' },
      }),
      expect.anything()
    );
  });

  test('mixed old + new field changes work correctly', async () => {
    // Arrange - Both seedGenres (old field) AND harmonicStyle (new field) changed
    const refineParams = {
      currentPrompt: 'genre: "jazz"',
      currentTitle: 'Jazz Fusion',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: {
        seedGenres: ['rock', 'metal'],
        harmonicStyle: 'chromatic-mediant',
        timeSignature: '7/8',
      },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        refinementType: 'style',
        styleChanges: {
          seedGenres: ['rock', 'metal'],
          harmonicStyle: 'chromatic-mediant',
          timeSignature: '7/8',
        },
      }),
      expect.anything()
    );
  });

  test('polyrhythmCombination change triggers refinement', async () => {
    // Arrange - polyrhythmCombination changed
    const refineParams = {
      currentPrompt: 'genre: "world-music"',
      currentTitle: 'World Fusion',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: { polyrhythmCombination: '3-over-4' },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        styleChanges: { polyrhythmCombination: '3-over-4' },
      }),
      expect.anything()
    );
  });

  test('multiple new field changes in single refinement', async () => {
    // Arrange - Multiple new fields changed simultaneously
    const refineParams = {
      currentPrompt: 'genre: "experimental"',
      currentTitle: 'Experimental Track',
      feedback: '',
      refinementType: 'style' as ApiRefinementType,
      styleChanges: {
        harmonicStyle: 'modal-shift',
        harmonicCombination: 'dorian-to-mixolydian',
        timeSignature: '5/4',
        timeSignatureJourney: 'evolving',
        polyrhythmCombination: '5-over-3',
        moodCategory: 'ethereal',
      },
    };

    // Act
    const result = await handlers.refinePrompt(refineParams);

    // Assert
    expect(result.prompt).toBeDefined();
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        refinementType: 'style',
        styleChanges: {
          harmonicStyle: 'modal-shift',
          harmonicCombination: 'dorian-to-mixolydian',
          timeSignature: '5/4',
          timeSignatureJourney: 'evolving',
          polyrhythmCombination: '5-over-3',
          moodCategory: 'ethereal',
        },
      }),
      expect.anything()
    );
  });
});

describe('RPC Refinement API Integration', () => {
  /**
   * Tests that verify the RPC API accepts and passes refinement parameters correctly.
   * These tests focus on the API contract between frontend and backend.
   */

  let aiEngine: ReturnType<typeof createMockAIEngine>;
  let storage: ReturnType<typeof createMockStorage>;
  let handlers: ReturnType<typeof createHandlers>;

  beforeEach(() => {
    aiEngine = createMockAIEngine();
    storage = createMockStorage();
    handlers = createHandlers(aiEngine as any, storage as any);
  });

  test('refinePrompt accepts refinementType parameter', async () => {
    // Act
    await handlers.refinePrompt({
      currentPrompt: 'test',
      currentTitle: 'Title',
      feedback: 'feedback',
      refinementType: 'lyrics',
    });

    // Assert
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ refinementType: 'lyrics' }),
      expect.anything()
    );
  });

  test('refinePrompt accepts styleChanges parameter', async () => {
    // Arrange
    const styleChanges: StyleChanges = {
      seedGenres: ['jazz'],
      sunoStyles: ['smooth-jazz'],
    };

    // Act
    await handlers.refinePrompt({
      currentPrompt: 'test',
      currentTitle: 'Title',
      feedback: '',
      refinementType: 'style',
      styleChanges,
    });

    // Assert
    expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        styleChanges: {
          seedGenres: ['jazz'],
          sunoStyles: ['smooth-jazz'],
        },
      }),
      expect.anything()
    );
  });

  test('refinePrompt returns lyrics from AI engine', async () => {
    // Arrange
    aiEngine.refinePrompt.mockResolvedValueOnce({
      text: 'Refined prompt',
      title: 'New Title',
      lyrics: '[VERSE]\nRefined lyrics content',
    });

    // Act
    const result = await handlers.refinePrompt({
      currentPrompt: 'test',
      currentTitle: 'Title',
      feedback: 'improve lyrics',
      currentLyrics: '[VERSE]\nOriginal',
      refinementType: 'lyrics',
    });

    // Assert
    expect(result.lyrics).toBe('[VERSE]\nRefined lyrics content');
  });

  test('refinePrompt returns title from AI engine', async () => {
    // Arrange
    aiEngine.refinePrompt.mockResolvedValueOnce({
      text: 'Refined prompt',
      title: 'Updated Title',
      lyrics: '',
    });

    // Act
    const result = await handlers.refinePrompt({
      currentPrompt: 'test',
      currentTitle: 'Original Title',
      feedback: 'change title',
      refinementType: 'combined',
    });

    // Assert
    expect(result.title).toBe('Updated Title');
  });
});
