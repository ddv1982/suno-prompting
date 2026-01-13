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
import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/**
 * Create Creative Boost methods bound to configuration.
 */
export function createCreativeBoostMethods(
  config: AIConfig,
  proxies: ConfigProxies,
  _factories: unknown
): {
  generateCreativeBoost: (
    creativityLevel: number,
    seedGenres: string[],
    sunoStyles: string[],
    description: string,
    lyricsTopic: string,
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
  refineCreativeBoost: (
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
    targetGenreCount?: number,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
} {
  async function generateCreativeBoost(
    creativityLevel: number,
    seedGenres: string[],
    sunoStyles: string[],
    description: string,
    lyricsTopic: string,
    withWordlessVocals: boolean,
    maxMode: boolean,
    withLyrics: boolean,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
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
        getUseSunoTags: config.getUseSunoTags.bind(config),
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      },
    }, runtime);
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
    targetGenreCount?: number,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
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
        getUseSunoTags: config.getUseSunoTags.bind(config),
        getOllamaEndpoint: () => config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined,
      },
    }, runtime);
  }

  return {
    generateCreativeBoost,
    refineCreativeBoost,
  };
}

export type CreativeBoostMethods = ReturnType<typeof createCreativeBoostMethods>;
