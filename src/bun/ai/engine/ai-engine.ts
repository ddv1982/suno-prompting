/**
 * AI Engine - Facade for AI Generation Operations
 *
 * Provides a unified interface for AI-powered prompt generation.
 * Delegates to focused modules for specific operations:
 * - generation.ts: Initial prompt generation
 * - refinement.ts: Prompt refinement
 * - quick-vibes-engine.ts: Quick Vibes generation
 * - creative-boost/: Creative Boost generation
 *
 * @module ai/engine/ai-engine
 */

import { AIConfig } from '@bun/ai/config';
import {
  generateInitial as generateInitialImpl,
  type GenerateInitialOptions,
} from '@bun/ai/generation';
import { refinePrompt as refinePromptImpl, type RefinePromptOptions } from '@bun/ai/refinement';
import { remixLyrics as remixLyricsImpl, remixTitle as remixTitleImpl } from '@bun/ai/remix';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';
import { generateDeterministicTitle } from '@bun/prompt/title';

import { createConfigFactories } from './config-factories';
import { createConfigProxies } from './config-proxies';
import { createCreativeBoostMethods } from './creative-boost';
import { createQuickVibesMethods } from './quick-vibes';

import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/**
 * AI Engine - Unified facade for AI generation operations.
 *
 * Handles configuration and delegates to focused modules for:
 * - Initial generation (deterministic or LLM-assisted)
 * - Prompt refinement
 * - Quick Vibes and Creative Boost modes
 * - LLM-based remix operations (title and lyrics)
 *
 * Deterministic remix operations (instruments, genre, mood, etc.)
 * should be imported directly from @bun/prompt/deterministic.
 */
export class AIEngine {
  private config = new AIConfig();
  private proxies = createConfigProxies(this.config);
  private factories = createConfigFactories(this.config, this.proxies);
  private quickVibes = createQuickVibesMethods(this.factories);
  private creativeBoost = createCreativeBoostMethods(this.factories);

  // ==========================================================================
  // Configuration Proxies (delegated)
  // ==========================================================================

  setProvider = this.proxies.setProvider;
  setApiKey = this.proxies.setApiKey;
  setModel = this.proxies.setModel;
  setUseSunoTags = this.proxies.setUseSunoTags;
  setDebugMode = this.proxies.setDebugMode;
  setMaxMode = this.proxies.setMaxMode;
  setLyricsMode = this.proxies.setLyricsMode;
  setStoryMode = this.proxies.setStoryMode;
  setUseLocalLLM = this.proxies.setUseLocalLLM;
  initialize = this.proxies.initialize;
  isDebugMode = this.proxies.isDebugMode;
  isUseLocalLLM = this.proxies.isUseLocalLLM;
  getModel = this.proxies.getModel;
  setOllamaEndpoint = this.proxies.setOllamaEndpoint;
  setOllamaTemperature = this.proxies.setOllamaTemperature;
  setOllamaMaxTokens = this.proxies.setOllamaMaxTokens;
  setOllamaContextLength = this.proxies.setOllamaContextLength;
  getOllamaConfig = this.proxies.getOllamaConfig;

  // ==========================================================================
  // Core Generation & Refinement
  // ==========================================================================

  /**
   * Generate initial prompt.
   *
   * Delegates to generation module which handles:
   * - Lyrics OFF: Fully deterministic path (<50ms, no LLM calls)
   * - Lyrics ON: LLM-assisted path (genre detection, title, lyrics)
   */
  async generateInitial(
    options: GenerateInitialOptions,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ): Promise<GenerationResult> {
    return generateInitialImpl(options, this.factories.getGenerationConfig(), runtime);
  }

  /**
   * Refine existing prompt based on user feedback.
   *
   * Delegates to refinement module which handles LLM-based
   * refinement with fallback on JSON parse failure.
   */
  async refinePrompt(
    options: RefinePromptOptions,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ): Promise<GenerationResult> {
    return refinePromptImpl(options, this.factories.getRefinementConfig(), runtime);
  }

  // ==========================================================================
  // LLM-Based Remix (Title and Lyrics)
  // ==========================================================================

  /**
   * Remix title - uses LLM when available, otherwise deterministic.
   *
   * When lyrics are provided, the LLM generates a title based on lyric content.
   * Uses Ollama model when offline mode is enabled, otherwise cloud provider.
   */
  async remixTitle(
    currentPrompt: string,
    originalInput: string,
    currentLyrics?: string,
    traceRuntime?: { readonly trace?: TraceCollector }
  ): Promise<{ title: string }> {
    // Use LLM for title when lyrics mode is enabled OR when LLM is available
    if (this.config.isLyricsMode() || this.config.isLLMAvailable()) {
      return remixTitleImpl(
        currentPrompt,
        originalInput,
        this.getModel,
        this.config.getOllamaEndpointIfLocal(),
        currentLyrics,
        {
          trace: traceRuntime?.trace,
          traceLabel: 'title.generate',
        }
      );
    }
    const genre = extractGenreFromPrompt(currentPrompt);
    const mood = extractMoodFromPrompt(currentPrompt);
    return { title: generateDeterministicTitle(genre, mood) };
  }

  /**
   * Remix lyrics using LLM.
   *
   * Uses Ollama model when offline mode is enabled, otherwise cloud provider.
   */
  async remixLyrics(
    currentPrompt: string,
    originalInput: string,
    lyricsTopic?: string
  ): Promise<{ lyrics: string }> {
    return remixLyricsImpl(
      currentPrompt,
      originalInput,
      lyricsTopic,
      this.config.isMaxMode(),
      this.getModel,
      this.config.getUseSunoTags(),
      this.config.isUseLocalLLM(),
      this.config.getOllamaEndpoint()
    );
  }

  // ==========================================================================
  // Quick Vibes (delegated)
  // ==========================================================================

  generateQuickVibes = this.quickVibes.generateQuickVibes;
  refineQuickVibes = this.quickVibes.refineQuickVibes;

  // ==========================================================================
  // Creative Boost (delegated)
  // ==========================================================================

  generateCreativeBoost = this.creativeBoost.generateCreativeBoost;
  refineCreativeBoost = this.creativeBoost.refineCreativeBoost;
}
