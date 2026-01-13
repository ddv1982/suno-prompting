/**
 * AI Engine Creative Boost Methods
 *
 * Creative Boost generation and refinement operations.
 *
 * @module ai/engine/creative-boost
 */

import { AIConfig } from '@bun/ai/config';
import {
  generateCreativeBoost as generateCreativeBoostImpl,
  refineCreativeBoost as refineCreativeBoostImpl,
} from '@bun/ai/creative-boost';


import type { ConfigProxies } from './config-proxies';
import type { CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/** Creates the config object for creative boost operations */
function buildCreativeBoostConfig(config: AIConfig, proxies: ConfigProxies): CreativeBoostEngineConfig {
  return {
    getModel: proxies.getModel,
    isDebugMode: config.isDebugMode.bind(config),
    getUseSunoTags: config.getUseSunoTags.bind(config),
    getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
  };
}

/** Create Creative Boost methods bound to configuration. */
export function createCreativeBoostMethods(config: AIConfig, proxies: ConfigProxies, _factories: unknown): {
  generateCreativeBoost: (
    creativityLevel: number, seedGenres: string[], sunoStyles: string[], description: string,
    lyricsTopic: string, withWordlessVocals: boolean, maxMode: boolean, withLyrics: boolean,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
  refineCreativeBoost: (
    currentPrompt: string, currentTitle: string, currentLyrics: string | undefined, feedback: string,
    lyricsTopic: string, description: string, seedGenres: string[], sunoStyles: string[],
    withWordlessVocals: boolean, maxMode: boolean, withLyrics: boolean, targetGenreCount?: number,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
} {
  const boostConfig = buildCreativeBoostConfig(config, proxies);

  return {
    async generateCreativeBoost(
      creativityLevel, seedGenres, sunoStyles, description, lyricsTopic,
      withWordlessVocals, maxMode, withLyrics, runtime
    ) {
      return generateCreativeBoostImpl({
        creativityLevel, seedGenres, sunoStyles, description, lyricsTopic,
        withWordlessVocals, maxMode, withLyrics, config: boostConfig,
      }, runtime);
    },

    async refineCreativeBoost(
      currentPrompt, currentTitle, currentLyrics, feedback, lyricsTopic, description,
      seedGenres, sunoStyles, withWordlessVocals, maxMode, withLyrics, targetGenreCount, runtime
    ) {
      return refineCreativeBoostImpl({
        currentPrompt, currentTitle, currentLyrics, feedback, lyricsTopic, description,
        seedGenres, sunoStyles, withWordlessVocals, maxMode, withLyrics, targetGenreCount, config: boostConfig,
      }, runtime);
    },
  };
}

export type CreativeBoostMethods = ReturnType<typeof createCreativeBoostMethods>;
