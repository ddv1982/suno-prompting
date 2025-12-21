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
        generateInitial: async ({ description }) => {
            return runAndValidate('generateInitial', { description }, () => aiEngine.generateInitial(description));
        },
        refinePrompt: async ({ currentPrompt, feedback }) => {
            return runAndValidate('refinePrompt', { feedback }, () => aiEngine.refinePrompt(currentPrompt, feedback));
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
        }
    };
}
