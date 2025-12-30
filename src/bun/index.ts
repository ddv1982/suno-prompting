import { BrowserWindow, BrowserView, ApplicationMenu } from 'electrobun/bun';
import { AIEngine } from '@bun/ai-engine';
import { StorageManager } from '@bun/storage';
import { type SunoRPCSchema } from '@shared/types';
import { createHandlers } from '@bun/handlers';
import { createLogger } from '@bun/logger';

const log = createLogger('Main');

// Set up application menu for macOS keyboard shortcuts (Cmd+C, Cmd+V, etc.)
ApplicationMenu.setApplicationMenu([
    { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
    { role: 'editMenu' },
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
        }
    }
});

// Initialize storage, AI engine, and then launch the window
(async () => {
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
            height: 900,
            x: 200,
            y: 200,
        }
    });
})();
