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
  useLocalLLM: boolean;
  settingsOpen: boolean;
  /** Whether the LLM is available for generation (local LLM enabled OR has API key) */
  isLLMAvailable: boolean;
  setSettingsOpen: (open: boolean) => void;
  setMaxMode: (mode: boolean) => void;
  setLyricsMode: (mode: boolean) => void;
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
  useLocalLLM: boolean;
  apiKeys: APIKeys;
  setMaxMode: (mode: boolean) => Promise<void>;
  setLyricsMode: (mode: boolean) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

/** Hook to manage settings state loading from RPC */
function useSettingsLoader(): SettingsLoaderReturn {
  const [currentModel, setCurrentModel] = useState("");
  const [maxMode, setMaxMode] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKeys>(DEFAULT_API_KEYS);

  const loadAllSettings = useCallback(async () => {
    try {
      const result = await rpcClient.getAllSettings({});
      if (result.ok) {
        setCurrentModel(result.value.model);
        setMaxMode(result.value.maxMode);
        setLyricsMode(result.value.lyricsMode);
        setUseLocalLLM(result.value.useLocalLLM);
        setApiKeys(result.value.apiKeys);
      }
    } catch (error: unknown) {
      log.error("loadAllSettings:failed", error);
    }
  }, []);

  const handleSetMaxMode = useCallback(async (mode: boolean) => {
    const previousMode = maxMode;
    setMaxMode(mode);
    try {
      await rpcClient.setMaxMode({ maxMode: mode });
    } catch (error: unknown) {
      log.error("setMaxMode:failed", error);
      setMaxMode(previousMode);
    }
  }, [maxMode]);

  const handleSetLyricsMode = useCallback(async (mode: boolean) => {
    const previousMode = lyricsMode;
    setLyricsMode(mode);
    try {
      await rpcClient.setLyricsMode({ lyricsMode: mode });
    } catch (error: unknown) {
      log.error("setLyricsMode:failed", error);
      setLyricsMode(previousMode);
    }
  }, [lyricsMode]);

  return {
    currentModel,
    maxMode,
    lyricsMode,
    useLocalLLM,
    apiKeys,
    setMaxMode: handleSetMaxMode,
    setLyricsMode: handleSetLyricsMode,
    reloadSettings: loadAllSettings,
  };
}

export const SettingsProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useSettingsLoader();
  const isInitialMount = useRef(true);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  // Load settings on initial mount
  useEffect(() => {
    void settings.reloadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload settings when settings modal closes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!settingsOpen) {
      void settings.reloadSettings();
    }
  }, [settingsOpen, settings]);

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
    useLocalLLM: settings.useLocalLLM,
    settingsOpen,
    isLLMAvailable,
    setSettingsOpen,
    setMaxMode: settings.setMaxMode,
    setLyricsMode: settings.setLyricsMode,
    reloadSettings: settings.reloadSettings,
    openSettings,
  }), [settings, settingsOpen, isLLMAvailable, openSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
