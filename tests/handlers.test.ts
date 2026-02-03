import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";

import { APP_CONSTANTS } from "@shared/constants";
import { type PromptSession, type AppConfig, DEFAULT_API_KEYS } from "@shared/types";

// Mock the AI SDK for handler tests (same as max-conversion.test.ts)
const mockGenerateText = mock(async () => ({
  text: '{"styleTags": "raw, energetic", "recording": "studio session"}',
}));
const mockCreateProviderRegistry = mock(() => ({
  languageModel: () => ({}),
}));

let createHandlers: typeof import("@bun/handlers").createHandlers;

beforeEach(async () => {
  await mock.module("ai", () => ({
    generateText: mockGenerateText,
    createProviderRegistry: mockCreateProviderRegistry,
    experimental_createProviderRegistry: mockCreateProviderRegistry,
  }));

  ({ createHandlers } = await import("@bun/handlers"));
});

afterEach(() => {
  mock.restore();
});

// Mock AIEngine
function createMockAIEngine() {
  return {
    generateInitial: mock(() => Promise.resolve({ text: "Generated prompt", title: "Title", lyrics: "Lyrics" })),
    refinePrompt: mock(() => Promise.resolve({ text: "Refined prompt", title: "Title", lyrics: "Lyrics" })),
    remixInstruments: mock(() => Promise.resolve({ text: "Remixed instruments" })),
    remixGenre: mock(() => Promise.resolve({ text: "Remixed genre" })),
    remixMood: mock(() => Promise.resolve({ text: "Remixed mood" })),
    remixStyleTags: mock(() => Promise.resolve({ text: "Remixed style tags" })),
    remixRecording: mock(() => Promise.resolve({ text: "Remixed recording" })),
    remixTitle: mock(() => Promise.resolve({ title: "New Title" })),
    remixLyrics: mock(() => Promise.resolve({ lyrics: "New Lyrics" })),
    generateQuickVibes: mock(() => Promise.resolve({ text: "Quick vibes prompt" })),
    refineQuickVibes: mock(() => Promise.resolve({ text: "Refined quick vibes" })),
    generateCreativeBoost: mock(() => Promise.resolve({ text: "Creative boost prompt", title: "Creative Title", lyrics: "Creative lyrics" })),
    refineCreativeBoost: mock(() => Promise.resolve({ text: "Refined creative boost", title: "Refined Title", lyrics: "Refined lyrics" })),
    setProvider: mock(() => {}),
    setApiKey: mock(() => {}),
    setModel: mock(() => {}),
    setUseSunoTags: mock(() => {}),
    setDebugMode: mock(() => {}),
    setMaxMode: mock(() => {}),
    setUseLocalLLM: mock(() => {}),
    setLyricsMode: mock(() => {}),
    setStoryMode: mock(() => {}),
    getModel: mock(() => ({} as any)),
    isDebugMode: mock(() => false),
  };
}

// Mock StorageManager
function createMockStorage() {
  let sessions: PromptSession[] = [];
  let config: AppConfig = {
    provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
    apiKeys: { ...DEFAULT_API_KEYS },
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: true,
    debugMode: false,
    maxMode: false,
    lyricsMode: false,
    storyMode: false,
    useLocalLLM: false,
    promptMode: "full",
    creativeBoostMode: "simple",
  };

  return {
    getHistory: mock(() => Promise.resolve(sessions)),
    saveSession: mock((session: PromptSession) => {
      sessions = sessions.filter(s => s.id !== session.id);
      sessions.unshift(session);
      return Promise.resolve();
    }),
    deleteSession: mock((id: string) => {
      sessions = sessions.filter(s => s.id !== id);
      return Promise.resolve();
    }),
    getConfig: mock(() => Promise.resolve(config)),
    saveConfig: mock((updates: Partial<AppConfig>) => {
      config = { ...config, ...updates };
      return Promise.resolve();
    }),
    // For test access
    _getSessions: () => sessions,
    _getConfig: () => config,
  };
}

