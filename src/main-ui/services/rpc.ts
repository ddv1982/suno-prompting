import { Electroview } from 'electrobun/view';
import { type SunoRPCSchema, type PromptSession } from '@shared/types';

const rpc = Electroview.defineRPC<SunoRPCSchema>({
    maxRequestTime: 30000,
    handlers: {
        requests: {},
        messages: {
            onStreamChunk: ({ chunk }: { chunk: string }) => {
                if (streamCallback) {
                    streamCallback(chunk);
                }
            },
            onCondensing: ({ status }: { status: 'start' | 'done' }) => {
                if (condensingCallback) {
                    condensingCallback(status);
                }
            }
        }
    }
});

let streamCallback: ((chunk: string) => void) | null = null;
let condensingCallback: ((status: 'start' | 'done') => void) | null = null;

export const setStreamCallback = (cb: ((chunk: string) => void) | null) => {
    streamCallback = cb;
};

export const setCondensingCallback = (cb: ((status: 'start' | 'done') => void) | null) => {
    condensingCallback = cb;
};

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
