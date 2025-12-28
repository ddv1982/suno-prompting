import { type RPCHandlers } from '@shared/types';
import { validatePrompt } from '@shared/validation';
import { type AIEngine } from '@bun/ai-engine';
import { type StorageManager } from '@bun/storage';
import { createLogger } from '@bun/logger';
import type { GenerationResult } from '@bun/ai-engine';

const log = createLogger('RPC');

export function createHandlers(
    aiEngine: AIEngine, 
    storage: StorageManager
): RPCHandlers {

    async function runAndValidate(
        action: 'generateInitial' | 'refinePrompt',
        meta: Record<string, unknown>,
        operation: () => Promise<GenerationResult>
    ) {
        log.info(action, meta);
        try {
            const result = await operation();
            const versionId = Bun.randomUUIDv7();
            const validation = validatePrompt(result.text);
            log.info(`${action}:complete`, { versionId, isValid: validation.isValid, promptLength: result.text.length });
            return { prompt: result.text, versionId, validation, debugInfo: result.debugInfo };
        } catch (error) {
            log.error(`${action}:failed`, error);
            throw error;
        }
    }

    return {
        generateInitial: async ({ description, lockedPhrase }) => {
            return runAndValidate('generateInitial', { description }, () => aiEngine.generateInitial(description, lockedPhrase));
        },
        refinePrompt: async ({ currentPrompt, feedback, lockedPhrase }) => {
            return runAndValidate('refinePrompt', { feedback }, () => aiEngine.refinePrompt(currentPrompt, feedback, lockedPhrase));
        },
        remixInstruments: async ({ currentPrompt, originalInput }) => {
            log.info('remixInstruments');
            try {
                const result = await aiEngine.remixInstruments(currentPrompt, originalInput);
                const versionId = Bun.randomUUIDv7();
                const validation = validatePrompt(result.text);
                log.info('remixInstruments:complete', { versionId, promptLength: result.text.length });
                return { prompt: result.text, versionId, validation };
            } catch (error) {
                log.error('remixInstruments:failed', error);
                throw error;
            }
        },
        remixGenre: async ({ currentPrompt }) => {
            log.info('remixGenre');
            try {
                const result = await aiEngine.remixGenre(currentPrompt);
                const versionId = Bun.randomUUIDv7();
                const validation = validatePrompt(result.text);
                log.info('remixGenre:complete', { versionId, promptLength: result.text.length });
                return { prompt: result.text, versionId, validation };
            } catch (error) {
                log.error('remixGenre:failed', error);
                throw error;
            }
        },
        remixMood: async ({ currentPrompt }) => {
            log.info('remixMood');
            try {
                const result = await aiEngine.remixMood(currentPrompt);
                const versionId = Bun.randomUUIDv7();
                const validation = validatePrompt(result.text);
                log.info('remixMood:complete', { versionId, promptLength: result.text.length });
                return { prompt: result.text, versionId, validation };
            } catch (error) {
                log.error('remixMood:failed', error);
                throw error;
            }
        },
        getHistory: async () => {
            log.info('getHistory');
            const sessions = await storage.getHistory();
            log.info('getHistory:complete', { count: sessions.length });
            return { sessions };
        },
        saveSession: async ({ session }) => {
            log.info('saveSession', { id: session.id });
            await storage.saveSession(session);
            return { success: true };
        },
        deleteSession: async ({ id }) => {
            log.info('deleteSession', { id });
            await storage.deleteSession(id);
            return { success: true };
        },
        getApiKey: async () => {
            log.info('getApiKey');
            const config = await storage.getConfig();
            return { apiKey: config.apiKey };
        },
        setApiKey: async ({ apiKey }) => {
            log.info('setApiKey');
            await storage.saveConfig({ apiKey });
            aiEngine.setApiKey(apiKey);
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
                apiKey: config.apiKey,
                model: config.model,
                useSunoTags: config.useSunoTags,
                debugMode: config.debugMode,
                maxMode: config.maxMode
            };
        },
        saveAllSettings: async ({ apiKey, model, useSunoTags, debugMode, maxMode }) => {
            log.info('saveAllSettings');
            await storage.saveConfig({ apiKey, model, useSunoTags, debugMode, maxMode });
            aiEngine.setApiKey(apiKey);
            aiEngine.setModel(model);
            aiEngine.setUseSunoTags(useSunoTags);
            aiEngine.setDebugMode(debugMode);
            aiEngine.setMaxMode(maxMode);
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
        }
    };
}
