import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { createLogger } from '@/lib/logger';
import { rpcClient } from '@/services/rpc-client';

const log = createLogger('Settings');

export interface SettingsContextType {
  currentModel: string;
  maxMode: boolean;
  lyricsMode: boolean;
  useLocalLLM: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setMaxMode: (mode: boolean) => void;
  setLyricsMode: (mode: boolean) => void;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettingsContext must be used within SettingsProvider');
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [currentModel, setCurrentModel] = useState("");
  const [maxMode, setMaxMode] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [useLocalLLM, setUseLocalLLMState] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadModel = useCallback(async () => {
    try {
      const result = await rpcClient.getModel({});
      setCurrentModel(result.ok ? result.value.model : '');
    } catch (error: unknown) {
      log.error("loadModel:failed", error);
    }
  }, []);

  const loadMaxMode = useCallback(async () => {
    try {
      const result = await rpcClient.getMaxMode({});
      setMaxMode(result.ok ? result.value.maxMode : false);
    } catch (error: unknown) {
      log.error("loadMaxMode:failed", error);
    }
  }, []);

  const loadLyricsMode = useCallback(async () => {
    try {
      const result = await rpcClient.getLyricsMode({});
      setLyricsMode(result.ok ? result.value.lyricsMode : false);
    } catch (error: unknown) {
      log.error("loadLyricsMode:failed", error);
    }
  }, []);

  const loadUseLocalLLM = useCallback(async () => {
    try {
      const result = await rpcClient.getUseLocalLLM({});
      setUseLocalLLMState(result.ok ? result.value.useLocalLLM : false);
    } catch (error: unknown) {
      log.error("loadUseLocalLLM:failed", error);
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

  const reloadSettings = useCallback(async () => {
    await Promise.all([loadModel(), loadMaxMode(), loadLyricsMode(), loadUseLocalLLM()]);
  }, [loadModel, loadMaxMode, loadLyricsMode, loadUseLocalLLM]);

  // Load settings on initial mount
  useEffect(() => {
    void reloadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount

  // Reload settings when settings modal closes
  useEffect(() => {
    if (!settingsOpen) {
      void reloadSettings();
    }
  }, [settingsOpen, reloadSettings]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<SettingsContextType>(() => ({
    currentModel,
    maxMode,
    lyricsMode,
    useLocalLLM,
    settingsOpen,
    setSettingsOpen,
    setMaxMode: handleSetMaxMode,
    setLyricsMode: handleSetLyricsMode,
    reloadSettings,
  }), [
    currentModel,
    maxMode,
    lyricsMode,
    useLocalLLM,
    settingsOpen,
    handleSetMaxMode,
    handleSetLyricsMode,
    reloadSettings,
  ]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
