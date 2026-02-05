import { type AIEngine } from '@bun/ai';
import { type StorageManager } from '@bun/storage';
import { APP_CONSTANTS } from '@shared/constants';
import { SetUseLocalLLMSchema, SaveAllSettingsSchema } from '@shared/schemas';

import { withErrorHandling, log } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type SettingsHandlers = Pick<
  RPCHandlers,
  | 'getApiKey'
  | 'setApiKey'
  | 'getModel'
  | 'setModel'
  | 'getSunoTags'
  | 'setSunoTags'
  | 'getDebugMode'
  | 'setDebugMode'
  | 'getAllSettings'
  | 'saveAllSettings'
  | 'getMaxMode'
  | 'setMaxMode'
  | 'getLyricsMode'
  | 'setLyricsMode'
  | 'getStoryMode'
  | 'setStoryMode'
  | 'getPromptMode'
  | 'setPromptMode'
  | 'getCreativeBoostMode'
  | 'setCreativeBoostMode'
  | 'getUseLocalLLM'
  | 'setUseLocalLLM'
>;

/** API key and model handlers */
function createCoreHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): Pick<SettingsHandlers, 'getApiKey' | 'setApiKey' | 'getModel' | 'setModel'> {
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
      const config = await storage.getConfig();
      if (config.useLocalLLM) {
        return { model: config.ollamaModel ?? APP_CONSTANTS.OLLAMA.DEFAULT_MODEL };
      }
      return { model: config.model };
    },
    setModel: async ({ model }: { model: string }) => {
      log.info('setModel', { model });
      await storage.saveConfig({ model });
      aiEngine.setModel(model);
      return { success: true };
    },
  };
}

/** Boolean mode handlers (suno tags, debug, max, lyrics, story, useLocalLLM) */
function createModeHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): Pick<
  SettingsHandlers,
  | 'getSunoTags'
  | 'setSunoTags'
  | 'getDebugMode'
  | 'setDebugMode'
  | 'getMaxMode'
  | 'setMaxMode'
  | 'getLyricsMode'
  | 'setLyricsMode'
  | 'getStoryMode'
  | 'setStoryMode'
  | 'getUseLocalLLM'
  | 'setUseLocalLLM'
> {
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
    getStoryMode: async () => ({ storyMode: (await storage.getConfig()).storyMode }),
    setStoryMode: async ({ storyMode }: { storyMode: boolean }) => {
      await storage.saveConfig({ storyMode });
      aiEngine.setStoryMode(storyMode);
      return { success: true };
    },
    getUseLocalLLM: async () => {
      return withErrorHandling('getUseLocalLLM', async () => {
        const config = await storage.getConfig();
        return { useLocalLLM: config.useLocalLLM };
      });
    },
    setUseLocalLLM: async (params) => {
      const { useLocalLLM } = validate(SetUseLocalLLMSchema, params);
      return withErrorHandling(
        'setUseLocalLLM',
        async () => {
          await storage.saveConfig({ useLocalLLM });
          aiEngine.setUseLocalLLM(useLocalLLM);
          return { success: true };
        },
        { useLocalLLM }
      );
    },
  };
}

/** Prompt mode handlers */
function createPromptModeHandlers(
  storage: StorageManager
): Pick<
  SettingsHandlers,
  'getPromptMode' | 'setPromptMode' | 'getCreativeBoostMode' | 'setCreativeBoostMode'
> {
  return {
    getPromptMode: async () => ({ promptMode: (await storage.getConfig()).promptMode ?? 'full' }),
    setPromptMode: async ({ promptMode }: { promptMode: string }) => {
      await storage.saveConfig({
        promptMode: promptMode as 'full' | 'quickVibes' | 'creativeBoost',
      });
      return { success: true };
    },
    getCreativeBoostMode: async () => ({
      creativeBoostMode: (await storage.getConfig()).creativeBoostMode ?? 'simple',
    }),
    setCreativeBoostMode: async ({ creativeBoostMode }: { creativeBoostMode: string }) => {
      await storage.saveConfig({ creativeBoostMode: creativeBoostMode as 'simple' | 'advanced' });
      return { success: true };
    },
  };
}

/** Bulk settings handlers */
function createBulkHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): Pick<SettingsHandlers, 'getAllSettings' | 'saveAllSettings'> {
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
        lyricsMode: config.lyricsMode,
        storyMode: config.storyMode,
        useLocalLLM: config.useLocalLLM,
      };
    },
    saveAllSettings: async (params) => {
      const {
        provider,
        apiKeys,
        model,
        useSunoTags,
        debugMode,
        maxMode,
        lyricsMode,
        storyMode,
        useLocalLLM,
      } = validate(SaveAllSettingsSchema, params);

      return withErrorHandling(
        'saveAllSettings',
        async () => {
          await storage.saveConfig({
            provider,
            apiKeys,
            model,
            useSunoTags,
            debugMode,
            maxMode,
            lyricsMode,
            storyMode,
            useLocalLLM,
          });

          aiEngine.setProvider(provider);
          for (const p of APP_CONSTANTS.AI.PROVIDER_IDS) {
            if (apiKeys[p]) aiEngine.setApiKey(p, apiKeys[p]);
          }
          aiEngine.setModel(model);
          aiEngine.setUseSunoTags(useSunoTags);
          aiEngine.setDebugMode(debugMode);
          aiEngine.setMaxMode(maxMode);
          aiEngine.setLyricsMode(lyricsMode);
          aiEngine.setStoryMode(storyMode);
          aiEngine.setUseLocalLLM(useLocalLLM);

          return { success: true };
        },
        { provider, useLocalLLM }
      );
    },
  };
}

export function createSettingsHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): SettingsHandlers {
  return {
    ...createCoreHandlers(aiEngine, storage),
    ...createModeHandlers(aiEngine, storage),
    ...createPromptModeHandlers(storage),
    ...createBulkHandlers(aiEngine, storage),
  };
}
