import { mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { encrypt, decrypt } from '@bun/crypto';
import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';
import { StorageError } from '@shared/errors';
import { removeSessionById, sortByUpdated, upsertSessionList } from '@shared/session-utils';
import { type PromptSession, type AppConfig, type APIKeys, DEFAULT_API_KEYS, type AIProvider, type PromptMode, type CreativeBoostMode } from '@shared/types';

// Type for the stored config (with encrypted API keys)
type StoredConfig = Partial<{
    provider: AIProvider;
    apiKeys: Partial<Record<AIProvider, string | null>>;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
    maxMode: boolean;
    lyricsMode: boolean;
    promptMode: PromptMode;
    creativeBoostMode: CreativeBoostMode;
}>;

const log = createLogger('Storage');

const DEFAULT_CONFIG: AppConfig = {
    provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
    apiKeys: { ...DEFAULT_API_KEYS },
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS,
    debugMode: APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE,
    maxMode: APP_CONSTANTS.AI.DEFAULT_MAX_MODE,
    lyricsMode: APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE,
    promptMode: APP_CONSTANTS.AI.DEFAULT_PROMPT_MODE,
    creativeBoostMode: 'simple',
};

export class StorageManager {
    private baseDir: string;
    private historyPath: string;
    private configPath: string;

    constructor() {
        this.baseDir = join(homedir(), APP_CONSTANTS.STORAGE_DIR);
        this.historyPath = join(this.baseDir, 'history.json');
        this.configPath = join(this.baseDir, 'config.json');
    }

    async initialize(): Promise<void> {
        try {
            await mkdir(this.baseDir, { recursive: true });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error('initialize:failed', { error: message });
            throw new StorageError(`Failed to initialize storage directory: ${message}`, 'write');
        }
    }

    async getHistory(): Promise<PromptSession[]> {
        try {
            const file = Bun.file(this.historyPath);
            if (!(await file.exists())) {
                return [];
            }
            const sessions = await file.json() as PromptSession[];
            return sortByUpdated(sessions);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error('getHistory:failed', { error: message });
            // For read errors on history, return empty array to allow app to function
            // but log the error for debugging
            return [];
        }
    }

    async saveHistory(sessions: PromptSession[]): Promise<void> {
        try {
            await Bun.write(this.historyPath, JSON.stringify(sessions, null, 2));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error('saveHistory:failed', { error: message });
            throw new StorageError(`Failed to save history: ${message}`, 'write');
        }
    }

    async saveSession(session: PromptSession): Promise<void> {
        const history = await this.getHistory();
        const updated = upsertSessionList(history, session);
        await this.saveHistory(updated);
    }

    async deleteSession(id: string): Promise<void> {
        const history = await this.getHistory();
        const filtered = removeSessionById(history, id);
        await this.saveHistory(filtered);
    }

    // eslint-disable-next-line complexity -- Config loading with file check, decryption, and graceful fallbacks
    async getConfig(): Promise<AppConfig> {
        try {
            const file = Bun.file(this.configPath);
            if (!(await file.exists())) {
                return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
            }
            const config = await file.json() as StoredConfig;
            
            // Decrypt all API keys
            const apiKeys: APIKeys = { ...DEFAULT_API_KEYS };
            if (config.apiKeys) {
                for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
                    const encryptedKey = config.apiKeys[provider];
                    if (encryptedKey) {
                        try {
                            apiKeys[provider] = await decrypt(encryptedKey);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            log.error('getConfig:decryptFailed', { provider, error: message });
                            // Don't throw - allow app to function with null key, user can re-enter
                            apiKeys[provider] = null;
                        }
                    }
                }
            }
            
            return {
                provider: config.provider ?? DEFAULT_CONFIG.provider,
                apiKeys,
                model: config.model ?? DEFAULT_CONFIG.model,
                useSunoTags: config.useSunoTags ?? DEFAULT_CONFIG.useSunoTags,
                debugMode: config.debugMode ?? DEFAULT_CONFIG.debugMode,
                maxMode: config.maxMode ?? DEFAULT_CONFIG.maxMode,
                lyricsMode: config.lyricsMode ?? DEFAULT_CONFIG.lyricsMode,
                promptMode: config.promptMode ?? DEFAULT_CONFIG.promptMode,
                creativeBoostMode: config.creativeBoostMode ?? DEFAULT_CONFIG.creativeBoostMode,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error('getConfig:failed', { error: message });
            // Return defaults to allow app to function
            return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
        }
    }

    async saveConfig(config: Partial<AppConfig>): Promise<void> {
        try {
            const existing = await this.getConfig();
            const toSave = { ...existing, ...config };
            
            // Encrypt all API keys
            const encryptedKeys: APIKeys = { ...DEFAULT_API_KEYS };
            for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
                if (toSave.apiKeys[provider]) {
                    try {
                        encryptedKeys[provider] = await encrypt(toSave.apiKeys[provider]);
                    } catch (e) {
                        const message = e instanceof Error ? e.message : String(e);
                        log.error('saveConfig:encryptFailed', { provider, error: message });
                        throw new StorageError(`Failed to encrypt API key for ${provider}: ${message}`, 'encrypt');
                    }
                }
            }
            toSave.apiKeys = encryptedKeys;
            
            await Bun.write(this.configPath, JSON.stringify(toSave, null, 2));
        } catch (error) {
            if (error instanceof StorageError) throw error;
            const message = error instanceof Error ? error.message : String(error);
            log.error('saveConfig:failed', { error: message });
            throw new StorageError(`Failed to save config: ${message}`, 'write');
        }
    }
}
