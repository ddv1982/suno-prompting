import { BrowserWindow, BrowserView, ApplicationMenu } from 'electrobun/bun';

import { AIEngine } from '@bun/ai';
import { createHandlers } from '@bun/handlers';
import { createLogger } from '@bun/logger';
import { StorageManager } from '@bun/storage';
import { type SunoRPCSchema } from '@shared/types';

const log = createLogger('Main');

// Set up application menu for keyboard shortcuts (Cmd+C/Ctrl+C, Cmd+V/Ctrl+V, etc.)
// Explicit menu definition ensures keyboard shortcuts are properly bound on all platforms
ApplicationMenu.setApplicationMenu([
    { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
        ],
    },
]);

const aiEngine = new AIEngine();
const storage = new StorageManager();

const handlers = createHandlers(aiEngine, storage);

const rpc = BrowserView.defineRPC<SunoRPCSchema>({
    maxRequestTime: 30000,
    handlers: {
        requests: {
            generateInitial: handlers.generateInitial,
            refinePrompt: handlers.refinePrompt,
            remixInstruments: handlers.remixInstruments,
            remixGenre: handlers.remixGenre,
            remixMood: handlers.remixMood,
            remixStyleTags: handlers.remixStyleTags,
            remixRecording: handlers.remixRecording,
            remixTitle: handlers.remixTitle,
            remixLyrics: handlers.remixLyrics,
            getHistory: handlers.getHistory,
            saveSession: handlers.saveSession,
            deleteSession: handlers.deleteSession,
            getApiKey: handlers.getApiKey,
            setApiKey: handlers.setApiKey,
            getModel: handlers.getModel,
            setModel: handlers.setModel,
            getSunoTags: handlers.getSunoTags,
            setSunoTags: handlers.setSunoTags,
            getDebugMode: handlers.getDebugMode,
            setDebugMode: handlers.setDebugMode,
            getMaxMode: handlers.getMaxMode,
            setMaxMode: handlers.setMaxMode,
            getLyricsMode: handlers.getLyricsMode,
            setLyricsMode: handlers.setLyricsMode,
            getAllSettings: handlers.getAllSettings,
            saveAllSettings: handlers.saveAllSettings,
            getPromptMode: handlers.getPromptMode,
            setPromptMode: handlers.setPromptMode,
            generateQuickVibes: handlers.generateQuickVibes,
            refineQuickVibes: handlers.refineQuickVibes,
            convertToMaxFormat: handlers.convertToMaxFormat,
            generateCreativeBoost: handlers.generateCreativeBoost,
            refineCreativeBoost: handlers.refineCreativeBoost,
        }
    }
});

// Initialize storage, AI engine, and then launch the window
async function initializeApp(): Promise<void> {
    log.info('init:start');
    await storage.initialize();
    const config = await storage.getConfig();
    aiEngine.initialize(config);
    log.info('init:complete');

    new BrowserWindow({
        title: 'Suno Prompting App',
        url: 'views://main-ui/index.html',
        rpc,
        frame: {
            width: 1100,
            height: 800,
            x: 200,
            y: 200,
        }
    });
}

initializeApp().catch((error: unknown) => {
    log.error('init:failed', { error: error instanceof Error ? error.message : String(error) });
});
