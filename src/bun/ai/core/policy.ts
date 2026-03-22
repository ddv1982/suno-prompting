import type { GenerationPolicySnapshot } from './request-config';
import type { AIRequestConfig } from './request-config';

function hasConfiguredApiKey(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

export function buildGenerationPolicy(config: AIRequestConfig): GenerationPolicySnapshot {
  const canUseCloud = Object.values(config.apiKeys).some(hasConfiguredApiKey);
  const canUseLocal = config.useLocalLLM;
  const ollamaEndpoint = canUseLocal ? config.ollamaConfig.endpoint : undefined;

  return {
    canUseCloud,
    canUseLocal,
    llmAvailable: canUseCloud || canUseLocal,
    ollamaEndpoint,
  };
}
