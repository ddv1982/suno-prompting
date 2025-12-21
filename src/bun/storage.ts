import { join } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';
import { type PromptSession, type AppConfig } from '@shared/types';
import { removeSessionById, sortByUpdated, upsertSessionList } from '@shared/session-utils';
import { encrypt, decrypt } from '@bun/crypto';
import { APP_CONSTANTS } from '@shared/constants';

const DEFAULT_CONFIG: AppConfig = {
    apiKey: null,
    model: APP_CONSTANTS.AI.DEFAULT_MODEL,
    useSunoTags: APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS,
    debugMode: APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE,
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
        } catch (error) {
            console.error('Failed to create storage directory:', error);
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
            console.error('Failed to read history:', error);
            return [];
        }
    }

    async saveHistory(sessions: PromptSession[]) {
        try {
            await Bun.write(this.historyPath, JSON.stringify(sessions, null, 2));
        } catch (error) {
            console.error('Failed to save history:', error);
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
                return { ...DEFAULT_CONFIG };
            }
            const config = await file.json();
            if (config.apiKey) {
                try {
                    config.apiKey = await decrypt(config.apiKey);
                } catch (e) {
                    console.error('Failed to decrypt API key, returning null');
                    config.apiKey = null;
                }
            }
            return {
                apiKey: config.apiKey ?? DEFAULT_CONFIG.apiKey,
                model: config.model ?? DEFAULT_CONFIG.model,
                useSunoTags: config.useSunoTags ?? DEFAULT_CONFIG.useSunoTags,
                debugMode: config.debugMode ?? DEFAULT_CONFIG.debugMode,
            };
        } catch (error) {
            console.error('Failed to read config:', error);
            return { ...DEFAULT_CONFIG };
        }
    }

    async saveConfig(config: Partial<AppConfig>) {
        try {
            const existing = await this.getConfig();
            const toSave = { ...existing, ...config };
            if (toSave.apiKey) {
                toSave.apiKey = await encrypt(toSave.apiKey);
            }
            await Bun.write(this.configPath, JSON.stringify(toSave, null, 2));
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }
}
