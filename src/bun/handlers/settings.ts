import { type AIEngine } from '@bun/ai';
import { type StorageManager } from '@bun/storage';
import { APP_CONSTANTS } from '@shared/constants';

import { log } from './utils';

import type { RPCHandlers } from '@shared/types';

type SettingsHandlers = Pick<
  RPCHandlers,
  | 'getApiKey' | 'setApiKey'
  | 'getModel' | 'setModel'
  | 'getSunoTags' | 'setSunoTags'
  | 'getDebugMode' | 'setDebugMode'
  | 'getAllSettings' | 'saveAllSettings'
  | 'getMaxMode' | 'setMaxMode'
  | 'getLyricsMode' | 'setLyricsMode'
  | 'getPromptMode' | 'setPromptMode'
  | 'getCreativeBoostMode' | 'setCreativeBoostMode'
>;

/** API key and model handlers */
function createCoreHandlers(aiEngine: AIEngine, storage: StorageManager) {
  return {
    getApiKey: async () => {
      log.info('getApiKey');
      const config = await storage.getConfig();
      return { apiKey: config.apiKeys[config.provider] };
    },
    setApiKey: async ({ apiKey }: { apiKey: string | null }) => {
      log.info('setApiKey');
      const config = await storage.getConfig();
      await storage.saveConfig({ apiKeys: { ...config.apiKeys, [config.provider]: apiKey } });
      if (apiKey) aiEngine.setApiKey(config.provider, apiKey);
      return { success: true };
    },
    getModel: async () => {
      log.info('getModel');
      return { model: (await storage.getConfig()).model };
    },
    setModel: async ({ model }: { model: string }) => {
      log.info('setModel', { model });
      await storage.saveConfig({ model });
      aiEngine.setModel(model);
      return { success: true };
    },
  };
}

/** Boolean mode handlers (suno tags, debug, max, lyrics) */
function createModeHandlers(aiEngine: AIEngine, storage: StorageManager) {
  return {
    getSunoTags: async () => ({ useSunoTags: (await storage.getConfig()).useSunoTags }),
    setSunoTags: async ({ useSunoTags }: { useSunoTags: boolean }) => {
      await storage.saveConfig({ useSunoTags });
      aiEngine.setUseSunoTags(useSunoTags);
      return { success: true };
    },
    getDebugMode: async () => ({ debugMode: (await storage.getConfig()).debugMode }),
    setDebugMode: async ({ debugMode }: { debugMode: boolean }) => {
      await storage.saveConfig({ debugMode });
      aiEngine.setDebugMode(debugMode);
      return { success: true };
    },
    getMaxMode: async () => ({ maxMode: (await storage.getConfig()).maxMode }),
    setMaxMode: async ({ maxMode }: { maxMode: boolean }) => {
      await storage.saveConfig({ maxMode });
      aiEngine.setMaxMode(maxMode);
      return { success: true };
    },
    getLyricsMode: async () => ({ lyricsMode: (await storage.getConfig()).lyricsMode }),
    setLyricsMode: async ({ lyricsMode }: { lyricsMode: boolean }) => {
      await storage.saveConfig({ lyricsMode });
      aiEngine.setLyricsMode(lyricsMode);
      return { success: true };
    },
  };
}

/** Prompt mode handlers */
function createPromptModeHandlers(storage: StorageManager) {
  return {
    getPromptMode: async () => ({ promptMode: (await storage.getConfig()).promptMode ?? 'full' }),
    setPromptMode: async ({ promptMode }: { promptMode: string }) => {
      await storage.saveConfig({ promptMode: promptMode as 'full' | 'quickVibes' | 'creativeBoost' });
      return { success: true };
    },
    getCreativeBoostMode: async () => ({ creativeBoostMode: (await storage.getConfig()).creativeBoostMode ?? 'simple' }),
    setCreativeBoostMode: async ({ creativeBoostMode }: { creativeBoostMode: string }) => {
      await storage.saveConfig({ creativeBoostMode: creativeBoostMode as 'simple' | 'advanced' });
      return { success: true };
    },
  };
}

/** Bulk settings handlers */
function createBulkHandlers(aiEngine: AIEngine, storage: StorageManager) {
  return {
    getAllSettings: async () => {
      const config = await storage.getConfig();
      return {
        provider: config.provider,
        apiKeys: config.apiKeys,
        model: config.model,
        useSunoTags: config.useSunoTags,
        debugMode: config.debugMode,
        maxMode: config.maxMode,
        lyricsMode: config.lyricsMode
      };
    },
    saveAllSettings: async ({ provider, apiKeys, model, useSunoTags, debugMode, maxMode, lyricsMode }: Parameters<RPCHandlers['saveAllSettings']>[0]) => {
      log.info('saveAllSettings', { provider });
      await storage.saveConfig({ provider, apiKeys, model, useSunoTags, debugMode, maxMode, lyricsMode });
      aiEngine.setProvider(provider);
      for (const p of APP_CONSTANTS.AI.PROVIDER_IDS) {
        if (apiKeys[p]) aiEngine.setApiKey(p, apiKeys[p]);
      }
      aiEngine.setModel(model);
      aiEngine.setUseSunoTags(useSunoTags);
      aiEngine.setDebugMode(debugMode);
      aiEngine.setMaxMode(maxMode);
      aiEngine.setLyricsMode(lyricsMode);
      return { success: true };
    },
  };
}

export function createSettingsHandlers(aiEngine: AIEngine, storage: StorageManager): SettingsHandlers {
  return {
    ...createCoreHandlers(aiEngine, storage),
    ...createModeHandlers(aiEngine, storage),
    ...createPromptModeHandlers(storage),
    ...createBulkHandlers(aiEngine, storage),
  };
}
