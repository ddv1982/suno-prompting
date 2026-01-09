/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, test, beforeEach, mock } from 'bun:test';

import { DEFAULT_OLLAMA_CONFIG } from '@bun/ai/ollama-provider';
import { APP_CONSTANTS } from '@shared/constants';

import type { AIEngine } from '@bun/ai';
import type { StorageManager } from '@bun/storage';
import type { AppConfig } from '@shared/types';

// Mock the availability module
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);
const mockInvalidateOllamaCache = mock(() => {});

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mockInvalidateOllamaCache,
}));

const { createOllamaHandlers } = await import('@bun/handlers/ollama');

function createMockAIEngine(): AIEngine {
  return {
    generateInitial: mock(() => Promise.resolve({ text: '', title: '' })),
    refinePrompt: mock(() => Promise.resolve({ text: '', title: '' })),
    remixTitle: mock(() => Promise.resolve({ title: '' })),
    remixLyrics: mock(() => Promise.resolve({ lyrics: '' })),
    generateQuickVibes: mock(() => Promise.resolve({ text: '' })),
    refineQuickVibes: mock(() => Promise.resolve({ text: '' })),
    generateCreativeBoost: mock(() => Promise.resolve({ text: '', title: '' })),
    refineCreativeBoost: mock(() => Promise.resolve({ text: '', title: '' })),
    setProvider: mock(() => {}),
    setApiKey: mock(() => {}),
    setModel: mock(() => {}),
    setUseSunoTags: mock(() => {}),
    setDebugMode: mock(() => {}),
    setMaxMode: mock(() => {}),
    setLyricsMode: mock(() => {}),
    setOfflineMode: mock(() => {}),
    setOllamaEndpoint: mock(() => {}),
    setOllamaTemperature: mock(() => {}),
    setOllamaMaxTokens: mock(() => {}),
    setOllamaContextLength: mock(() => {}),
    getModel: mock(() => ({} as any)),
    getOllamaModel: mock(() => ({} as any)),
  } as unknown as AIEngine;
}

function createMockStorage(config?: Partial<AppConfig>): StorageManager {
  const defaultConfig: AppConfig = {
    provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
    apiKeys: { groq: null, openai: null, anthropic: null },
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: true,
    debugMode: false,
    maxMode: false,
    lyricsMode: false,
    offlineMode: false,
    promptMode: 'full',
    creativeBoostMode: 'simple',
    ollamaConfig: DEFAULT_OLLAMA_CONFIG,
    ...config,
  };

  return {
    baseDir: '',
    historyPath: '',
    configPath: '',
    getHistory: mock(() => Promise.resolve([])),
    saveHistory: mock(() => Promise.resolve()),
    saveSession: mock(() => Promise.resolve()),
    deleteSession: mock(() => Promise.resolve()),
    getConfig: mock(() => Promise.resolve(defaultConfig)),
    saveConfig: mock(() => Promise.resolve()),
    initialize: mock(() => Promise.resolve()),
  } as unknown as StorageManager;
}

