import { BrowserWindow, BrowserView } from 'electrobun/bun';

import { AIEngine } from '@bun/ai';
import { createHandlers } from '@bun/handlers';
import { createLogger } from '@bun/logger';
import { createMenuBootstrap } from '@bun/menu-bootstrap';
import { StorageManager } from '@bun/storage';
import { APP_CONSTANTS } from '@shared/constants';
import { type SunoRPCSchema } from '@shared/types';

const log = createLogger('Main');
const APP_NAME = 'Suno Prompting App';
const menuBootstrap = createMenuBootstrap(APP_NAME);

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

  const mainWindow = new BrowserWindow({
    title: APP_NAME,
    url: 'views://main-ui/index.html',
    rpc,
    titleBarStyle: 'default',
    frame: {
      width: 1100,
      height: 800,
      x: 200,
      y: 200,
    },
  });

  menuBootstrap.attachWindow(mainWindow);
}
menuBootstrap.installInitial();

initializeApp().catch((error: unknown) => {
  menuBootstrap.dispose();
  log.error('init:failed', error);
});
