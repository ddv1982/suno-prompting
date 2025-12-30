import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '@/services/rpc';
import { createLogger } from '@/lib/logger';

const log = createLogger('Settings');

interface SettingsContextType {
  currentModel: string;
  maxMode: boolean;
  lyricsMode: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setLyricsMode: (mode: boolean) => void;
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const handleSetLyricsMode = useCallback(async (mode: boolean) => {
    const previousMode = lyricsMode;
    setLyricsMode(mode);
    try {
      await api.setLyricsMode(mode);
    } catch (error) {
      log.error("setLyricsMode:failed", error);
      setLyricsMode(previousMode);
    }
  }, [lyricsMode]);

  const reloadSettings = useCallback(async () => {
    await Promise.all([loadModel(), loadMaxMode(), loadLyricsMode()]);
  }, [loadModel, loadMaxMode, loadLyricsMode]);

  // Load settings on mount and reload when settings modal closes
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
      settingsOpen,
      setSettingsOpen,
      setLyricsMode: handleSetLyricsMode,
      reloadSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
