import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { api } from '@/services/rpc';
import { createLogger } from '@/lib/logger';
import type { PromptMode } from '@shared/types';

const log = createLogger('Settings');

interface SettingsContextType {
  currentModel: string;
  maxMode: boolean;
  lyricsMode: boolean;
  promptMode: PromptMode;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setLyricsMode: (mode: boolean) => void;
  setPromptMode: (mode: PromptMode) => void;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettingsContext must be used within SettingsProvider');
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currentModel, setCurrentModel] = useState("");
  const [maxMode, setMaxMode] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [promptMode, setPromptModeState] = useState<PromptMode>('full');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isSavingRef = useRef(false);

  const loadModel = useCallback(async () => {
    try {
      const model = await api.getModel();
      setCurrentModel(model);
    } catch (error) {
      log.error("loadModel:failed", error);
    }
  }, []);

  const loadMaxMode = useCallback(async () => {
    try {
      const mode = await api.getMaxMode();
      setMaxMode(mode);
    } catch (error) {
      log.error("loadMaxMode:failed", error);
    }
  }, []);

  const loadLyricsMode = useCallback(async () => {
    try {
      const mode = await api.getLyricsMode();
      setLyricsMode(mode);
    } catch (error) {
      log.error("loadLyricsMode:failed", error);
    }
  }, []);

  const loadPromptMode = useCallback(async () => {
    try {
      const mode = await api.getPromptMode();
      setPromptModeState(mode);
    } catch (error) {
      log.error("loadPromptMode:failed", error);
    }
  }, []);

  const handleSetLyricsMode = useCallback(async (mode: boolean) => {
    const previousMode = lyricsMode;
    isSavingRef.current = true;
    setLyricsMode(mode);
    try {
      await api.setLyricsMode(mode);
    } catch (error) {
      log.error("setLyricsMode:failed", error);
      setLyricsMode(previousMode);
    } finally {
      isSavingRef.current = false;
    }
  }, [lyricsMode]);

  const handleSetPromptMode = useCallback(async (mode: PromptMode) => {
    const previousMode = promptMode;
    isSavingRef.current = true;
    setPromptModeState(mode);
    try {
      await api.setPromptMode(mode);
    } catch (error) {
      log.error("setPromptMode:failed", error);
      setPromptModeState(previousMode);
    } finally {
      isSavingRef.current = false;
    }
  }, [promptMode]);

  const reloadSettings = useCallback(async () => {
    if (isSavingRef.current) return; // Skip reload while save in progress
    await Promise.all([loadModel(), loadMaxMode(), loadLyricsMode(), loadPromptMode()]);
  }, [loadModel, loadMaxMode, loadLyricsMode, loadPromptMode]);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  useEffect(() => {
    if (!settingsOpen) {
      reloadSettings();
    }
  }, [settingsOpen, reloadSettings]);

  return (
    <SettingsContext.Provider value={{
      currentModel,
      maxMode,
      lyricsMode,
      promptMode,
      settingsOpen,
      setSettingsOpen,
      setLyricsMode: handleSetLyricsMode,
      setPromptMode: handleSetPromptMode,
      reloadSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
