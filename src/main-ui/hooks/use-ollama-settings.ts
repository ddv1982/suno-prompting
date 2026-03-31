import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { createLogger } from '@/lib/logger';
import { rpcClient, unwrapOrThrowResult, type RpcError } from '@/services/rpc-client';
import { type Result } from '@shared/types';

const log = createLogger('OllamaSettings');
const OLLAMA_SAVE_DEBOUNCE_MS = 250;
const OLLAMA_LOAD_ERROR = 'Unable to load Ollama settings.';
const OLLAMA_SAVE_ERROR = 'Failed to save Ollama settings.';

export interface OllamaSettingsState {
  endpoint: string;
  temperature: number;
  maxTokens: number;
  contextLength: number;
}

export interface UseOllamaSettingsReturn {
  settings: OllamaSettingsState;
  error: string | null;
  isSaving: boolean;
  updateEndpoint: (value: string) => Promise<void>;
  updateTemperature: (value: number) => Promise<void>;
  updateMaxTokens: (value: number) => Promise<void>;
  updateContextLength: (value: number) => Promise<void>;
}

const DEFAULT_SETTINGS: OllamaSettingsState = {
  endpoint: 'http://127.0.0.1:11434',
  temperature: 0.7,
  maxTokens: 2000,
  contextLength: 4096,
};

type OllamaField = keyof OllamaSettingsState;
type OllamaRequestIds = Record<OllamaField, number>;
type OllamaTimers = Record<OllamaField, ReturnType<typeof setTimeout> | null>;

const DEFAULT_REQUEST_IDS: OllamaRequestIds = {
  endpoint: 0,
  temperature: 0,
  maxTokens: 0,
  contextLength: 0,
};

const DEFAULT_TIMERS: OllamaTimers = {
  endpoint: null,
  temperature: null,
  maxTokens: null,
  contextLength: null,
};

function getRpcErrorMessage(rpcError: unknown): string {
  if (
    rpcError &&
    typeof rpcError === 'object' &&
    'message' in rpcError &&
    typeof rpcError.message === 'string'
  ) {
    return rpcError.message;
  }

  return OLLAMA_SAVE_ERROR;
}

function useOllamaSaveScheduler(
  setSettings: Dispatch<SetStateAction<OllamaSettingsState>>,
  setError: Dispatch<SetStateAction<string | null>>,
  settingsRef: { current: OllamaSettingsState },
  persistedSettingsRef: { current: OllamaSettingsState }
): {
  isSaving: boolean;
  scheduleOptimisticUpdate: <K extends OllamaField>(
    field: K,
    value: OllamaSettingsState[K],
    requestFactory: () => Promise<Result<{ success: boolean }, RpcError>>,
    errorContext: string
  ) => void;
} {
  const [isSaving, setIsSaving] = useState(false);
  const requestIdsRef = useRef({ ...DEFAULT_REQUEST_IDS });
  const timersRef = useRef({ ...DEFAULT_TIMERS });
  const activeRequestsRef = useRef(0);

  const updateSavingState = useCallback(() => {
    const hasPendingTimers = Object.values(timersRef.current).some((timer) => timer !== null);
    setIsSaving(activeRequestsRef.current > 0 || hasPendingTimers);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timersRef.current)) {
        if (timer !== null) {
          clearTimeout(timer);
        }
      }
    };
  }, []);

  const scheduleOptimisticUpdate = useCallback(
    <K extends OllamaField>(
      field: K,
      value: OllamaSettingsState[K],
      requestFactory: () => Promise<Result<{ success: boolean }, RpcError>>,
      errorContext: string
    ): void => {
      const existingTimer = timersRef.current[field];
      if (existingTimer !== null) {
        clearTimeout(existingTimer);
      }

      requestIdsRef.current[field] += 1;
      const requestId = requestIdsRef.current[field];

      setError(null);
      setSettings((prev) => ({ ...prev, [field]: value }));
      settingsRef.current = { ...settingsRef.current, [field]: value };

      timersRef.current[field] = setTimeout(() => {
        timersRef.current[field] = null;
        activeRequestsRef.current += 1;
        updateSavingState();

        void (async () => {
          try {
            unwrapOrThrowResult(await requestFactory());
            if (requestIdsRef.current[field] !== requestId) {
              return;
            }

            persistedSettingsRef.current = { ...persistedSettingsRef.current, [field]: value };
            setError(null);
          } catch (error: unknown) {
            log.error(errorContext, error);
            if (requestIdsRef.current[field] !== requestId) {
              return;
            }

            const persistedValue = persistedSettingsRef.current[field];
            setSettings((prev) => ({ ...prev, [field]: persistedValue }));
            settingsRef.current = { ...settingsRef.current, [field]: persistedValue };
            setError(getRpcErrorMessage(error));
          } finally {
            activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
            updateSavingState();
          }
        })();
      }, OLLAMA_SAVE_DEBOUNCE_MS);

      updateSavingState();
    },
    [setError, setSettings, settingsRef, persistedSettingsRef, updateSavingState]
  );

  return {
    isSaving,
    scheduleOptimisticUpdate,
  };
}

