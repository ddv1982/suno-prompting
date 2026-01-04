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

export function createSettingsHandlers(aiEngine: AIEngine, storage: StorageManager): SettingsHandlers {
  return {
    getApiKey: async () => {
      log.info('getApiKey');
      const config = await storage.getConfig();
      return { apiKey: config.apiKeys[config.provider] };
    },
    setApiKey: async ({ apiKey }) => {
      log.info('setApiKey');
      const config = await storage.getConfig();
      const newApiKeys = { ...config.apiKeys, [config.provider]: apiKey };
      await storage.saveConfig({ apiKeys: newApiKeys });
      aiEngine.setApiKey(config.provider, apiKey);
      return { success: true };
    },
    getModel: async () => {
      log.info('getModel');
      const config = await storage.getConfig();
      return { model: config.model };
    },
    setModel: async ({ model }) => {
      log.info('setModel', { model });
      await storage.saveConfig({ model });
      aiEngine.setModel(model);
      return { success: true };
    },
    getSunoTags: async () => {
      log.info('getSunoTags');
      const config = await storage.getConfig();
      return { useSunoTags: config.useSunoTags };
    },
    setSunoTags: async ({ useSunoTags }) => {
      log.info('setSunoTags', { useSunoTags });
      await storage.saveConfig({ useSunoTags });
      aiEngine.setUseSunoTags(useSunoTags);
      return { success: true };
    },
    getDebugMode: async () => {
      log.info('getDebugMode');
      const config = await storage.getConfig();
      return { debugMode: config.debugMode };
    },
    setDebugMode: async ({ debugMode }) => {
      log.info('setDebugMode', { debugMode });
      await storage.saveConfig({ debugMode });
      aiEngine.setDebugMode(debugMode);
      return { success: true };
    },
    getAllSettings: async () => {
      log.info('getAllSettings');
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
    saveAllSettings: async ({ provider, apiKeys, model, useSunoTags, debugMode, maxMode, lyricsMode }) => {
      log.info('saveAllSettings', { provider });
      await storage.saveConfig({ provider, apiKeys, model, useSunoTags, debugMode, maxMode, lyricsMode });
      aiEngine.setProvider(provider);
      for (const p of APP_CONSTANTS.AI.PROVIDER_IDS) {
        if (apiKeys[p]) {
          aiEngine.setApiKey(p, apiKeys[p]);
        }
      }
      aiEngine.setModel(model);
      aiEngine.setUseSunoTags(useSunoTags);
      aiEngine.setDebugMode(debugMode);
      aiEngine.setMaxMode(maxMode);
      aiEngine.setLyricsMode(lyricsMode);
      return { success: true };
    },
    getMaxMode: async () => {
      log.info('getMaxMode');
      const config = await storage.getConfig();
      return { maxMode: config.maxMode };
    },
    setMaxMode: async ({ maxMode }) => {
      log.info('setMaxMode', { maxMode });
      await storage.saveConfig({ maxMode });
      aiEngine.setMaxMode(maxMode);
      return { success: true };
    },
    getLyricsMode: async () => {
      log.info('getLyricsMode');
      const config = await storage.getConfig();
      return { lyricsMode: config.lyricsMode };
    },
    setLyricsMode: async ({ lyricsMode }) => {
      log.info('setLyricsMode', { lyricsMode });
      await storage.saveConfig({ lyricsMode });
      aiEngine.setLyricsMode(lyricsMode);
      return { success: true };
    },
    getPromptMode: async () => {
      log.info('getPromptMode');
      const config = await storage.getConfig();
      return { promptMode: config.promptMode ?? 'full' };
    },
    setPromptMode: async ({ promptMode }) => {
      log.info('setPromptMode', { promptMode });
      await storage.saveConfig({ promptMode });
      return { success: true };
    },
    getCreativeBoostMode: async () => {
      log.info('getCreativeBoostMode');
      const config = await storage.getConfig();
      return { creativeBoostMode: config.creativeBoostMode ?? 'simple' };
    },
    setCreativeBoostMode: async ({ creativeBoostMode }) => {
      log.info('setCreativeBoostMode', { creativeBoostMode });
      await storage.saveConfig({ creativeBoostMode });
      return { success: true };
    },
  };
}
