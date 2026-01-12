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

import type { ConfigFactories } from './config-factories';
import type { ConfigProxies } from './config-proxies';
import type { GenerationResult } from '@bun/ai/types';

/**
 * Create Creative Boost methods bound to configuration.
 */
export function createCreativeBoostMethods(
  config: AIConfig,
  proxies: ConfigProxies,
  factories: ConfigFactories
) {
  async function generateCreativeBoost(
    creativityLevel: number,
    seedGenres: string[],
    sunoStyles: string[],
    description: string,
    lyricsTopic: string,
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean
  ): Promise<GenerationResult> {
    return generateCreativeBoostImpl({
      creativityLevel,
      seedGenres,
      sunoStyles,
      description,
      lyricsTopic,
      withWordlessVocals,
      maxMode,
      withLyrics,
      config: {
        getModel: proxies.getModel,
        isDebugMode: config.isDebugMode.bind(config),
        buildDebugInfo: factories.buildDebugInfo,
        getUseSunoTags: config.getUseSunoTags.bind(config),
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      },
    });
  }

  async function refineCreativeBoost(
    currentPrompt: string,
    currentTitle: string,
    currentLyrics: string | undefined,
    feedback: string,
    lyricsTopic: string,
    description: string,
    seedGenres: string[],
    sunoStyles: string[],
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean,
    targetGenreCount?: number
  ): Promise<GenerationResult> {
    return refineCreativeBoostImpl({
      currentPrompt,
      currentTitle,
      currentLyrics,
      feedback,
      lyricsTopic,
      description,
      seedGenres,
      sunoStyles,
      withWordlessVocals,
      maxMode,
      withLyrics,
      targetGenreCount,
      config: {
        getModel: proxies.getModel,
        isDebugMode: config.isDebugMode.bind(config),
        buildDebugInfo: factories.buildDebugInfo,
        getUseSunoTags: config.getUseSunoTags.bind(config),
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      },
    });
  }

  return {
    generateCreativeBoost,
    refineCreativeBoost,
  };
}

export type CreativeBoostMethods = ReturnType<typeof createCreativeBoostMethods>;
