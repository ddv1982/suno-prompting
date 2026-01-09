import { useCallback, useEffect, useState } from "react";

import { createLogger } from "@/lib/logger";
import { api } from "@/services/rpc";

const log = createLogger("OllamaStatus");

export type OllamaStatus = "checking" | "available" | "unavailable" | "missing-model";

export interface UseOllamaStatusReturn {
  status: OllamaStatus;
  isRefreshing: boolean;
  checkStatus: () => Promise<void>;
}

/**
 * Hook for checking Ollama server availability and model status.
 * Automatically checks status on mount.
 */
export function useOllamaStatus(): UseOllamaStatusReturn {
  const [status, setStatus] = useState<OllamaStatus>("checking");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = useCallback(async (): Promise<void> => {
    setStatus("checking");
    setIsRefreshing(true);
    try {
      const result = await api.checkOllamaStatus();
      if (!result.available) {
        setStatus("unavailable");
      } else if (!result.hasGemma) {
        setStatus("missing-model");
      } else {
        setStatus("available");
      }
    } catch (error: unknown) {
      log.error("checkStatus:failed", error);
      setStatus("unavailable");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  return {
    status,
    isRefreshing,
    checkStatus,
  };
}
