import { expect, test, describe, mock } from "bun:test";
import { createHandlers } from "@bun/handlers";
import { type AIEngine } from "@bun/ai-engine";
import { type StorageManager } from "@bun/storage";
import { type PromptSession } from "@shared/types";

type MockAIEngine = Pick<AIEngine, 'generateInitial' | 'refinePrompt' | 'setApiKey' | 'initialize'>;
type MockStorageManager = Pick<StorageManager, 'getHistory' | 'saveSession' | 'deleteSession' | 'getConfig' | 'saveConfig' | 'initialize'>;

describe("RPC Handlers", () => {
    test("generateInitial should call aiEngine and return validation", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => "Generated Prompt"),
            refinePrompt: mock(async () => ""),
            setApiKey: mock(),
            initialize: mock(async () => {})
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ apiKey: null })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.generateInitial({ description: "Test description" });

        expect(result.prompt).toBe("Generated Prompt");
        expect(result.versionId).toBeDefined();
        expect(result.validation).toBeDefined();
        expect(result.validation.isValid).toBe(true);
        expect(mockAiEngine.generateInitial).toHaveBeenCalledWith("Test description");
    });

    test("refinePrompt should call aiEngine with feedback", async () => {
        const mockAiEngine: MockAIEngine = {
            generateInitial: mock(async () => ""),
            refinePrompt: mock(async () => "Refined Prompt"),
            setApiKey: mock(),
            initialize: mock(async () => {})
        };

        const mockStorage: MockStorageManager = {
            getHistory: mock(async () => []),
            saveSession: mock(async () => {}),
            deleteSession: mock(async () => {}),
            getConfig: mock(async () => ({ apiKey: null })),
            saveConfig: mock(async () => {}),
            initialize: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.refinePrompt({ currentPrompt: "Old prompt", feedback: "Make it louder" });

        expect(result.prompt).toBe("Refined Prompt");
        expect(mockAiEngine.refinePrompt).toHaveBeenCalledWith("Old prompt", "Make it louder");
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
        const mockStorage: Pick<StorageManager, 'saveConfig'> = {
            saveConfig: mock(async () => {})
        };

        const handlers = createHandlers(mockAiEngine as AIEngine, mockStorage as StorageManager);
        const result = await handlers.setApiKey({ apiKey: "test-key" });

        expect(result.success).toBe(true);
        expect(mockStorage.saveConfig).toHaveBeenCalledWith({ apiKey: "test-key" });
        expect(mockAiEngine.setApiKey).toHaveBeenCalledWith("test-key");
    });
});
