import { type AIEngine } from '@bun/ai';
import { createLogger } from '@bun/logger';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';
import { type StorageManager } from '@bun/storage';
import { APP_CONSTANTS, VALID_CREATIVITY_LEVELS } from '@shared/constants';
import { ValidationError } from '@shared/errors';
import { type RPCHandlers } from '@shared/types';
import { validatePrompt } from '@shared/validation';

import type { GenerationResult } from '@bun/ai';


const log = createLogger('RPC');

type ActionMeta = Record<string, unknown>;

// ============================================================================
// Validation Helpers - Consolidated DRY patterns
// ============================================================================

const MAX_SUNO_STYLES = 4;
const MAX_SEED_GENRES = 4;

/**
 * Validates Suno V5 styles array count.
 * Throws ValidationError if more than MAX_SUNO_STYLES.
 */
function validateSunoStylesLimit(sunoStyles: string[]): void {
    if (sunoStyles.length > MAX_SUNO_STYLES) {
        throw new ValidationError(`Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`, 'sunoStyles');
    }
}

/**
 * Validates seed genres array count.
 * Throws ValidationError if more than MAX_SEED_GENRES.
 */
function validateSeedGenresLimit(seedGenres: string[]): void {
    if (seedGenres.length > MAX_SEED_GENRES) {
        throw new ValidationError(`Maximum ${MAX_SEED_GENRES} seed genres allowed`, 'seedGenres');
    }
}

/**
 * Validates mutual exclusivity between category and sunoStyles (Quick Vibes).
 * Throws ValidationError if both are specified.
 */
function validateCategoryStylesMutualExclusivity(
    category: unknown, 
    sunoStyles: string[]
): void {
    if (category !== null && sunoStyles.length > 0) {
        throw new ValidationError(
            'Cannot use both Category and Suno V5 Styles. Please select only one.',
            'sunoStyles'
        );
    }
}

/**
 * Validates mutual exclusivity between seedGenres and sunoStyles (Creative Boost).
 * Throws ValidationError if both are specified.
 */
function validateGenreStylesMutualExclusivity(
    seedGenres: string[], 
    sunoStyles: string[]
): void {
    if (seedGenres.length > 0 && sunoStyles.length > 0) {
        throw new ValidationError(
            'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
            'sunoStyles'
        );
    }
}

/**
 * Validates creativity level is one of the allowed values.
 */
function validateCreativityLevel(level: number): void {
    if (!VALID_CREATIVITY_LEVELS.includes(level as typeof VALID_CREATIVITY_LEVELS[number])) {
        throw new ValidationError(
            'Invalid creativity level. Must be 0, 25, 50, 75, or 100',
            'creativityLevel'
        );
    }
}

/**
 * Validates required string field is non-empty.
 */
function validateRequiredField(value: string | undefined, fieldName: string, message: string): void {
    if (!value?.trim()) {
        throw new ValidationError(message, fieldName);
    }
}

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

    /**
     * Runs a Quick Vibes action with common result processing.
     * Generates versionId and returns standardized response.
     */
    async function runQuickVibesAction(
        actionName: string, 
        meta: ActionMeta, 
        operation: () => Promise<GenerationResult>
    ) {
        return withErrorHandling(actionName, async () => {
            const result = await operation();
            const versionId = Bun.randomUUIDv7();
            log.info(`${actionName}:result`, { 
                versionId, 
                promptLength: result.text.length, 
                hasTitle: !!result.title 
            });
            return { 
                prompt: result.text, 
                title: result.title, 
                versionId, 
                debugInfo: result.debugInfo 
            };
        }, meta);
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
                    aiEngine.setApiKey(p, apiKeys[p]);
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
        generateQuickVibes: async ({ category, customDescription, withWordlessVocals, sunoStyles }) => {
            // Validate before processing
            validateCategoryStylesMutualExclusivity(category, sunoStyles);
            validateSunoStylesLimit(sunoStyles);
            
            return runQuickVibesAction(
                'generateQuickVibes',
                { category, customDescription, withWordlessVocals, sunoStylesCount: sunoStyles.length },
                () => aiEngine.generateQuickVibes(category, customDescription, withWordlessVocals, sunoStyles)
            );
        },
        refineQuickVibes: async ({ currentPrompt, currentTitle, description, feedback, withWordlessVocals, category, sunoStyles = [] }) => {
            // Validate before processing
            validateCategoryStylesMutualExclusivity(category, sunoStyles);
            validateSunoStylesLimit(sunoStyles);
            
            return runQuickVibesAction(
                'refineQuickVibes',
                { feedback, withWordlessVocals, category, sunoStylesCount: sunoStyles.length },
                () => aiEngine.refineQuickVibes({
                    currentPrompt,
                    currentTitle,
                    description,
                    feedback,
                    withWordlessVocals,
                    category,
                    sunoStyles,
                })
            );
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
            sunoStyles,
            description, 
            lyricsTopic, 
            withWordlessVocals, 
            maxMode, 
            withLyrics 
        }) => {
            // Validate all inputs upfront
            validateCreativityLevel(creativityLevel);
            validateSeedGenresLimit(seedGenres);
            validateSunoStylesLimit(sunoStyles);
            validateGenreStylesMutualExclusivity(seedGenres, sunoStyles);
            
            return withErrorHandling('generateCreativeBoost', async () => {
                const result = await aiEngine.generateCreativeBoost(
                    creativityLevel,
                    seedGenres,
                    sunoStyles,
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
            seedGenres,
            sunoStyles,
            withWordlessVocals,
            maxMode,
            withLyrics
        }) => {
            // Validate all inputs upfront
            validateRequiredField(currentPrompt, 'currentPrompt', 'Current prompt is required for refinement');
            validateRequiredField(currentTitle, 'currentTitle', 'Current title is required for refinement');
            // In Direct Mode (sunoStyles selected), feedback is optional
            // Styles themselves serve as the refinement input
            const isDirectMode = sunoStyles.length > 0;
            if (!isDirectMode) {
                validateRequiredField(feedback, 'feedback', 'Feedback is required for refinement');
            }
            validateSunoStylesLimit(sunoStyles);
            validateGenreStylesMutualExclusivity(seedGenres, sunoStyles);
            
            return withErrorHandling('refineCreativeBoost', async () => {
                const result = await aiEngine.refineCreativeBoost(
                    currentPrompt,
                    currentTitle,
                    feedback,
                    lyricsTopic,
                    description,
                    seedGenres,
                    sunoStyles,
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
