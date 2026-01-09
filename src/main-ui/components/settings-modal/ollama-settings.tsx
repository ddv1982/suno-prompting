import { useCallback } from "react";

import { useOllamaSettings } from "@/hooks/use-ollama-settings";
import { useOllamaStatus } from "@/hooks/use-ollama-status";

import { OllamaAdvancedSection } from "./ollama-advanced-section";
import { OllamaEndpointSection } from "./ollama-endpoint-section";
import { OllamaModelSection } from "./ollama-model-section";
import { OllamaStatusSection } from "./ollama-status-section";

export function OllamaSettings(): React.JSX.Element {
  const { status, isRefreshing, checkStatus } = useOllamaStatus();
  const {
    settings,
    updateEndpoint,
    updateTemperature,
    updateMaxTokens,
    updateContextLength,
  } = useOllamaSettings();

  const handleEndpointChange = useCallback(
    async (value: string): Promise<void> => {
      await updateEndpoint(value);
      // Re-check status when endpoint changes
      void checkStatus();
    },
    [updateEndpoint, checkStatus]
  );

  return (
    <div className="space-y-6">
      <OllamaStatusSection
        status={status}
        isRefreshing={isRefreshing}
        onRefresh={checkStatus}
      />
      
      <OllamaEndpointSection
        endpoint={settings.endpoint}
        onChange={handleEndpointChange}
      />

      <OllamaModelSection showWarning={status === "missing-model"} />

      <OllamaAdvancedSection
        temperature={settings.temperature}
        maxTokens={settings.maxTokens}
        contextLength={settings.contextLength}
        onTemperatureChange={updateTemperature}
        onMaxTokensChange={updateMaxTokens}
        onContextLengthChange={updateContextLength}
      />
    </div>
  );
}
