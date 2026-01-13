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

import type { ConfigProxies } from './config-proxies';
import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';
import type { QuickVibesCategory } from '@shared/types';

/**
 * Create Quick Vibes methods bound to configuration.
 */
export function createQuickVibesMethods(
  config: AIConfig,
  proxies: ConfigProxies,
  _factories: unknown
): {
  generateQuickVibes: (
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[],
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
  refineQuickVibes: (options: {
    currentPrompt: string;
    currentTitle?: string;
    description?: string;
    feedback: string;
    withWordlessVocals: boolean;
    category?: QuickVibesCategory | null;
    sunoStyles?: string[];
  }, runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }) => Promise<GenerationResult>;
} {
  async function generateQuickVibes(
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[],
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ): Promise<GenerationResult> {
    return generateQuickVibesImpl(
      { category, customDescription, withWordlessVocals, sunoStyles },
      {
        getModel: proxies.getModel,
        isMaxMode: config.isMaxMode.bind(config),
        isDebugMode: config.isDebugMode.bind(config),
      },
      runtime
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
  }, runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }): Promise<GenerationResult> {
    return refineQuickVibesImpl(
      { ...options, sunoStyles: options.sunoStyles ?? [] },
      {
        getModel: proxies.getModel,
        isMaxMode: config.isMaxMode.bind(config),
        isDebugMode: config.isDebugMode.bind(config),
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      },
      runtime
    );
  }

  return {
    generateQuickVibes,
    refineQuickVibes,
  };
}

export type QuickVibesMethods = ReturnType<typeof createQuickVibesMethods>;
