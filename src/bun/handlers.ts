import { type RPCHandlers } from '@shared/types';
import { validatePrompt } from '@shared/validation';
import { type AIEngine } from '@bun/ai-engine';
import { type StorageManager } from '@bun/storage';

export function createHandlers(
    aiEngine: AIEngine, 
    storage: StorageManager
): RPCHandlers {
    return {
        generateInitial: async ({ description }) => {
            console.log('Bun: Received generateInitial request', { description });
            try {
                // Generate prompt (includes auto-condensing if needed)
                let fullPrompt = await aiEngine.generateInitial(description);

                const versionId = Bun.randomUUIDv7();
                const validation = validatePrompt(fullPrompt);
                console.log('Bun: Generated initial prompt', { versionId, isValid: validation.isValid, promptLength: fullPrompt.length });
                return { prompt: fullPrompt, versionId, validation };
            } catch (error) {
                console.error('Bun: Error in generateInitial', error);
                throw error;
            }
        },
        refinePrompt: async ({ currentPrompt, feedback }) => {
            console.log('Bun: Received refinePrompt request', { feedback });
            try {
                // Refine prompt (includes auto-condensing if needed)
                let fullPrompt = await aiEngine.refinePrompt(currentPrompt, feedback);

                const versionId = Bun.randomUUIDv7();
                const validation = validatePrompt(fullPrompt);
                console.log('Bun: Refined prompt', { versionId, isValid: validation.isValid, promptLength: fullPrompt.length });
                return { prompt: fullPrompt, versionId, validation };
            } catch (error) {
                console.error('Bun: Error in refinePrompt', error);
                throw error;
            }
        },
        getHistory: async () => {
            console.log('Bun: Received getHistory request');
            const sessions = await storage.getHistory();
            console.log('Bun: Returning history', { count: sessions.length });
            return { sessions };
        },
        saveSession: async ({ session }) => {
            console.log('Bun: Received saveSession request', { id: session.id });
            await storage.saveSession(session);
            return { success: true };
        },
        deleteSession: async ({ id }) => {
            console.log('Bun: Received deleteSession request', { id });
            await storage.deleteSession(id);
            return { success: true };
        },
        getApiKey: async () => {
            console.log('Bun: Received getApiKey request');
            const config = await storage.getConfig();
            return { apiKey: config.apiKey };
        },
        setApiKey: async ({ apiKey }) => {
            console.log('Bun: Received setApiKey request');
            await storage.saveConfig({ apiKey });
            aiEngine.setApiKey(apiKey);
            return { success: true };
        },
        getModel: async () => {
            console.log('Bun: Received getModel request');
            const config = await storage.getConfig();
            return { model: config.model };
        },
        setModel: async ({ model }) => {
            console.log('Bun: Received setModel request', { model });
            await storage.saveConfig({ model });
            aiEngine.setModel(model);
            return { success: true };
        },
        getSunoTags: async () => {
            console.log('Bun: Received getSunoTags request');
            const config = await storage.getConfig();
            return { useSunoTags: config.useSunoTags };
        },
        setSunoTags: async ({ useSunoTags }) => {
            console.log('Bun: Received setSunoTags request', { useSunoTags });
            await storage.saveConfig({ useSunoTags });
            aiEngine.setUseSunoTags(useSunoTags);
            return { success: true };
        }
    };
}
