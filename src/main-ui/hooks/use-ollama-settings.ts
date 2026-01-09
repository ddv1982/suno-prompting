import { useCallback, useEffect, useState } from "react";

import { createLogger } from "@/lib/logger";
import { api } from "@/services/rpc";

const log = createLogger("OllamaSettings");

export interface OllamaSettingsState {
  endpoint: string;
  temperature: number;
  maxTokens: number;
  contextLength: number;
}

export interface UseOllamaSettingsReturn {
  settings: OllamaSettingsState;
  updateEndpoint: (value: string) => Promise<void>;
  updateTemperature: (value: number) => Promise<void>;
  updateMaxTokens: (value: number) => Promise<void>;
  updateContextLength: (value: number) => Promise<void>;
}

const DEFAULT_SETTINGS: OllamaSettingsState = {
  endpoint: "http://127.0.0.1:11434",
  temperature: 0.7,
  maxTokens: 2000,
  contextLength: 4096,
};

/**
 * Hook for managing Ollama settings (endpoint, temperature, tokens, context).
 * Loads settings on mount and provides update functions.
 */
export function useOllamaSettings(): UseOllamaSettingsReturn {
  const [settings, setSettings] = useState<OllamaSettingsState>(DEFAULT_SETTINGS);

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const result = await api.getOllamaSettings();
      setSettings(result);
    } catch (error: unknown) {
      log.error("loadSettings:failed", error);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateEndpoint = useCallback(async (value: string): Promise<void> => {
    setSettings((prev) => ({ ...prev, endpoint: value }));
    try {
      await api.setOllamaSettings({ endpoint: value });
    } catch (error: unknown) {
      log.error("setEndpoint:failed", error);
    }
  }, []);

  const updateTemperature = useCallback(async (value: number): Promise<void> => {
    setSettings((prev) => ({ ...prev, temperature: value }));
    try {
      await api.setOllamaSettings({ temperature: value });
    } catch (error: unknown) {
      log.error("setTemperature:failed", error);
    }
  }, []);

  const updateMaxTokens = useCallback(async (value: number): Promise<void> => {
    setSettings((prev) => ({ ...prev, maxTokens: value }));
    try {
      await api.setOllamaSettings({ maxTokens: value });
    } catch (error: unknown) {
      log.error("setMaxTokens:failed", error);
    }
  }, []);

  const updateContextLength = useCallback(async (value: number): Promise<void> => {
    setSettings((prev) => ({ ...prev, contextLength: value }));
    try {
      await api.setOllamaSettings({ contextLength: value });
    } catch (error: unknown) {
      log.error("setContextLength:failed", error);
    }
  }, []);

  return {
    settings,
    updateEndpoint,
    updateTemperature,
    updateMaxTokens,
    updateContextLength,
  };
}
