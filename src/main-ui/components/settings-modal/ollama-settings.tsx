import { useOllamaSettings } from "@/hooks/use-ollama-settings";

import { OllamaAdvancedSection } from "./ollama-advanced-section";
import { OllamaEndpointSection } from "./ollama-endpoint-section";
import { OllamaModelSection } from "./ollama-model-section";

import type { ReactElement } from "react";

export function OllamaSettings(): ReactElement {
  const {
    settings,
    updateEndpoint,
    updateTemperature,
    updateMaxTokens,
    updateContextLength,
  } = useOllamaSettings();

  return (
    <div className="space-y-6">
      <OllamaEndpointSection
        endpoint={settings.endpoint}
        onChange={updateEndpoint}
      />

      <OllamaModelSection />

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
