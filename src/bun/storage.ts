import { mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { decrypt, encrypt } from '@bun/crypto';
import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';
import { StorageError } from '@shared/errors';
import { TraceRunSchema } from '@shared/schemas';
import { removeSessionById, sortByUpdated, upsertSessionList } from '@shared/session-utils';
import { type PromptSession, type PromptVersion, type AppConfig, type APIKeys, DEFAULT_API_KEYS, type AIProvider, type PromptMode, type CreativeBoostMode } from '@shared/types';

// Type for the stored config (with encrypted API keys)
type StoredConfig = Partial<{
    provider: AIProvider;
    apiKeys: Partial<Record<AIProvider, string | null>>;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
    maxMode: boolean;
    lyricsMode: boolean;
    useLocalLLM: boolean;
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
    useLocalLLM: true, // Default to true (local LLM first)
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
        } catch (error: unknown) {
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
            const raw = await file.json() as unknown;
            const sessions = sanitizeDebugTracesInHistory(raw);
            return sortByUpdated(sessions);
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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

    /** Decrypt API keys from stored config */
    private async decryptApiKeys(
        storedKeys: Partial<Record<AIProvider, string | null>> | undefined
    ): Promise<APIKeys> {
        const apiKeys: APIKeys = { ...DEFAULT_API_KEYS };
        if (!storedKeys) return apiKeys;

        for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
            const encryptedKey = storedKeys[provider];
            if (encryptedKey) {
                try {
                    apiKeys[provider] = await decrypt(encryptedKey);
                } catch (e) {
                    log.error('getConfig:decryptFailed', { provider, error: e instanceof Error ? e.message : String(e) });
                    apiKeys[provider] = null;
                }
            }
        }
        return apiKeys;
    }

    /** Build AppConfig with defaults for missing values */
    private buildConfigWithDefaults(config: StoredConfig, apiKeys: APIKeys): AppConfig {
        // Smart default: if no explicit useLocalLLM setting and no API keys, default to true
        let useLocalLLM = config.useLocalLLM;
        if (useLocalLLM === undefined) {
            const hasAnyKey = Object.values(apiKeys).some(key => key !== null && key.trim() !== '');
            useLocalLLM = !hasAnyKey; // Default to local if no keys
        }
        
        return {
            provider: config.provider ?? DEFAULT_CONFIG.provider,
            apiKeys,
            model: config.model ?? DEFAULT_CONFIG.model,
            useSunoTags: config.useSunoTags ?? DEFAULT_CONFIG.useSunoTags,
            debugMode: config.debugMode ?? DEFAULT_CONFIG.debugMode,
            maxMode: config.maxMode ?? DEFAULT_CONFIG.maxMode,
            lyricsMode: config.lyricsMode ?? DEFAULT_CONFIG.lyricsMode,
            useLocalLLM,
            promptMode: config.promptMode ?? DEFAULT_CONFIG.promptMode,
            creativeBoostMode: config.creativeBoostMode ?? DEFAULT_CONFIG.creativeBoostMode,
        };
    }

    private async persistConfig(config: AppConfig): Promise<void> {
        // Encrypt all API keys
        const encryptedKeys: APIKeys = { ...DEFAULT_API_KEYS };
        for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
            if (config.apiKeys[provider]) {
                try {
                    encryptedKeys[provider] = await encrypt(config.apiKeys[provider]);
                } catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    log.error('saveConfig:encryptFailed', { provider, error: message });
                    throw new StorageError(`Failed to encrypt API key for ${provider}: ${message}`, 'encrypt');
                }
            }
        }

        const toSave = { ...config, apiKeys: encryptedKeys };
        await Bun.write(this.configPath, JSON.stringify(toSave, null, 2));
    }

    async getConfig(): Promise<AppConfig> {
        try {
            const file = Bun.file(this.configPath);
            if (!(await file.exists())) {
                return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
            }
            const config = await file.json() as StoredConfig;
            const apiKeys = await this.decryptApiKeys(config.apiKeys);
            return this.buildConfigWithDefaults(config, apiKeys);
        } catch (error) {
            log.error('getConfig:failed', { error: error instanceof Error ? error.message : String(error) });
            return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
        }
    }

    async saveConfig(config: Partial<AppConfig>): Promise<void> {
        try {
            const existing = await this.getConfig();
            const toSave = { ...existing, ...config };
            await this.persistConfig(toSave);
        } catch (error: unknown) {
            if (error instanceof StorageError) throw error;
            const message = error instanceof Error ? error.message : String(error);
            log.error('saveConfig:failed', { error: message });
            throw new StorageError(`Failed to save config: ${message}`, 'write');
        }
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
}

function isPromptVersion(value: unknown): value is PromptVersion {
    return (
        isRecord(value)
        && typeof value.id === 'string'
        && typeof value.content === 'string'
        && typeof value.timestamp === 'string'
    );
}

function isPromptSession(value: unknown): value is PromptSession {
    return (
        isRecord(value)
        && typeof value.id === 'string'
        && typeof value.originalInput === 'string'
        && typeof value.currentPrompt === 'string'
        && typeof value.createdAt === 'string'
        && typeof value.updatedAt === 'string'
        && Array.isArray(value.versionHistory)
    );
}

function sanitizeDebugTracesInHistory(raw: unknown): PromptSession[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter(isPromptSession)
        .map((session) => {
            const sanitizedVersions = session.versionHistory
                .filter(isPromptVersion)
                .map((version) => {
                    if (!('debugTrace' in version) || version.debugTrace === undefined) {
                        return version;
                    }

                    const parsed = TraceRunSchema.safeParse(version.debugTrace);
                    if (parsed.success) {
                        return { ...version, debugTrace: parsed.data };
                    }

                    // Drop invalid traces rather than crashing on load.
                    const { debugTrace: _drop, ...rest } = version;
                    return rest;
                });

            return {
                ...session,
                versionHistory: sanitizedVersions,
            };
        });
}
