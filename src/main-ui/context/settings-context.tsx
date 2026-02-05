import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { createLogger } from '@/lib/logger';
import { rpcClient } from '@/services/rpc-client';
import { DEFAULT_API_KEYS } from '@shared/types';

import type { APIKeys } from '@shared/types';

const log = createLogger('Settings');

export interface SettingsContextType {
  currentModel: string;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  useLocalLLM: boolean;
  settingsOpen: boolean;
  /** Whether the LLM is available for generation (local LLM enabled OR has API key) */
  isLLMAvailable: boolean;
  setSettingsOpen: (open: boolean) => void;
  setMaxMode: (mode: boolean) => void;
  setLyricsMode: (mode: boolean) => void;
  setStoryMode: (mode: boolean) => void;
  reloadSettings: () => Promise<void>;
  /** Open settings modal */
  openSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettingsContext must be used within SettingsProvider');
  return context;
};

interface SettingsLoaderReturn {
  currentModel: string;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  useLocalLLM: boolean;
  apiKeys: APIKeys;
  setMaxMode: (mode: boolean) => Promise<void>;
  setLyricsMode: (mode: boolean) => Promise<void>;
  setStoryMode: (mode: boolean) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

/** Hook to manage settings state loading from RPC */
function useSettingsLoader(): SettingsLoaderReturn {
  const [currentModel, setCurrentModel] = useState("");
  const [maxMode, setMaxMode] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [storyMode, setStoryMode] = useState(false);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKeys>(DEFAULT_API_KEYS);

  const loadAllSettings = useCallback(async () => {
    try {
      const result = await rpcClient.getAllSettings({});
      if (result.ok) {
        setCurrentModel(result.value.model);
        setMaxMode(result.value.maxMode);
        setLyricsMode(result.value.lyricsMode);
        setStoryMode(result.value.storyMode);
        setUseLocalLLM(result.value.useLocalLLM);
        setApiKeys(result.value.apiKeys);
      }
    } catch (error: unknown) {
      log.error("loadAllSettings:failed", error);
    }
  }, []);

  const maxModeRef = useRef(maxMode);
  maxModeRef.current = maxMode;

  const handleSetMaxMode = useCallback(async (mode: boolean) => {
    const previousMode = maxModeRef.current;
    setMaxMode(mode);
    try {
      const result = await rpcClient.setMaxMode({ maxMode: mode });
      if (!result.ok) {
        log.error("setMaxMode:failed", result.error);
        setMaxMode(previousMode);
      }
    } catch (error: unknown) {
      log.error("setMaxMode:failed", error);
      setMaxMode(previousMode);
    }
  }, []);

  const lyricsModeRef = useRef(lyricsMode);
  lyricsModeRef.current = lyricsMode;

  const handleSetLyricsMode = useCallback(async (mode: boolean) => {
    const previousMode = lyricsModeRef.current;
    setLyricsMode(mode);
    try {
      const result = await rpcClient.setLyricsMode({ lyricsMode: mode });
      if (!result.ok) {
        log.error("setLyricsMode:failed", result.error);
        setLyricsMode(previousMode);
      }
    } catch (error: unknown) {
      log.error("setLyricsMode:failed", error);
      setLyricsMode(previousMode);
    }
  }, []);

  const storyModeRef = useRef(storyMode);
  storyModeRef.current = storyMode;

  const handleSetStoryMode = useCallback(async (mode: boolean) => {
    const previousMode = storyModeRef.current;
    setStoryMode(mode);
    try {
      const result = await rpcClient.setStoryMode({ storyMode: mode });
      if (!result.ok) {
        log.error("setStoryMode:failed", result.error);
        setStoryMode(previousMode);
      }
    } catch (error: unknown) {
      log.error("setStoryMode:catch", error);
      setStoryMode(previousMode);
    }
  }, []);

  return {
    currentModel,
    maxMode,
    lyricsMode,
    storyMode,
    useLocalLLM,
    apiKeys,
    setMaxMode: handleSetMaxMode,
    setLyricsMode: handleSetLyricsMode,
    setStoryMode: handleSetStoryMode,
    reloadSettings: loadAllSettings,
  };
}

export const SettingsProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useSettingsLoader();
  const { reloadSettings } = settings;
  const isInitialMount = useRef(true);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  // Load settings on initial mount
  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  // Reload settings when settings modal closes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!settingsOpen) {
      void reloadSettings();
    }
  }, [settingsOpen, reloadSettings]);

  // Derive LLM availability from settings:
  // LLM is available if local LLM is enabled OR at least one cloud API key is configured
  const hasAnyApiKey = Boolean(
    settings.apiKeys.groq?.trim() ||
    settings.apiKeys.openai?.trim() ||
    settings.apiKeys.anthropic?.trim()
  );
  const isLLMAvailable = settings.useLocalLLM || hasAnyApiKey;

  const contextValue = useMemo<SettingsContextType>(() => ({
    currentModel: settings.currentModel,
    maxMode: settings.maxMode,
    lyricsMode: settings.lyricsMode,
    storyMode: settings.storyMode,
    useLocalLLM: settings.useLocalLLM,
    settingsOpen,
    isLLMAvailable,
    setSettingsOpen,
    setMaxMode: settings.setMaxMode,
    setLyricsMode: settings.setLyricsMode,
    setStoryMode: settings.setStoryMode,
    reloadSettings: settings.reloadSettings,
    openSettings,
  }), [settings, settingsOpen, isLLMAvailable, openSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
