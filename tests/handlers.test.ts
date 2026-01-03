import { describe, expect, test, mock } from "bun:test";
import { createHandlers } from "@bun/handlers";
import { type PromptSession, type AppConfig, DEFAULT_API_KEYS } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";

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
      });

      expect(result.prompt).toBe("Quick vibes prompt");
      expect(result.versionId).toBeDefined();
      expect(aiEngine.generateQuickVibes).toHaveBeenCalledWith("lofi-study", "relaxing", true);
    });
  });
});