describe("RPC Handlers", () => {
  describe("generation handlers", () => {
    test("generateInitial returns prompt with validation", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.generateInitial({
        description: "A sad song about rain",
        lockedPhrase: undefined,
        lyricsTopic: undefined,
        genreOverride: undefined,
      });

      expect(result.prompt).toBe("Generated prompt");
      expect(result.title).toBe("Title");
      expect(result.versionId).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(aiEngine.generateInitial).toHaveBeenCalled();
    });

    test("refinePrompt passes all parameters to engine", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await handlers.refinePrompt({
        currentPrompt: "Current prompt",
        feedback: "Make it happier",
        lockedPhrase: "locked",
        currentTitle: "Old Title",
        currentLyrics: "Old lyrics",
        lyricsTopic: "topic",
        genreOverride: "jazz",
        refinementType: "combined",
        styleChanges: { seedGenres: ["jazz"] },
      });

      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        {
          currentPrompt: "Current prompt",
          currentTitle: "Old Title",
          feedback: "Make it happier",
          currentLyrics: "Old lyrics",
          lockedPhrase: "locked",
          lyricsTopic: "topic",
          genreOverride: "jazz",
          sunoStyles: [],
          refinementType: "combined",
          styleChanges: { seedGenres: ["jazz"] },
        },
        expect.anything()
      );
    });
  });

  describe("remix handlers", () => {
    test("remixGenre returns remixed prompt with new genre", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Provide a valid prompt with a genre that can be remixed
      const result = await handlers.remixGenre({
        currentPrompt: 'genre: "jazz"\nbpm: "96"',
      });

      // Deterministic remix - expect a valid result structure
      expect(result.prompt).toBeDefined();
      expect(typeof result.prompt).toBe("string");
      expect(result.versionId).toBeDefined();
      expect(result.validation).toBeDefined();
      // Note: AIEngine.remixGenre is no longer called - handlers use deterministic functions directly
    });

    test("remixTitle returns deterministic title", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Provide a valid prompt with genre and mood for title generation
      const result = await handlers.remixTitle({
        currentPrompt: 'genre: "jazz"\nmood: "smooth"',
        originalInput: "original",
      });

      // Deterministic title generation - expect a valid title string
      expect(result.title).toBeDefined();
      expect(typeof result.title).toBe("string");
      expect(result.title.length).toBeGreaterThan(0);
      // Note: AIEngine.remixTitle is no longer called - handlers use deterministic functions directly
    });
  });

  describe("session handlers", () => {
    test("getHistory returns sessions from storage", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getHistory({});

      expect(result.sessions).toEqual([]);
      expect(storage.getHistory).toHaveBeenCalled();
    });

    test("saveSession calls storage.saveSession", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const session: PromptSession = {
        id: "test-id",
        originalInput: "test",
        currentPrompt: "prompt",
        versionHistory: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      };

      const result = await handlers.saveSession({ session });

      expect(result.success).toBe(true);
      expect(storage.saveSession).toHaveBeenCalledWith(session);
    });

    test("deleteSession calls storage.deleteSession", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const sessionId = Bun.randomUUIDv7();
      const result = await handlers.deleteSession({ id: sessionId });

      expect(result.success).toBe(true);
      expect(storage.deleteSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe("settings handlers", () => {
    test("getModel returns cloud model when useLocalLLM is false", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getModel({});

      expect(result.model).toBe(APP_CONSTANTS.AI.DEFAULT_MODEL);
    });

    test("getModel returns Ollama model when useLocalLLM is true with configured model", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      // Set useLocalLLM to true and configure an Ollama model
      await storage.saveConfig({ useLocalLLM: true, ollamaModel: "llama3:8b" });
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getModel({});

      expect(result.model).toBe("llama3:8b");
    });

    test("getModel returns default Ollama model when useLocalLLM is true but ollamaModel is undefined", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      // Set useLocalLLM to true without configuring ollamaModel
      await storage.saveConfig({ useLocalLLM: true, ollamaModel: undefined });
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getModel({});

      expect(result.model).toBe(APP_CONSTANTS.OLLAMA.DEFAULT_MODEL);
    });

    test("setModel updates config and engine", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.setModel({ model: "new-model" });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({ model: "new-model" });
      expect(aiEngine.setModel).toHaveBeenCalledWith("new-model");
    });

    test("getAllSettings returns all config values", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getAllSettings({});

      expect(result.provider).toBe(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
      expect(result.model).toBe(APP_CONSTANTS.AI.DEFAULT_MODEL);
      expect(result.useSunoTags).toBe(true);
      expect(result.debugMode).toBe(false);
    });

    test("saveAllSettings updates config and engine", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await handlers.saveAllSettings({
        provider: "openai",
        apiKeys: { groq: null, openai: "sk-test", anthropic: null },
        model: "gpt-5",
        useSunoTags: false,
        debugMode: true,
        maxMode: true,
        lyricsMode: true,
        storyMode: false,
        useLocalLLM: false,
      });

      expect(storage.saveConfig).toHaveBeenCalled();
      expect(aiEngine.setProvider).toHaveBeenCalledWith("openai");
      expect(aiEngine.setModel).toHaveBeenCalledWith("gpt-5");
      expect(aiEngine.setUseSunoTags).toHaveBeenCalledWith(false);
      expect(aiEngine.setDebugMode).toHaveBeenCalledWith(true);
      expect(aiEngine.setMaxMode).toHaveBeenCalledWith(true);
      expect(aiEngine.setLyricsMode).toHaveBeenCalledWith(true);
      expect(aiEngine.setStoryMode).toHaveBeenCalledWith(false);
      expect(aiEngine.setUseLocalLLM).toHaveBeenCalledWith(false);
    });
  });

  // ============================================================================
  // Task 5.2: Creative Boost Mode Persistence Integration Tests
  // ============================================================================

  describe("creative boost mode handlers", () => {
    test("getCreativeBoostMode returns default 'simple' when no persisted value", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getCreativeBoostMode({});

      expect(result.creativeBoostMode).toBe("simple");
    });

    test("setCreativeBoostMode persists value to storage", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.setCreativeBoostMode({ creativeBoostMode: "advanced" });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({ creativeBoostMode: "advanced" });
    });

    test("getCreativeBoostMode returns persisted value after set", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Set the mode
      await handlers.setCreativeBoostMode({ creativeBoostMode: "advanced" });

      // Get the mode
      const result = await handlers.getCreativeBoostMode({});

      expect(result.creativeBoostMode).toBe("advanced");
    });

    test("setCreativeBoostMode to 'simple' persists correctly", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // First set to advanced
      await handlers.setCreativeBoostMode({ creativeBoostMode: "advanced" });
      
      // Then set back to simple
      const result = await handlers.setCreativeBoostMode({ creativeBoostMode: "simple" });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenLastCalledWith({ creativeBoostMode: "simple" });
    });

    test("creativeBoostMode persists independently of promptMode", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Set creative boost mode to advanced
      await handlers.setCreativeBoostMode({ creativeBoostMode: "advanced" });

      // Set prompt mode (this should not affect creative boost mode)
      await handlers.setPromptMode({ promptMode: "quickVibes" });

      // Get creative boost mode - should still be advanced
      const result = await handlers.getCreativeBoostMode({});
      expect(result.creativeBoostMode).toBe("advanced");

      // Get prompt mode - should be quickVibes
      const promptModeResult = await handlers.getPromptMode({});
      expect(promptModeResult.promptMode).toBe("quickVibes");
    });
  });

  describe("quick vibes handlers", () => {
    test("generateQuickVibes returns prompt", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.generateQuickVibes({
        category: "lofi-study",
        customDescription: "relaxing",
        
        sunoStyles: [],
      });

      expect(result.prompt).toBe("Quick vibes prompt");
      expect(result.versionId).toBeDefined();
      expect(aiEngine.generateQuickVibes).toHaveBeenCalledWith("lofi-study", "relaxing", [], expect.anything());
    });
  });

  // ============================================================================
  // Task 5.5: Handler Integration Test - convertToMaxFormat
  // ============================================================================

  describe("convertToMaxFormat handler", () => {
    beforeEach(() => {
      mockGenerateText.mockClear();
      mockGenerateText.mockImplementation(async () => ({
        text: '{"styleTags": "raw, energetic", "recording": "studio session"}',
      }));
    });

    test("returns correct response structure", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.convertToMaxFormat({
        text: "Genre: Rock\nMood: energetic\nInstruments: guitar, drums",
      });

      expect(result).toHaveProperty("convertedPrompt");
      expect(result).toHaveProperty("wasConverted");
      expect(result).toHaveProperty("versionId");
      expect(result.convertedPrompt).toContain("[Is_MAX_MODE: MAX](MAX)");
      expect(result.wasConverted).toBe(true);
    });

    test("versionId is generated", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.convertToMaxFormat({
        text: "A simple music prompt",
      });

      expect(result.versionId).toBeDefined();
      expect(typeof result.versionId).toBe("string");
      expect(result.versionId.length).toBeGreaterThan(0);
    });

    test("converts standard prompt and uses AI", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await handlers.convertToMaxFormat({ text: "Genre: Jazz\nMood: chill" });

      // AI should be called for conversion
      expect(mockGenerateText).toHaveBeenCalled();
    });

    test("returns wasConverted false for already-max-format prompts", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const maxFormatPrompt = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "jazz"
bpm: "110"`;

      const result = await handlers.convertToMaxFormat({
        text: maxFormatPrompt,
      });

      expect(result.wasConverted).toBe(false);
      expect(result.convertedPrompt).toBe(maxFormatPrompt);
      // AI should NOT be called for already-max format
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    test("includes all required max format fields in output", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.convertToMaxFormat({
        text: "Genre: Electronic\nMood: energetic",
      });

      expect(result.convertedPrompt).toContain("[Is_MAX_MODE: MAX](MAX)");
      expect(result.convertedPrompt).toContain("[QUALITY: MAX](MAX)");
      expect(result.convertedPrompt).toContain("[REALISM: MAX](MAX)");
      expect(result.convertedPrompt).toContain("[REAL_INSTRUMENTS: MAX](MAX)");
      expect(result.convertedPrompt).toContain('genre:');
      expect(result.convertedPrompt).toContain('bpm:');
      expect(result.convertedPrompt).toContain('instruments:');
      expect(result.convertedPrompt).toContain('style tags:');
      expect(result.convertedPrompt).toContain('recording:');
    });
  });

  describe("validation error handling", () => {
    test("generateQuickVibes throws ValidationError for both category and sunoStyles", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.generateQuickVibes({
        category: "lofi-study",
        customDescription: "",
        
        sunoStyles: ["dream-pop"],
      })).rejects.toThrow("Cannot use both Category and Suno V5 Styles");
    });

    test("generateQuickVibes throws ValidationError for too many sunoStyles", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.generateQuickVibes({
        category: null,
        customDescription: "",
        
        sunoStyles: ["a", "b", "c", "d", "e"], // 5 is too many
      })).rejects.toThrow("Maximum 4 Suno V5 styles allowed");
    });

    test("refineQuickVibes throws ValidationError for both category and sunoStyles", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.refineQuickVibes({
        currentPrompt: "test",
        feedback: "make it better",
        
        category: "lofi-study",
        sunoStyles: ["dream-pop"],
      })).rejects.toThrow("Cannot use both Category and Suno V5 Styles");
    });

    test("generateCreativeBoost throws ValidationError for invalid creativityLevel", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.generateCreativeBoost({
        creativityLevel: 42 as any, // Invalid value
        seedGenres: [],
        sunoStyles: [],
        description: "",
        lyricsTopic: "",
        
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Invalid creativity level");
    });

    test("generateCreativeBoost throws ValidationError for too many seedGenres", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.generateCreativeBoost({
        creativityLevel: 50,
        seedGenres: ["a", "b", "c", "d", "e"],
        sunoStyles: [],
        description: "",
        lyricsTopic: "",
        
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Maximum 4 seed genres allowed");
    });

    test("generateCreativeBoost throws ValidationError for both seedGenres and sunoStyles", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.generateCreativeBoost({
        creativityLevel: 50,
        seedGenres: ["jazz"],
        sunoStyles: ["dream-pop"],
        description: "",
        lyricsTopic: "",
        
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Cannot use both Seed Genres and Suno V5 Styles");
    });

    test("refineCreativeBoost throws ValidationError for missing currentPrompt", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.refineCreativeBoost({
        currentPrompt: "",
        currentTitle: "Title",
        feedback: "make it better",
        lyricsTopic: "",
        description: "",
        seedGenres: [],
        sunoStyles: [],
        
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Current prompt is required for refinement");
    });

    test("refineCreativeBoost allows empty feedback", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Empty feedback is allowed - will regenerate with current settings
      const result = await handlers.refineCreativeBoost({
        currentPrompt: "test prompt",
        currentTitle: "Test Title",
        feedback: "",  // Empty feedback is allowed
        lyricsTopic: "",
        description: "",
        seedGenres: [],
        sunoStyles: [],
        
        maxMode: false,
        withLyrics: false,
      });

      expect(result.prompt).toBe("Refined creative boost");
      expect(result.title).toBe("Refined Title");
      expect(result.versionId).toBeDefined();
      expect(aiEngine.refineCreativeBoost).toHaveBeenCalled();
    });

    test("refineCreativeBoost allows feedback to be provided in Direct Mode", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Should work normally with feedback in Direct Mode
      const result = await handlers.refineCreativeBoost({
        currentPrompt: "dream-pop, shoegaze",
        currentTitle: "Dreamy Title",
        feedback: "make it darker",  // With feedback
        lyricsTopic: "",
        description: "",
        seedGenres: [],
        sunoStyles: ["dream-pop", "shoegaze"],  // Direct Mode
        
        maxMode: false,
        withLyrics: false,
      });

      expect(result.prompt).toBe("Refined creative boost");
      expect(result.title).toBe("Refined Title");
      expect(result.versionId).toBeDefined();
      expect(aiEngine.refineCreativeBoost).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Task 5.2: Story Mode Settings Persistence Tests
  // ============================================================================

  describe("story mode handlers", () => {
    test("getStoryMode returns default false when no persisted value", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getStoryMode({});

      expect(result.storyMode).toBe(false);
    });

    test("setStoryMode persists value to storage", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.setStoryMode({ storyMode: true });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({ storyMode: true });
    });

    test("setStoryMode updates AI engine state", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await handlers.setStoryMode({ storyMode: true });

      expect(aiEngine.setStoryMode).toHaveBeenCalledWith(true);
    });

    test("getStoryMode returns persisted value after set", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Set story mode to true
      await handlers.setStoryMode({ storyMode: true });

      // Get story mode - should be true
      const result = await handlers.getStoryMode({});

      expect(result.storyMode).toBe(true);
    });

    test("setStoryMode to false persists correctly", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // First set to true
      await handlers.setStoryMode({ storyMode: true });

      // Then set back to false
      const result = await handlers.setStoryMode({ storyMode: false });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenLastCalledWith({ storyMode: false });
      expect(aiEngine.setStoryMode).toHaveBeenLastCalledWith(false);
    });

    test("storyMode persists independently of other modes", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Set story mode to true
      await handlers.setStoryMode({ storyMode: true });

      // Set max mode (should not affect story mode)
      await handlers.setMaxMode({ maxMode: true });

      // Set lyrics mode (should not affect story mode)
      await handlers.setLyricsMode({ lyricsMode: true });

      // Get story mode - should still be true
      const result = await handlers.getStoryMode({});
      expect(result.storyMode).toBe(true);
    });

    test("getAllSettings includes storyMode", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      // Set story mode
      await handlers.setStoryMode({ storyMode: true });

      // Get all settings
      const result = await handlers.getAllSettings({});

      expect(result.storyMode).toBe(true);
    });

    test("saveAllSettings updates storyMode", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await handlers.saveAllSettings({
        provider: "groq",
        apiKeys: { groq: "test-key", openai: null, anthropic: null },
        model: "test-model",
        useSunoTags: true,
        debugMode: false,
        maxMode: false,
        lyricsMode: false,
        storyMode: true,
        useLocalLLM: false,
      });

      expect(aiEngine.setStoryMode).toHaveBeenCalledWith(true);
    });
  });
});
