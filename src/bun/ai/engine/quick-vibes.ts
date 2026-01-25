/**
 * AI Engine Quick Vibes Methods
 *
 * Quick Vibes generation and refinement operations.
 *
 * @module ai/engine/quick-vibes
 */

import {
  generateQuickVibes as generateQuickVibesImpl,
  refineQuickVibes as refineQuickVibesImpl,
} from '@bun/ai/quick-vibes-engine';

import type { ConfigFactories } from './config-factories';
import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';
import type { QuickVibesCategory } from '@shared/types';

/**
 * Create Quick Vibes methods bound to configuration.
 */
export function createQuickVibesMethods(
  factories: ConfigFactories
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
  const generationConfig = factories.getGenerationConfig();

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
        getModel: generationConfig.getModel,
        isMaxMode: generationConfig.isMaxMode,
        isDebugMode: generationConfig.isDebugMode,
        isStoryMode: generationConfig.isStoryMode,
        isLLMAvailable: generationConfig.isLLMAvailable,
        getOllamaEndpointIfLocal: generationConfig.getOllamaEndpointIfLocal,
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
        getModel: generationConfig.getModel,
        isMaxMode: generationConfig.isMaxMode,
        isDebugMode: generationConfig.isDebugMode,
        getOllamaEndpoint: generationConfig.getOllamaEndpointIfLocal,
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
