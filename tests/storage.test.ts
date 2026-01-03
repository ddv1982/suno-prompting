import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { tmpdir } from "os";
import { rm, mkdir } from "fs/promises";
import { type PromptSession } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";

// Create a testable version of StorageManager with custom paths
class TestableStorageManager {
  private baseDir: string;
  private historyPath: string;
  private configPath: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.historyPath = join(this.baseDir, "history.json");
    this.configPath = join(this.baseDir, "config.json");
  }

  async initialize() {
    await mkdir(this.baseDir, { recursive: true });
  }

  async getHistory(): Promise<PromptSession[]> {
    try {
      const file = Bun.file(this.historyPath);
      if (!(await file.exists())) {
        return [];
      }
      const sessions = await file.json();
      return sessions;
    } catch {
      return [];
    }
  }

  async saveHistory(sessions: PromptSession[]) {
    await Bun.write(this.historyPath, JSON.stringify(sessions, null, 2));
  }

  async saveSession(session: PromptSession) {
    const history = await this.getHistory();
    const filtered = history.filter((s) => s.id !== session.id);
    const updated = [session, ...filtered];
    await this.saveHistory(updated);
  }

  async deleteSession(id: string) {
    const history = await this.getHistory();
    const filtered = history.filter((s) => s.id !== id);
    await this.saveHistory(filtered);
  }

  async getConfig() {
    try {
      const file = Bun.file(this.configPath);
      if (!(await file.exists())) {
        return {
          provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
          apiKeys: { groq: null, openai: null, anthropic: null },
          model: APP_CONSTANTS.AI.DEFAULT_MODEL,
          useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS,
          debugMode: APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE,
          maxMode: APP_CONSTANTS.AI.DEFAULT_MAX_MODE,
          lyricsMode: APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE,
          promptMode: APP_CONSTANTS.AI.DEFAULT_PROMPT_MODE,
        };
      }
      return await file.json();
    } catch {
      return {
        provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
        apiKeys: { groq: null, openai: null, anthropic: null },
        model: APP_CONSTANTS.AI.DEFAULT_MODEL,
        useSunoTags: true,
        debugMode: false,
        maxMode: false,
        lyricsMode: false,
        promptMode: "full",
      };
    }
  }

  async saveConfig(config: Record<string, unknown>) {
    const existing = await this.getConfig();
    const toSave = { ...existing, ...config };
    await Bun.write(this.configPath, JSON.stringify(toSave, null, 2));
  }
}

const makeSession = (id: string, updatedAt: string): PromptSession => ({
  id,
  originalInput: `input-${id}`,
  currentPrompt: `prompt-${id}`,
  versionHistory: [],
  createdAt: updatedAt,
  updatedAt,
});

describe("StorageManager", () => {
  let testDir: string;
  let storage: TestableStorageManager;

  beforeEach(async () => {
    testDir = join(tmpdir(), `suno-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage = new TestableStorageManager(testDir);
    await storage.initialize();
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("history operations", () => {
    test("getHistory returns empty array when no history exists", async () => {
      const history = await storage.getHistory();
      expect(history).toEqual([]);
    });

    test("saveSession adds a new session", async () => {
      const session = makeSession("s1", "2026-01-01T00:00:00Z");
      await storage.saveSession(session);

      const history = await storage.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe("s1");
    });

    test("saveSession updates existing session", async () => {
      const session1 = makeSession("s1", "2026-01-01T00:00:00Z");
      await storage.saveSession(session1);

      const updated = { ...session1, currentPrompt: "updated prompt" };
      await storage.saveSession(updated);

      const history = await storage.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.currentPrompt).toBe("updated prompt");
    });

    test("deleteSession removes session by id", async () => {
      await storage.saveSession(makeSession("s1", "2026-01-01T00:00:00Z"));
      await storage.saveSession(makeSession("s2", "2026-01-02T00:00:00Z"));

      await storage.deleteSession("s1");

      const history = await storage.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe("s2");
    });

    test("deleteSession handles non-existent id gracefully", async () => {
      await storage.saveSession(makeSession("s1", "2026-01-01T00:00:00Z"));
      await storage.deleteSession("nonexistent");

      const history = await storage.getHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe("config operations", () => {
    test("getConfig returns defaults when no config exists", async () => {
      const config = await storage.getConfig();
      expect(config.provider).toBe(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
      expect(config.model).toBe(APP_CONSTANTS.AI.DEFAULT_MODEL);
    });

    test("saveConfig persists settings", async () => {
      await storage.saveConfig({ model: "test-model", debugMode: true });

      const config = await storage.getConfig();
      expect(config.model).toBe("test-model");
      expect(config.debugMode).toBe(true);
    });

    test("saveConfig merges with existing config", async () => {
      await storage.saveConfig({ model: "model-1" });
      await storage.saveConfig({ debugMode: true });

      const config = await storage.getConfig();
      expect(config.model).toBe("model-1");
      expect(config.debugMode).toBe(true);
    });
  });
});
