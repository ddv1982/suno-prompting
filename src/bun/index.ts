import { BrowserWindow, BrowserView, ApplicationMenu } from 'electrobun/bun';

import { AIEngine } from '@bun/ai';
import { createHandlers } from '@bun/handlers';
import { createLogger } from '@bun/logger';
import { StorageManager } from '@bun/storage';
import { APP_CONSTANTS } from '@shared/constants';
import { getErrorMessage } from '@shared/errors';
import { type SunoRPCSchema } from '@shared/types';

const log = createLogger('Main');

// Menu configuration - defined once, used in both module-level and delayed setup
// Note: accelerator property is required for shortcuts to work (see Electrobun GitHub issue #28)
const MENU_CONFIG = [
  // App Menu - label required for packaged builds
  {
    label: 'Suno Prompting App',
    submenu: [
      { role: 'hide', accelerator: 'h' },
      { role: 'hideOthers' },
      { role: 'showAll' },
      { type: 'separator' },
      { label: 'Quit', role: 'quit', accelerator: 'q' },
    ],
  },
  // Edit Menu
  {
    label: 'Edit',
    submenu: [
      { role: 'undo', accelerator: 'z' },
      { role: 'redo', accelerator: 'Z' },
      { type: 'separator' },
      { role: 'cut', accelerator: 'x' },
      { role: 'copy', accelerator: 'c' },
      { role: 'paste', accelerator: 'v' },
      { role: 'pasteAndMatchStyle', accelerator: 'V' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll', accelerator: 'a' },
    ],
  },
  // Window Menu
  {
    label: 'Window',
    submenu: [
      { role: 'minimize', accelerator: 'm' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'close', accelerator: 'w' },
      { role: 'bringAllToFront' },
    ],
  },
];

// Set menu at module level (works in dev mode)
ApplicationMenu.setApplicationMenu(MENU_CONFIG);

const aiEngine = new AIEngine();
const storage = new StorageManager();

const handlers = createHandlers(aiEngine, storage);

const rpc = BrowserView.defineRPC<SunoRPCSchema>({
  maxRequestTime: APP_CONSTANTS.AI.RPC_TIMEOUT_MS,
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
      getStoryMode: handlers.getStoryMode,
      setStoryMode: handlers.setStoryMode,
      getUseLocalLLM: handlers.getUseLocalLLM,
      setUseLocalLLM: handlers.setUseLocalLLM,
      getAllSettings: handlers.getAllSettings,
      saveAllSettings: handlers.saveAllSettings,
      getPromptMode: handlers.getPromptMode,
      setPromptMode: handlers.setPromptMode,
      getCreativeBoostMode: handlers.getCreativeBoostMode,
      setCreativeBoostMode: handlers.setCreativeBoostMode,
      generateQuickVibes: handlers.generateQuickVibes,
      refineQuickVibes: handlers.refineQuickVibes,
      convertToMaxFormat: handlers.convertToMaxFormat,
      generateCreativeBoost: handlers.generateCreativeBoost,
      refineCreativeBoost: handlers.refineCreativeBoost,
      checkOllamaStatus: handlers.checkOllamaStatus,
      getOllamaSettings: handlers.getOllamaSettings,
      setOllamaSettings: handlers.setOllamaSettings,
    },
  },
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
    },
  });

  // Re-set menu after window creation with delay (for packaged builds)
  setTimeout(() => {
    ApplicationMenu.setApplicationMenu(MENU_CONFIG);
  }, 100);
}

initializeApp().catch((error: unknown) => {
  log.error('init:failed', { error: getErrorMessage(error) });
});
