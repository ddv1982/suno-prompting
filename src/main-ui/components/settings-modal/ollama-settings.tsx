import { useOllamaSettings } from '@/hooks/use-ollama-settings';

import { OllamaAdvancedSection } from './ollama-advanced-section';
import { OllamaEndpointSection } from './ollama-endpoint-section';
import { OllamaModelSection } from './ollama-model-section';

import type { ReactElement } from 'react';

export function OllamaSettings(): ReactElement {
  const {
    settings,
    error,
    isSaving,
    updateEndpoint,
    updateTemperature,
    updateMaxTokens,
    updateContextLength,
  } = useOllamaSettings();

  return (
    <div className="space-y-6">
      <OllamaEndpointSection endpoint={settings.endpoint} onChange={updateEndpoint} />

      <OllamaModelSection />

      <OllamaAdvancedSection
        temperature={settings.temperature}
        maxTokens={settings.maxTokens}
        contextLength={settings.contextLength}
        onTemperatureChange={updateTemperature}
        onMaxTokensChange={updateMaxTokens}
        onContextLengthChange={updateContextLength}
      />

      {isSaving ? <p className="text-xs text-muted-foreground">Saving Ollama settings…</p> : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
