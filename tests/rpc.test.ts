import { expect, test, describe, mock } from "bun:test";

import { type AIEngine } from "@bun/ai";
import { createHandlers } from "@bun/handlers";
import { type StorageManager } from "@bun/storage";
import { APP_CONSTANTS } from "@shared/constants";
import { type PromptSession } from "@shared/types";

type MockAIEngine = Pick<AIEngine, 'generateInitial' | 'refinePrompt' | 'setApiKey'>;
type MockStorageManager = Pick<StorageManager, 'getHistory' | 'saveSession' | 'deleteSession' | 'getConfig' | 'saveConfig' | 'initialize'>;

describe("RPC Handlers", () => {
    test("generateInitial should call aiEngine and return validation", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ({ text: "Generated Prompt", debugInfo: undefined })),
            refinePrompt: mock(async () => ({ text: "", debugInfo: undefined })),
            setApiKey: mock(),
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ provider: 'groq' as const, apiKeys: { groq: null, openai: null, anthropic: null }, model: APP_CONSTANTS.AI.DEFAULT_MODEL, useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, debugMode: false, maxMode: false, lyricsMode: false, promptMode: 'full' as const, creativeBoostMode: 'simple' as const })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.generateInitial({ description: "Test description" });

        expect(result.prompt).toBe("Generated Prompt");
        expect(result.versionId).toBeDefined();
        expect(result.validation).toBeDefined();
        expect(result.validation.isValid).toBe(true);
        expect(mockAiEngine.generateInitial).toHaveBeenCalledWith("Test description", undefined, undefined, undefined);
    });

    test("refinePrompt should call aiEngine with feedback", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ({ text: "", debugInfo: undefined })),
            refinePrompt: mock(async () => ({ text: "Refined Prompt", debugInfo: undefined })),
            setApiKey: mock(),
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ provider: 'groq' as const, apiKeys: { groq: null, openai: null, anthropic: null }, model: APP_CONSTANTS.AI.DEFAULT_MODEL, useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, debugMode: false, maxMode: false, lyricsMode: false, promptMode: 'full' as const, creativeBoostMode: 'simple' as const })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.refinePrompt({ currentPrompt: "Old prompt", feedback: "Make it louder" });

        expect(result.prompt).toBe("Refined Prompt");
        expect(mockAiEngine.refinePrompt).toHaveBeenCalledWith("Old prompt", "Make it louder", undefined, undefined, undefined, undefined, undefined);
    });

    test("refinePrompt should pass currentTitle and currentLyrics to aiEngine", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ({ text: "", debugInfo: undefined })),
            refinePrompt: mock(async () => ({ 
                text: "Refined Prompt", 
                title: "Refined Title",
                lyrics: "[VERSE]\nRefined lyrics",
                debugInfo: undefined 
            })),
            setApiKey: mock(),
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ provider: 'groq' as const, apiKeys: { groq: null, openai: null, anthropic: null }, model: APP_CONSTANTS.AI.DEFAULT_MODEL, useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, debugMode: false, maxMode: false, lyricsMode: true, promptMode: 'full' as const, creativeBoostMode: 'simple' as const })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.refinePrompt({ 
            currentPrompt: "Old prompt", 
            feedback: "Make it louder",
            currentTitle: "Old Title",
            currentLyrics: "[VERSE]\nOld lyrics"
        });

        expect(result.prompt).toBe("Refined Prompt");
        expect(result.title).toBe("Refined Title");
        expect(result.lyrics).toBe("[VERSE]\nRefined lyrics");
        expect(mockAiEngine.refinePrompt).toHaveBeenCalledWith(
            "Old prompt", 
            "Make it louder", 
            undefined, 
            "Old Title", 
            "[VERSE]\nOld lyrics",
            undefined,
            undefined
        );
    });

    test("refinePrompt should pass lyricsTopic to aiEngine", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ({ text: "", debugInfo: undefined })),
            refinePrompt: mock(async () => ({ 
                text: "Refined Prompt", 
                title: "Refined Title",
                lyrics: "[VERSE]\nRefined lyrics about love",
                debugInfo: undefined 
            })),
            setApiKey: mock(),
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ 
                provider: 'groq' as const, 
                apiKeys: { groq: null, openai: null, anthropic: null }, 
                model: APP_CONSTANTS.AI.DEFAULT_MODEL, 
                useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, 
                debugMode: false, 
                maxMode: false, 
                lyricsMode: true,
                promptMode: 'full' as const,
                creativeBoostMode: 'simple' as const
            })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.refinePrompt({ 
            currentPrompt: "Old prompt", 
            feedback: "Make the lyrics more emotional",
            currentTitle: "Old Title",
            currentLyrics: "[VERSE]\nOld lyrics",
            lyricsTopic: "A story about lost love"
        });

        expect(result.prompt).toBe("Refined Prompt");
        expect(mockAiEngine.refinePrompt).toHaveBeenCalledWith(
            "Old prompt", 
            "Make the lyrics more emotional", 
            undefined, 
            "Old Title", 
            "[VERSE]\nOld lyrics",
            "A story about lost love",
            undefined
        );
    });

    test("refinePrompt should return title from aiEngine response", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ({ text: "", debugInfo: undefined })),
            refinePrompt: mock(async () => ({ 
                text: "Refined Prompt", 
                title: "New Title",
                debugInfo: undefined 
            })),
            setApiKey: mock(),
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ provider: 'groq' as const, apiKeys: { groq: null, openai: null, anthropic: null }, model: APP_CONSTANTS.AI.DEFAULT_MODEL, useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, debugMode: false, maxMode: false, lyricsMode: false, promptMode: 'full' as const, creativeBoostMode: 'simple' as const })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.refinePrompt({ 
            currentPrompt: "Old prompt", 
            feedback: "Change the mood"
        });

        expect(result.title).toBe("New Title");
    });

    test("getHistory should call storage", async () => {
        const mockSessions: PromptSession[] = [{
            id: '1',
            originalInput: 'test',
            currentPrompt: 'test',
            versionHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }];
        
        const mockAiEngine: Partial<MockAIEngine> = {};
        const mockStorage: Pick<StorageManager, 'getHistory'> = {
            getHistory: mock(async () => mockSessions)
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.getHistory({} as Record<string, never>);

        expect(result.sessions).toEqual(mockSessions);
        expect(mockStorage.getHistory).toHaveBeenCalled();
    });

    test("setApiKey should update storage and aiEngine", async () => {
        const mockAiEngine: Pick<AIEngine, 'setApiKey'> = {
            setApiKey: mock()
        };
        const mockStorage: Pick<StorageManager, 'saveConfig' | 'getConfig'> = {
            saveConfig: mock(async () => {}),
            getConfig: mock(async () => ({ 
                provider: 'groq' as const, 
                apiKeys: { groq: null, openai: null, anthropic: null },
                model: APP_CONSTANTS.AI.DEFAULT_MODEL, 
                useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS, 
                debugMode: false, 
                maxMode: false, 
                lyricsMode: false,
                promptMode: 'full' as const,
                creativeBoostMode: 'simple' as const
            }))
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.setApiKey({ apiKey: "test-key" });

        expect(result.success).toBe(true);
        expect(mockStorage.saveConfig).toHaveBeenCalledWith({ apiKeys: { groq: "test-key", openai: null, anthropic: null } });
        expect(mockAiEngine.setApiKey).toHaveBeenCalledWith("groq", "test-key");
    });
});
