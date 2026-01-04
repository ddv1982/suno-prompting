import { Electroview } from 'electrobun/view';

import { APP_CONSTANTS } from '@shared/constants';
import { type SunoRPCSchema, type PromptSession, type PromptMode, type QuickVibesCategory } from '@shared/types';

const rpc = Electroview.defineRPC<SunoRPCSchema>({
    maxRequestTime: APP_CONSTANTS.AI.TIMEOUT_MS,
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

    async generateInitial(description: string, lockedPhrase?: string, lyricsTopic?: string, genreOverride?: string): Promise<BunRequests['generateInitial']['response']> {
        return await rpc.request.generateInitial({ description, lockedPhrase, lyricsTopic, genreOverride });
    },

    async refinePrompt(currentPrompt: string, feedback: string, lockedPhrase?: string, currentTitle?: string, currentLyrics?: string, lyricsTopic?: string, genreOverride?: string): Promise<BunRequests['refinePrompt']['response']> {
        return await rpc.request.refinePrompt({ currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride });
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

    async remixStyleTags(currentPrompt: string): Promise<BunRequests['remixStyleTags']['response']> {
        return await rpc.request.remixStyleTags({ currentPrompt });
    },

    async remixRecording(currentPrompt: string): Promise<BunRequests['remixRecording']['response']> {
        return await rpc.request.remixRecording({ currentPrompt });
    },

    async remixTitle(currentPrompt: string, originalInput: string): Promise<BunRequests['remixTitle']['response']> {
        return await rpc.request.remixTitle({ currentPrompt, originalInput });
    },

    async remixLyrics(currentPrompt: string, originalInput: string, lyricsTopic?: string): Promise<BunRequests['remixLyrics']['response']> {
        return await rpc.request.remixLyrics({ currentPrompt, originalInput, lyricsTopic });
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
    },

    async getAllSettings(): Promise<BunRequests['getAllSettings']['response']> {
        return await rpc.request.getAllSettings({});
    },

    async saveAllSettings(settings: BunRequests['saveAllSettings']['params']): Promise<void> {
        await rpc.request.saveAllSettings(settings);
    },

    async getMaxMode(): Promise<boolean> {
        const { maxMode } = await rpc.request.getMaxMode({});
        return maxMode;
    },

    async setMaxMode(maxMode: boolean): Promise<void> {
        await rpc.request.setMaxMode({ maxMode });
    },

    async getLyricsMode(): Promise<boolean> {
        const { lyricsMode } = await rpc.request.getLyricsMode({});
        return lyricsMode;
    },

    async setLyricsMode(lyricsMode: boolean): Promise<void> {
        await rpc.request.setLyricsMode({ lyricsMode });
    },

    async getPromptMode(): Promise<PromptMode> {
        const { promptMode } = await rpc.request.getPromptMode({});
        return promptMode;
    },

    async setPromptMode(promptMode: PromptMode): Promise<void> {
        await rpc.request.setPromptMode({ promptMode });
    },

    async generateQuickVibes(
        category: QuickVibesCategory | null,
        customDescription: string,
        withWordlessVocals: boolean,
        sunoStyles: string[] = []
    ): Promise<BunRequests['generateQuickVibes']['response']> {
        return await rpc.request.generateQuickVibes({ category, customDescription, withWordlessVocals, sunoStyles });
    },

    async refineQuickVibes(options: {
        currentPrompt: string;
        currentTitle?: string;
        description?: string;
        feedback: string;
        withWordlessVocals: boolean;
        category?: QuickVibesCategory | null;
        sunoStyles?: string[];
    }): Promise<BunRequests['refineQuickVibes']['response']> {
        return await rpc.request.refineQuickVibes(options);
    },

    async convertToMaxFormat(text: string): Promise<BunRequests['convertToMaxFormat']['response']> {
        return await rpc.request.convertToMaxFormat({ text });
    },

    async generateCreativeBoost(params: {
        creativityLevel: number;
        seedGenres: string[];
        sunoStyles: string[];
        description: string;
        lyricsTopic: string;
        withWordlessVocals: boolean;
        maxMode: boolean;
        withLyrics: boolean;
    }): Promise<BunRequests['generateCreativeBoost']['response']> {
        return await rpc.request.generateCreativeBoost(params);
    },

    async refineCreativeBoost(params: {
        currentPrompt: string;
        currentTitle: string;
        feedback: string;
        lyricsTopic: string;
        description: string;
        seedGenres: string[];
        sunoStyles: string[];
        withWordlessVocals: boolean;
        maxMode: boolean;
        withLyrics: boolean;
    }): Promise<BunRequests['refineCreativeBoost']['response']> {
        return await rpc.request.refineCreativeBoost(params);
    }
};
