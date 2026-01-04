import { describe, expect, test, mock, beforeEach } from "bun:test";

import { createHandlers } from "@bun/handlers";
import { APP_CONSTANTS } from "@shared/constants";
import { type PromptSession, type AppConfig, DEFAULT_API_KEYS } from "@shared/types";

// Mock the AI SDK for handler tests (same as max-conversion.test.ts)
const mockGenerateText = mock(async () => ({
  text: '{"styleTags": "raw, energetic", "recording": "studio session"}',
}));

mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

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
    setProvider: mock(() => {}),
    setApiKey: mock(() => {}),
    setModel: mock(() => {}),
    setUseSunoTags: mock(() => {}),
    setDebugMode: mock(() => {}),
    setMaxMode: mock(() => {}),
    setLyricsMode: mock(() => {}),
    getModel: mock(() => ({} as any)),
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
    promptMode: "full",
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
      });

      expect(aiEngine.refinePrompt).toHaveBeenCalledWith(
        "Current prompt",
        "Make it happier",
        "locked",
        "Old Title",
        "Old lyrics",
        "topic",
        "jazz"
      );
    });
  });

  describe("remix handlers", () => {
    test("remixGenre returns remixed prompt", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.remixGenre({ currentPrompt: "test" });

      expect(result.prompt).toBe("Remixed genre");
      expect(result.versionId).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    test("remixTitle returns new title", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.remixTitle({
        currentPrompt: "test",
        originalInput: "original",
      });

      expect(result.title).toBe("New Title");
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

      const result = await handlers.deleteSession({ id: "test-id" });

      expect(result.success).toBe(true);
      expect(storage.deleteSession).toHaveBeenCalledWith("test-id");
    });
  });

  describe("settings handlers", () => {
    test("getModel returns model from config", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      const result = await handlers.getModel({});

      expect(result.model).toBe(APP_CONSTANTS.AI.DEFAULT_MODEL);
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
      });

      expect(storage.saveConfig).toHaveBeenCalled();
      expect(aiEngine.setProvider).toHaveBeenCalledWith("openai");
      expect(aiEngine.setModel).toHaveBeenCalledWith("gpt-5");
      expect(aiEngine.setUseSunoTags).toHaveBeenCalledWith(false);
      expect(aiEngine.setDebugMode).toHaveBeenCalledWith(true);
      expect(aiEngine.setMaxMode).toHaveBeenCalledWith(true);
      expect(aiEngine.setLyricsMode).toHaveBeenCalledWith(true);
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
        withWordlessVocals: true,
        sunoStyles: [],
      });

      expect(result.prompt).toBe("Quick vibes prompt");
      expect(result.versionId).toBeDefined();
      expect(aiEngine.generateQuickVibes).toHaveBeenCalledWith("lofi-study", "relaxing", true, []);
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
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
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Current prompt is required for refinement");
    });

    test("refineCreativeBoost throws ValidationError for missing feedback", async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createHandlers(aiEngine as any, storage as any);

      await expect(handlers.refineCreativeBoost({
        currentPrompt: "test prompt",
        currentTitle: "Title",
        feedback: "",
        lyricsTopic: "",
        description: "",
        seedGenres: [],
        sunoStyles: [],
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      })).rejects.toThrow("Feedback is required for refinement");
    });
  });
});
