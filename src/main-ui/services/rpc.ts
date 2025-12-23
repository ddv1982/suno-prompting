import { Electroview } from 'electrobun/view';
import { type SunoRPCSchema, type PromptSession } from '@shared/types';

const rpc = Electroview.defineRPC<SunoRPCSchema>({
    maxRequestTime: 30000,
    handlers: {
        requests: {},
        messages: {}
    }
});

new Electroview({ rpc });

type BunRequests = SunoRPCSchema['bun']['requests'];

export const api = {
    async getHistory(): Promise<PromptSession[]> {
        const result = await rpc.request.getHistory({});
        return result?.sessions || [];
    },

    async saveSession(session: PromptSession): Promise<void> {
        await rpc.request.saveSession({ session });
    },

    async deleteSession(id: string): Promise<void> {
        await rpc.request.deleteSession({ id });
    },

    async generateInitial(description: string): Promise<BunRequests['generateInitial']['response']> {
        return await rpc.request.generateInitial({ description });
    },

    async refinePrompt(currentPrompt: string, feedback: string): Promise<BunRequests['refinePrompt']['response']> {
        return await rpc.request.refinePrompt({ currentPrompt, feedback });
    },

    async remixInstruments(currentPrompt: string, originalInput: string): Promise<BunRequests['remixInstruments']['response']> {
        return await rpc.request.remixInstruments({ currentPrompt, originalInput });
    },

    async remixGenre(currentPrompt: string): Promise<BunRequests['remixGenre']['response']> {
        return await rpc.request.remixGenre({ currentPrompt });
    },

    async remixMood(currentPrompt: string): Promise<BunRequests['remixMood']['response']> {
        return await rpc.request.remixMood({ currentPrompt });
    },

    async getApiKey(): Promise<string> {
        const { apiKey } = await rpc.request.getApiKey({});
        return apiKey || '';
    },

    async setApiKey(apiKey: string): Promise<void> {
        await rpc.request.setApiKey({ apiKey });
    },

    async getModel(): Promise<string> {
        const { model } = await rpc.request.getModel({});
        return model;
    },

    async setModel(model: string): Promise<void> {
        await rpc.request.setModel({ model });
    },

    async getSunoTags(): Promise<boolean> {
        const { useSunoTags } = await rpc.request.getSunoTags({});
        return useSunoTags;
    },

    async setSunoTags(useSunoTags: boolean): Promise<void> {
        await rpc.request.setSunoTags({ useSunoTags });
    },

    async getDebugMode(): Promise<boolean> {
        const { debugMode } = await rpc.request.getDebugMode({});
        return debugMode;
    },

    async setDebugMode(debugMode: boolean): Promise<void> {
        await rpc.request.setDebugMode({ debugMode });
    }
};
