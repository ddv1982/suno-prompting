import { useState, useEffect, useCallback } from "react";

import { createLogger } from "@/lib/logger";
import { rpcClient } from "@/services/rpc-client";
import { APP_CONSTANTS } from "@shared/constants";
import { type AIProvider, type APIKeys, DEFAULT_API_KEYS } from "@shared/types";

const log = createLogger('SettingsModalState');
const MODELS_BY_PROVIDER = APP_CONSTANTS.AI.MODELS_BY_PROVIDER;

/** Current state values for the settings modal */
export interface SettingsModalState {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  useLocalLLM: boolean;
  showKey: boolean;
  saving: boolean;
  loading: boolean;
  error: string | null;
}

/** Actions for updating settings modal state */
export interface SettingsModalActions {
  setProvider: (provider: AIProvider) => void;
  handleProviderChange: (provider: AIProvider) => void;
  handleApiKeyChange: (value: string) => void;
  setModel: (model: string) => void;
  setUseSunoTags: (value: boolean) => void;
  setDebugMode: (value: boolean) => void;
  setMaxMode: (value: boolean) => void;
  setLyricsMode: (value: boolean) => void;
  setStoryMode: (value: boolean) => void;
  setUseLocalLLM: (value: boolean) => void;
  setShowKey: (value: boolean) => void;
  toggleShowKey: () => void;
  handleSave: (onClose: () => void) => Promise<void>;
}

/**
 * Custom hook for managing settings modal state and actions.
 * Handles loading, saving, and updating all application settings.
 *
 * @param isOpen - Whether the modal is currently open (triggers settings load)
 * @returns Tuple of [state, actions] for use in the settings modal component
 */
export function useSettingsModalState(isOpen: boolean): [SettingsModalState, SettingsModalActions] {
  const [provider, setProvider] = useState<AIProvider>(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
  const [apiKeys, setApiKeys] = useState<APIKeys>({ ...DEFAULT_API_KEYS });
  const [model, setModel] = useState<string>("");
  const [useSunoTags, setUseSunoTags] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS);
  const [debugMode, setDebugMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE);
  const [maxMode, setMaxMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_MAX_MODE);
  const [lyricsMode, setLyricsMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE);
  const [storyMode, setStoryMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_STORY_MODE);
  const [useLocalLLM, setUseLocalLLM] = useState<boolean>(true);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadSettings = async (): Promise<void> => {
      setError(null);
      setLoading(true);
      try {
        const result = await rpcClient.getAllSettings({});
        if (!result.ok) {
          setError("Unable to load settings.");
          return;
        }

        const settings = result.value;
        setProvider(settings.provider);
        setApiKeys(settings.apiKeys);
        const providerModels = MODELS_BY_PROVIDER[settings.provider];
        const modelExists = providerModels.some(m => m.id === settings.model);
        setModel(modelExists ? settings.model : providerModels[0].id);
        setUseSunoTags(settings.useSunoTags);
        setDebugMode(settings.debugMode);
        setMaxMode(settings.maxMode);
        setLyricsMode(settings.lyricsMode);
        setStoryMode(settings.storyMode);
        setUseLocalLLM(settings.useLocalLLM ?? true);
      } catch (err: unknown) {
        log.error("fetchSettings:failed", err);
        setError("Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, [isOpen]);

  const handleProviderChange = useCallback((newProvider: AIProvider): void => {
    setProvider(newProvider);
    setShowKey(false);
    const models = MODELS_BY_PROVIDER[newProvider];
    if (models.length > 0) setModel(models[0].id);
  }, []);

  const handleApiKeyChange = useCallback((value: string): void => {
    setApiKeys(prev => ({ ...prev, [provider]: value || null }));
  }, [provider]);

  const toggleShowKey = useCallback((): void => {
    setShowKey(prev => !prev);
  }, []);

  const handleSave = useCallback(async (onClose: () => void): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await rpcClient.saveAllSettings({
        provider, model, useSunoTags, debugMode, maxMode, lyricsMode, storyMode, useLocalLLM,
        apiKeys: {
          groq: apiKeys.groq?.trim() || null,
          openai: apiKeys.openai?.trim() || null,
          anthropic: apiKeys.anthropic?.trim() || null,
        },
      });
      onClose();
    } catch (e: unknown) {
      log.error("saveSettings:failed", e);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [provider, model, useSunoTags, debugMode, maxMode, lyricsMode, storyMode, useLocalLLM, apiKeys]);

  const state: SettingsModalState = {
    provider, apiKeys, model, useSunoTags, debugMode,
    maxMode, lyricsMode, storyMode, useLocalLLM, showKey, saving, loading, error,
  };

  const actions: SettingsModalActions = {
    setProvider, handleProviderChange, handleApiKeyChange, setModel,
    setUseSunoTags, setDebugMode, setMaxMode, setLyricsMode, setStoryMode,
    setUseLocalLLM, setShowKey, toggleShowKey, handleSave,
  };

  return [state, actions];
}
