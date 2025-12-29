import { join } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';
import { type PromptSession, type AppConfig, type APIKeys, DEFAULT_API_KEYS } from '@shared/types';
import { removeSessionById, sortByUpdated, upsertSessionList } from '@shared/session-utils';
import { encrypt, decrypt } from '@bun/crypto';
import { APP_CONSTANTS } from '@shared/constants';
import { createLogger } from '@bun/logger';

const log = createLogger('Storage');

const DEFAULT_CONFIG: AppConfig = {
    provider: APP_CONSTANTS.AI.DEFAULT_PROVIDER,
    apiKeys: { ...DEFAULT_API_KEYS },
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS,
    debugMode: APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE,
    maxMode: APP_CONSTANTS.AI.DEFAULT_MAX_MODE,
    lyricsMode: APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE,
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

    async initialize() {
        try {
            await mkdir(this.baseDir, { recursive: true });
            await this.migrateConfig();
        } catch (error) {
            log.error('initialize:failed', { error: error instanceof Error ? error.message : String(error) });
        }
    }

    private async migrateConfig(): Promise<void> {
        try {
            const file = Bun.file(this.configPath);
            if (!(await file.exists())) return;
            
            const config = await file.json();
            
            // Check if legacy migration needed (old apiKey field -> new apiKeys object)
            if (config.apiKey && !config.apiKeys) {
                log.info('migrateConfig:legacy', { hasLegacyKey: true });
                
                let decryptedKey: string | null = null;
                try {
                    decryptedKey = await decrypt(config.apiKey);
                } catch (e) {
                    log.error('migrateConfig:decryptFailed', { error: e instanceof Error ? e.message : String(e) });
                }
                
                // Build migrated config
                const migratedConfig = {
                    ...config,
                    provider: config.provider ?? 'groq',
                    apiKeys: {
                        groq: decryptedKey ? await encrypt(decryptedKey) : null,
                        openai: null,
                        anthropic: null,
                    },
                };
                delete migratedConfig.apiKey;
                
                await Bun.write(this.configPath, JSON.stringify(migratedConfig, null, 2));
                log.info('migrateConfig:complete');
            }
        } catch (error) {
            log.error('migrateConfig:failed', { error: error instanceof Error ? error.message : String(error) });
        }
    }

    async getHistory(): Promise<PromptSession[]> {
        try {
            const file = Bun.file(this.historyPath);
            if (!(await file.exists())) {
                return [];
            }
            const sessions = await file.json();
            return sortByUpdated(sessions);
        } catch (error) {
            log.error('getHistory:failed', { error: error instanceof Error ? error.message : String(error) });
            return [];
        }
    }

    async saveHistory(sessions: PromptSession[]) {
        try {
            await Bun.write(this.historyPath, JSON.stringify(sessions, null, 2));
        } catch (error) {
            log.error('saveHistory:failed', { error: error instanceof Error ? error.message : String(error) });
        }
    }

    async saveSession(session: PromptSession) {
        const history = await this.getHistory();
        const updated = upsertSessionList(history, session);
        await this.saveHistory(updated);
    }

    async deleteSession(id: string) {
        const history = await this.getHistory();
        const filtered = removeSessionById(history, id);
        await this.saveHistory(filtered);
    }

    async getConfig(): Promise<AppConfig> {
        try {
            const file = Bun.file(this.configPath);
            if (!(await file.exists())) {
                return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
            }
            const config = await file.json();
            
            // Decrypt all API keys
            const apiKeys: APIKeys = { ...DEFAULT_API_KEYS };
            if (config.apiKeys) {
                for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
                    if (config.apiKeys[provider]) {
                        try {
                            apiKeys[provider] = await decrypt(config.apiKeys[provider]);
                        } catch (e) {
                            log.error('getConfig:decryptFailed', { provider, error: e instanceof Error ? e.message : String(e) });
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
            };
        } catch (error) {
            log.error('getConfig:failed', { error: error instanceof Error ? error.message : String(error) });
            return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_API_KEYS } };
        }
    }

    async saveConfig(config: Partial<AppConfig>) {
        try {
            const existing = await this.getConfig();
            const toSave = { ...existing, ...config };
            
            // Encrypt all API keys
            const encryptedKeys: APIKeys = { ...DEFAULT_API_KEYS };
            for (const provider of APP_CONSTANTS.AI.PROVIDER_IDS) {
                if (toSave.apiKeys[provider]) {
                    encryptedKeys[provider] = await encrypt(toSave.apiKeys[provider]!);
                }
            }
            toSave.apiKeys = encryptedKeys;
            
            // Clean up legacy apiKey field if present
            delete (toSave as Record<string, unknown>).apiKey;
            
            await Bun.write(this.configPath, JSON.stringify(toSave, null, 2));
        } catch (error) {
            log.error('saveConfig:failed', { error: error instanceof Error ? error.message : String(error) });
        }
    }
}