describe('Ollama Handlers', () => {
  beforeEach(() => {
    mockCheckOllamaAvailable.mockClear();
    mockInvalidateOllamaCache.mockClear();
  });

  describe('checkOllamaStatus', () => {
    test('returns status with default endpoint', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      mockCheckOllamaAvailable.mockResolvedValueOnce({
        available: true,
        hasGemma: true,
      });

      const result = await handlers.checkOllamaStatus({});

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(true);
      expect(result.endpoint).toBe(APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT);
      expect(mockCheckOllamaAvailable).toHaveBeenCalledWith(
        APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT
      );
    });

    test('returns status with custom endpoint from config', async () => {
      const customEndpoint = 'http://custom:12345';
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({
        ollamaConfig: { ...DEFAULT_OLLAMA_CONFIG, endpoint: customEndpoint },
      });
      const handlers = createOllamaHandlers(aiEngine, storage);

      mockCheckOllamaAvailable.mockResolvedValueOnce({
        available: true,
        hasGemma: false,
      });

      const result = await handlers.checkOllamaStatus({});

      expect(result.available).toBe(true);
      expect(result.hasGemma).toBe(false);
      expect(result.endpoint).toBe(customEndpoint);
      expect(mockCheckOllamaAvailable).toHaveBeenCalledWith(customEndpoint);
    });

    test('returns unavailable status when Ollama is not running', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      mockCheckOllamaAvailable.mockResolvedValueOnce({
        available: false,
        hasGemma: false,
      });

      const result = await handlers.checkOllamaStatus({});

      expect(result.available).toBe(false);
      expect(result.hasGemma).toBe(false);
    });

    test('handles missing ollamaConfig gracefully', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({ ollamaConfig: undefined });
      const handlers = createOllamaHandlers(aiEngine, storage);

      mockCheckOllamaAvailable.mockResolvedValueOnce({
        available: true,
        hasGemma: true,
      });

      const result = await handlers.checkOllamaStatus({});

      expect(result.endpoint).toBe(APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT);
    });
  });

  describe('getOllamaSettings', () => {
    test('returns default settings when no config exists', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({ ollamaConfig: undefined });
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.getOllamaSettings({});

      expect(result.endpoint).toBe(DEFAULT_OLLAMA_CONFIG.endpoint);
      expect(result.temperature).toBe(DEFAULT_OLLAMA_CONFIG.temperature);
      expect(result.maxTokens).toBe(DEFAULT_OLLAMA_CONFIG.maxTokens);
      expect(result.contextLength).toBe(DEFAULT_OLLAMA_CONFIG.contextLength);
    });

    test('returns custom settings from config', async () => {
      const customConfig = {
        endpoint: 'http://custom:12345',
        temperature: 0.9,
        maxTokens: 3000,
        contextLength: 8192,
      };
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({ ollamaConfig: customConfig });
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.getOllamaSettings({});

      expect(result.endpoint).toBe(customConfig.endpoint);
      expect(result.temperature).toBe(customConfig.temperature);
      expect(result.maxTokens).toBe(customConfig.maxTokens);
      expect(result.contextLength).toBe(customConfig.contextLength);
    });

    test('merges partial config with defaults', async () => {
      const partialConfig = {
        endpoint: 'http://partial:11434',
        temperature: 0.8,
      };
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({
        ollamaConfig: partialConfig as any,
      });
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.getOllamaSettings({});

      expect(result.endpoint).toBe(partialConfig.endpoint);
      expect(result.temperature).toBe(partialConfig.temperature);
      // Defaults for missing fields
      expect(result.maxTokens).toBe(DEFAULT_OLLAMA_CONFIG.maxTokens);
      expect(result.contextLength).toBe(DEFAULT_OLLAMA_CONFIG.contextLength);
    });
  });

  describe('setOllamaSettings', () => {
    test('updates endpoint and invalidates cache', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.setOllamaSettings({
        endpoint: 'http://new-endpoint:11434',
      });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: expect.objectContaining({
          endpoint: 'http://new-endpoint:11434',
        }),
      });
      expect(aiEngine.setOllamaEndpoint).toHaveBeenCalledWith('http://new-endpoint:11434');
      expect(mockInvalidateOllamaCache).toHaveBeenCalled();
    });

    test('updates temperature without invalidating cache', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.setOllamaSettings({ temperature: 0.9 });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: expect.objectContaining({ temperature: 0.9 }),
      });
      expect(aiEngine.setOllamaTemperature).toHaveBeenCalledWith(0.9);
      expect(mockInvalidateOllamaCache).not.toHaveBeenCalled();
    });

    test('updates maxTokens', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.setOllamaSettings({ maxTokens: 3000 });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: expect.objectContaining({ maxTokens: 3000 }),
      });
      expect(aiEngine.setOllamaMaxTokens).toHaveBeenCalledWith(3000);
      expect(mockInvalidateOllamaCache).not.toHaveBeenCalled();
    });

    test('updates contextLength', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.setOllamaSettings({ contextLength: 8192 });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: expect.objectContaining({ contextLength: 8192 }),
      });
      expect(aiEngine.setOllamaContextLength).toHaveBeenCalledWith(8192);
      expect(mockInvalidateOllamaCache).not.toHaveBeenCalled();
    });

    test('updates multiple settings at once', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      const result = await handlers.setOllamaSettings({
        endpoint: 'http://multi:11434',
        temperature: 0.85,
        maxTokens: 2500,
        contextLength: 6144,
      });

      expect(result.success).toBe(true);
      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: expect.objectContaining({
          endpoint: 'http://multi:11434',
          temperature: 0.85,
          maxTokens: 2500,
          contextLength: 6144,
        }),
      });
      expect(aiEngine.setOllamaEndpoint).toHaveBeenCalledWith('http://multi:11434');
      expect(aiEngine.setOllamaTemperature).toHaveBeenCalledWith(0.85);
      expect(aiEngine.setOllamaMaxTokens).toHaveBeenCalledWith(2500);
      expect(aiEngine.setOllamaContextLength).toHaveBeenCalledWith(6144);
      expect(mockInvalidateOllamaCache).toHaveBeenCalled();
    });

    test('merges with existing config', async () => {
      const existingConfig = {
        endpoint: 'http://existing:11434',
        temperature: 0.7,
        maxTokens: 2000,
        contextLength: 4096,
      };
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage({ ollamaConfig: existingConfig });
      const handlers = createOllamaHandlers(aiEngine, storage);

      await handlers.setOllamaSettings({ temperature: 0.95 });

      expect(storage.saveConfig).toHaveBeenCalledWith({
        ollamaConfig: {
          endpoint: existingConfig.endpoint, // Preserved
          temperature: 0.95, // Updated
          maxTokens: existingConfig.maxTokens, // Preserved
          contextLength: existingConfig.contextLength, // Preserved
        },
      });
    });

    test('handles validation errors', async () => {
      const aiEngine = createMockAIEngine();
      const storage = createMockStorage();
      const handlers = createOllamaHandlers(aiEngine, storage);

      // Test invalid temperature (out of range)
      await expect(
        handlers.setOllamaSettings({ temperature: 2.0 } as any)
      ).rejects.toThrow();

      // Test invalid maxTokens (out of range)
      await expect(
        handlers.setOllamaSettings({ maxTokens: 100 } as any)
      ).rejects.toThrow();

      // Test invalid contextLength (out of range)
      await expect(
        handlers.setOllamaSettings({ contextLength: 1000 } as any)
      ).rejects.toThrow();
    });
  });
});