/**
 * Hook for managing Ollama settings (endpoint, temperature, tokens, context).
 * Loads settings on mount and provides update functions.
 */
export function useOllamaSettings(): UseOllamaSettingsReturn {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const persistedSettingsRef = useRef(DEFAULT_SETTINGS);

  const { isSaving, scheduleOptimisticUpdate } = useOllamaSaveScheduler(
    setSettings,
    setError,
    settingsRef,
    persistedSettingsRef
  );

  const applyLoadedSettings = useCallback(
    (nextSettings: OllamaSettingsState, nextError: string | null): void => {
      setSettings(nextSettings);
      settingsRef.current = nextSettings;
      persistedSettingsRef.current = nextSettings;
      setError(nextError);
    },
    []
  );

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const result = await rpcClient.getOllamaSettings({});
      if (result.ok) {
        applyLoadedSettings(result.value, null);
        return;
      }

      applyLoadedSettings(DEFAULT_SETTINGS, OLLAMA_LOAD_ERROR);
    } catch (error: unknown) {
      log.error('loadSettings:failed', error);
      applyLoadedSettings(DEFAULT_SETTINGS, OLLAMA_LOAD_ERROR);
    }
  }, [applyLoadedSettings]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateEndpoint = useCallback(
    async (value: string): Promise<void> => {
      scheduleOptimisticUpdate(
        'endpoint',
        value,
        () => rpcClient.setOllamaSettings({ endpoint: value }),
        'setEndpoint:failed'
      );
    },
    [scheduleOptimisticUpdate]
  );

  const updateTemperature = useCallback(
    async (value: number): Promise<void> => {
      scheduleOptimisticUpdate(
        'temperature',
        value,
        () => rpcClient.setOllamaSettings({ temperature: value }),
        'setTemperature:failed'
      );
    },
    [scheduleOptimisticUpdate]
  );

  const updateMaxTokens = useCallback(
    async (value: number): Promise<void> => {
      scheduleOptimisticUpdate(
        'maxTokens',
        value,
        () => rpcClient.setOllamaSettings({ maxTokens: value }),
        'setMaxTokens:failed'
      );
    },
    [scheduleOptimisticUpdate]
  );

  const updateContextLength = useCallback(
    async (value: number): Promise<void> => {
      scheduleOptimisticUpdate(
        'contextLength',
        value,
        () => rpcClient.setOllamaSettings({ contextLength: value }),
        'setContextLength:failed'
      );
    },
    [scheduleOptimisticUpdate]
  );

  return {
    settings,
    error,
    isSaving,
    updateEndpoint,
    updateTemperature,
    updateMaxTokens,
    updateContextLength,
  };
}
