import { type RPCHandlers } from '@shared/types';
import { validatePrompt } from '@shared/validation';
import { APP_CONSTANTS } from '@shared/constants';
import { type AIEngine } from '@bun/ai';
import { type StorageManager } from '@bun/storage';
import { createLogger } from '@bun/logger';
import type { GenerationResult } from '@bun/ai';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';

const log = createLogger('RPC');

type ActionMeta = Record<string, unknown>;

/**
 * Generic error handling wrapper for async operations.
 * Logs the action start, handles errors, and logs completion.
 */
async function withErrorHandling<T>(
    actionName: string,
    operation: () => Promise<T>,
    meta?: ActionMeta
): Promise<T> {
    log.info(actionName, meta);
    try {
        const result = await operation();
        log.info(`${actionName}:complete`);
        return result;
    } catch (error) {
        log.error(`${actionName}:failed`, error);
        throw error;
    }
}

export function createHandlers(
    aiEngine: AIEngine, 
    storage: StorageManager
): RPCHandlers {

    async function runAndValidate(
        action: 'generateInitial' | 'refinePrompt',
        meta: ActionMeta,
        operation: () => Promise<GenerationResult>
    ) {
        return withErrorHandling(action, async () => {
            const result = await operation();
            const versionId = Bun.randomUUIDv7();
            const validation = validatePrompt(result.text);
            log.info(`${action}:result`, { versionId, isValid: validation.isValid, promptLength: result.text.length });
            return { 
                prompt: result.text, 
                title: result.title,
                lyrics: result.lyrics,
                versionId, 
                validation, 
                debugInfo: result.debugInfo 
            };
        }, meta);
    }

    async function runRemixAction(name: string, operation: () => Promise<GenerationResult>) {
        return withErrorHandling(name, async () => {
            const result = await operation();
            const versionId = Bun.randomUUIDv7();
            const validation = validatePrompt(result.text);
            log.info(`${name}:result`, { versionId, promptLength: result.text.length });
            return { prompt: result.text, versionId, validation };
        });
    }

    async function runSingleFieldRemix<T>(name: string, operation: () => Promise<T>): Promise<T> {
        return withErrorHandling(name, operation);
    }

    return {
        generateInitial: async ({ description, lockedPhrase, lyricsTopic, genreOverride }) => {
            return runAndValidate('generateInitial', { description, genreOverride }, () => aiEngine.generateInitial(description, lockedPhrase, lyricsTopic, genreOverride));
        },
        refinePrompt: async ({ currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride }) => {
            return runAndValidate('refinePrompt', { feedback, genreOverride }, () => aiEngine.refinePrompt(currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride));
        },
        remixInstruments: async ({ currentPrompt, originalInput }) => {
            return runRemixAction('remixInstruments', () => aiEngine.remixInstruments(currentPrompt, originalInput));
        },
        remixGenre: async ({ currentPrompt }) => {
            return runRemixAction('remixGenre', () => aiEngine.remixGenre(currentPrompt));
        },
        remixMood: async ({ currentPrompt }) => {
            return runRemixAction('remixMood', () => aiEngine.remixMood(currentPrompt));
        },
        remixStyleTags: async ({ currentPrompt }) => {
            return runRemixAction('remixStyleTags', () => aiEngine.remixStyleTags(currentPrompt));
        },
        remixRecording: async ({ currentPrompt }) => {
            return runRemixAction('remixRecording', () => aiEngine.remixRecording(currentPrompt));
        },
        remixTitle: async ({ currentPrompt, originalInput }) => {
            return runSingleFieldRemix('remixTitle', async () => {
                const result = await aiEngine.remixTitle(currentPrompt, originalInput);
                return { title: result.title };
            });
        },
        remixLyrics: async ({ currentPrompt, originalInput, lyricsTopic }) => {
            return runSingleFieldRemix('remixLyrics', async () => {
                const result = await aiEngine.remixLyrics(currentPrompt, originalInput, lyricsTopic);
                return { lyrics: result.lyrics };
            });
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
            // Return the API key for current provider (for backwards compatibility)
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
                    aiEngine.setApiKey(p, apiKeys[p]!);
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
        generateQuickVibes: async ({ category, customDescription, withWordlessVocals }) => {
            log.info('generateQuickVibes', { category, customDescription, withWordlessVocals });
            try {
                const result = await aiEngine.generateQuickVibes(category, customDescription, withWordlessVocals);
                const versionId = Bun.randomUUIDv7();
                log.info('generateQuickVibes:complete', { versionId, promptLength: result.text.length });
                return { prompt: result.text, versionId, debugInfo: result.debugInfo };
            } catch (error) {
                log.error('generateQuickVibes:failed', error);
                throw error;
            }
        },
        refineQuickVibes: async ({ currentPrompt, feedback, withWordlessVocals, category }) => {
            log.info('refineQuickVibes', { currentPrompt, feedback, withWordlessVocals, category });
            try {
                const result = await aiEngine.refineQuickVibes(currentPrompt, feedback, withWordlessVocals, category);
                const versionId = Bun.randomUUIDv7();
                log.info('refineQuickVibes:complete', { versionId, promptLength: result.text.length });
                return { prompt: result.text, versionId, debugInfo: result.debugInfo };
            } catch (error) {
                log.error('refineQuickVibes:failed', error);
                throw error;
            }
        },
        convertToMaxFormat: async ({ text }) => {
            return withErrorHandling('convertToMaxFormat', async () => {
                const result = await convertToMaxFormat(text, aiEngine.getModel.bind(aiEngine));
                const versionId = Bun.randomUUIDv7();
                log.info('convertToMaxFormat:result', { 
                    versionId, 
                    wasConverted: result.wasConverted, 
                    promptLength: result.convertedPrompt.length 
                });
                return {
                    convertedPrompt: result.convertedPrompt,
                    wasConverted: result.wasConverted,
                    versionId,
                    debugInfo: result.debugInfo,
                };
            }, { textLength: text.length });
        },
        generateCreativeBoost: async ({ 
            creativityLevel, 
            seedGenres, 
            description, 
            lyricsTopic, 
            withWordlessVocals, 
            maxMode, 
            withLyrics 
        }) => {
            return withErrorHandling('generateCreativeBoost', async () => {
                if (creativityLevel < 0 || creativityLevel > 100) {
                    throw new Error('Creativity level must be between 0 and 100');
                }
                if (seedGenres.length > 2) {
                    throw new Error('Maximum 2 seed genres allowed');
                }
                const result = await aiEngine.generateCreativeBoost(
                    creativityLevel,
                    seedGenres,
                    description,
                    lyricsTopic,
                    withWordlessVocals,
                    maxMode,
                    withLyrics
                );
                const versionId = Bun.randomUUIDv7();
                log.info('generateCreativeBoost:result', { 
                    versionId, 
                    promptLength: result.text.length,
                    hasLyrics: !!result.lyrics,
                    hasTitle: !!result.title
                });
                return { 
                    prompt: result.text, 
                    title: result.title ?? 'Creative Boost',
                    lyrics: result.lyrics,
                    versionId, 
                    debugInfo: result.debugInfo 
                };
            }, { creativityLevel, seedGenresCount: seedGenres.length });
        },
        refineCreativeBoost: async ({
            currentPrompt,
            currentTitle,
            feedback,
            lyricsTopic,
            description,
            withWordlessVocals,
            maxMode,
            withLyrics
        }) => {
            return withErrorHandling('refineCreativeBoost', async () => {
                if (!currentPrompt?.trim()) {
                    throw new Error('Current prompt is required for refinement');
                }
                if (!currentTitle?.trim()) {
                    throw new Error('Current title is required for refinement');
                }
                const result = await aiEngine.refineCreativeBoost(
                    currentPrompt,
                    currentTitle,
                    feedback,
                    lyricsTopic,
                    description,
                    withWordlessVocals,
                    maxMode,
                    withLyrics
                );
                const versionId = Bun.randomUUIDv7();
                log.info('refineCreativeBoost:result', { 
                    versionId, 
                    promptLength: result.text.length,
                    hasLyrics: !!result.lyrics
                });
                return {
                    prompt: result.text,
                    title: result.title ?? currentTitle,
                    lyrics: result.lyrics,
                    versionId,
                    debugInfo: result.debugInfo
                };
            }, { feedback });
        }
    };
}
