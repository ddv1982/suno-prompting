import { BrowserWindow, BrowserView, ApplicationMenu } from 'electrobun/bun';
import { AIEngine } from '@bun/ai-engine';
import { StorageManager } from '@bun/storage';
import { type SunoRPCSchema } from '@shared/types';
import { createHandlers } from '@bun/handlers';

// Set up application menu for macOS keyboard shortcuts (Cmd+C, Cmd+V, etc.)
ApplicationMenu.setApplicationMenu([
    {
        label: "Suno Prompting App",
        submenu: [
            { label: "About Suno Prompting App", role: "about" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "showAll" },
            { type: "separator" },
            { label: "Quit", role: "quit" }
        ],
    },
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
        }
    }
});

// Initialize storage, AI engine, and then launch the window
(async () => {
    console.log('Bun: Initializing backend...');
    await storage.initialize();
    const config = await storage.getConfig();
    if (config.apiKey) {
        aiEngine.setApiKey(config.apiKey);
    }
    if (config.model) {
        aiEngine.setModel(config.model);
    }
    if (config.useSunoTags !== undefined) {
        aiEngine.setUseSunoTags(config.useSunoTags);
    }
    if (config.debugMode !== undefined) {
        aiEngine.setDebugMode(config.debugMode);
    }
    console.log('Bun: Backend initialized, launching window');

    new BrowserWindow({
        title: 'Suno Prompting App',
        url: 'views://main-ui/index.html',
        rpc,
        frame: {
            width: 1000,
            height: 800,
            x: 200,
            y: 200,
        }
    });
})();
