import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { StorageManager } from '@bun/storage';
import { type AppConfig, type PromptSession } from '@shared/types';

const INVALID_JSON = '{"broken": true';

function makeSession(): PromptSession {
  return {
    id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc111',
    originalInput: 'input',
    currentPrompt: 'prompt',
    versionHistory: [
      {
        id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc222',
        content: 'prompt',
        timestamp: '2026-01-01T00:00:00Z',
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('StorageManager', () => {
  let testDir: string;
  let storage: StorageManager;

  beforeEach(async () => {
    testDir = join(tmpdir(), `suno-storage-${Date.now().toString()}`);
    storage = new StorageManager(testDir);
    await storage.initialize();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test('saveConfig does not overwrite an unreadable config file', async () => {
    const configPath = join(testDir, 'config.json');
    await Bun.write(configPath, INVALID_JSON);

    await expect(storage.saveConfig({ debugMode: true })).rejects.toThrow(
      'Failed to parse config file'
    );

    expect(await Bun.file(configPath).text()).toBe(INVALID_JSON);

    const files = await readdir(testDir);
    expect(files.some((file) => file.startsWith('config.corrupt-'))).toBe(true);
  });

  test('getConfig surfaces unreadable config files and preserves the original file', async () => {
    const configPath = join(testDir, 'config.json');
    await Bun.write(configPath, INVALID_JSON);

    await expect(storage.getConfig()).rejects.toThrow('Failed to parse config file');

    expect(await Bun.file(configPath).text()).toBe(INVALID_JSON);

    const files = await readdir(testDir);
    expect(files.some((file) => file.startsWith('config.corrupt-'))).toBe(true);
  });

  test('saveSession does not overwrite an unreadable history file', async () => {
    const historyPath = join(testDir, 'history.json');
    await Bun.write(historyPath, INVALID_JSON);

    await expect(storage.saveSession(makeSession())).rejects.toThrow(
      'Failed to parse history file'
    );

    expect(await Bun.file(historyPath).text()).toBe(INVALID_JSON);

    const files = await readdir(testDir);
    expect(files.some((file) => file.startsWith('history.corrupt-'))).toBe(true);
  });

  test('getHistory rejects invalid history structure instead of silently returning empty state', async () => {
    const historyPath = join(testDir, 'history.json');
    await Bun.write(historyPath, JSON.stringify({ broken: true }));

    await expect(storage.getHistory()).rejects.toThrow('History file has invalid structure.');
  });

  test('getHistory preserves debug traces for specific remix actions', async () => {
    const historyPath = join(testDir, 'history.json');
    await Bun.write(
      historyPath,
      JSON.stringify([
        {
          ...makeSession(),
          versionHistory: [
            {
              id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc333',
              content: 'prompt',
              timestamp: '2026-01-01T00:00:00Z',
              debugTrace: {
                version: 1,
                runId: 'trace-run-1',
                capturedAt: '2026-01-01T00:00:00Z',
                action: 'remix.genre',
                promptMode: 'full',
                rng: { seed: 123, algorithm: 'mulberry32' },
                stats: {
                  eventCount: 0,
                  llmCallCount: 0,
                  decisionCount: 0,
                  hadErrors: false,
                  persistedBytes: 0,
                  truncatedForCap: false,
                },
                events: [],
              },
            },
          ],
        },
      ])
    );

    const history = await storage.getHistory();

    expect(history).toHaveLength(1);
    expect(history[0]?.versionHistory[0]?.debugTrace?.action).toBe('remix.genre');
  });

  test('concurrent saveConfig calls are serialized', async () => {
    const originalPersistConfig = (storage as any).persistConfig.bind(storage) as (
      config: AppConfig
    ) => Promise<void>;

    (storage as any).persistConfig = async (config: AppConfig): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      await originalPersistConfig(config);
    };

    await Promise.all([
      storage.saveConfig({ model: 'gpt-5-mini' }),
      storage.saveConfig({ debugMode: true }),
    ]);

    const config = await storage.getConfig();
    expect(config.model).toBe('gpt-5-mini');
    expect(config.debugMode).toBe(true);
  });
});
