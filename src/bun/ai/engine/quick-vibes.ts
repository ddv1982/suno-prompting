/**
 * AI Engine Quick Vibes Methods
 *
 * Quick Vibes generation and refinement operations.
 *
 * @module ai/engine/quick-vibes
 */

import { AIConfig } from '@bun/ai/config';
import {
  generateQuickVibes as generateQuickVibesImpl,
  refineQuickVibes as refineQuickVibesImpl,
} from '@bun/ai/quick-vibes-engine';

import type { ConfigFactories } from './config-factories';
import type { ConfigProxies } from './config-proxies';
import type { GenerationResult } from '@bun/ai/types';
import type { QuickVibesCategory } from '@shared/types';

/**
 * Create Quick Vibes methods bound to configuration.
 */
export function createQuickVibesMethods(
  config: AIConfig,
  proxies: ConfigProxies,
  factories: ConfigFactories
): {
  generateQuickVibes: (
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[]
  ) => Promise<GenerationResult>;
  refineQuickVibes: (options: {
    currentPrompt: string;
    currentTitle?: string;
    description?: string;
    feedback: string;
    withWordlessVocals: boolean;
    category?: QuickVibesCategory | null;
    sunoStyles?: string[];
  }) => Promise<GenerationResult>;
} {
  async function generateQuickVibes(
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[]
  ): Promise<GenerationResult> {
    return generateQuickVibesImpl(
      { category, customDescription, withWordlessVocals, sunoStyles },
      {
        getModel: proxies.getModel,
        isMaxMode: config.isMaxMode.bind(config),
        isDebugMode: config.isDebugMode.bind(config),
        buildDebugInfo: factories.buildDebugInfo,
      }
    );
  }

  async function refineQuickVibes(options: {
    currentPrompt: string;
    currentTitle?: string;
    description?: string;
    feedback: string;
    withWordlessVocals: boolean;
    category?: QuickVibesCategory | null;
    sunoStyles?: string[];
  }): Promise<GenerationResult> {
    return refineQuickVibesImpl(
      { ...options, sunoStyles: options.sunoStyles ?? [] },
      {
        getModel: proxies.getModel,
        isMaxMode: config.isMaxMode.bind(config),
        isDebugMode: config.isDebugMode.bind(config),
        buildDebugInfo: factories.buildDebugInfo,
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      }
    );
  }

  return {
    generateQuickVibes,
    refineQuickVibes,
  };
}

export type QuickVibesMethods = ReturnType<typeof createQuickVibesMethods>;
