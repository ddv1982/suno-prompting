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
 * @module ai/engine
 */

import { type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';
import {
  generateCreativeBoost as generateCreativeBoostImpl,
  refineCreativeBoost as refineCreativeBoostImpl,
} from '@bun/ai/creative-boost';
import { generateInitial as generateInitialImpl, type GenerateInitialOptions } from '@bun/ai/generation';
import {
  generateQuickVibes as generateQuickVibesImpl,
  refineQuickVibes as refineQuickVibesImpl,
} from '@bun/ai/quick-vibes-engine';
import { refinePrompt as refinePromptImpl, type RefinePromptOptions } from '@bun/ai/refinement';
import { remixLyrics as remixLyricsImpl } from '@bun/ai/remix';
import { buildDebugInfo, postProcess } from '@bun/ai/utils';

import type { GenerationConfig, GenerationResult, RefinementConfig } from '@bun/ai/types';
import type { DebugInfo, QuickVibesCategory } from '@shared/types';

// Re-export types and options for backwards compatibility
export type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';
export type { GenerateInitialOptions } from '@bun/ai/generation';
export type { RefinePromptOptions } from '@bun/ai/refinement';

/**
 * AI Engine - Unified facade for AI generation operations.
 *
 * Handles configuration and delegates to focused modules for:
 * - Initial generation (deterministic or LLM-assisted)
 * - Prompt refinement
 * - Quick Vibes and Creative Boost modes
 * - LLM-based remix operations (lyrics only)
 *
 * Deterministic remix operations (instruments, genre, mood, etc.)
 * should be imported directly from @bun/prompt/deterministic.
 */
export class AIEngine {
  private config = new AIConfig();

  // ==========================================================================
  // Configuration Proxies
  // ==========================================================================

  setProvider = this.config.setProvider.bind(this.config);
  setApiKey = this.config.setApiKey.bind(this.config);
  setModel = this.config.setModel.bind(this.config);
  setUseSunoTags = this.config.setUseSunoTags.bind(this.config);
  setDebugMode = this.config.setDebugMode.bind(this.config);
  setMaxMode = this.config.setMaxMode.bind(this.config);
  setLyricsMode = this.config.setLyricsMode.bind(this.config);
  initialize = this.config.initialize.bind(this.config);
  isDebugMode = this.config.isDebugMode.bind(this.config);
  getModel = (): LanguageModel => this.config.getModel();

  // ==========================================================================
  // Shared Utilities (delegated to ai/utils.ts)
  // ==========================================================================

  /**
   * Build debug information from LLM interaction.
   * Wraps the standalone utility to inject model/provider context.
   */
  private buildDebugInfoInternal(
    systemPrompt: string,
    userPrompt: string,
    rawResponse: string,
    messages?: Array<{ role: string; content: string }>
  ): DebugInfo {
    return buildDebugInfo(
      systemPrompt,
      userPrompt,
      rawResponse,
      this.config.getModelName(),
      this.config.getProvider(),
      messages
    );
  }

  /**
   * Post-process generated text (condense, dedupe, remove meta).
   * Wraps the standalone utility to inject model getter.
   */
  private async postProcessInternal(text: string): Promise<string> {
    return postProcess(text, this.getModel);
  }

  // ==========================================================================
  // Config Factories for Modules
  // ==========================================================================

  /**
   * Get configuration for generation module.
   */
  private getGenerationConfig(): GenerationConfig {
    return {
      getModel: this.getModel,
      isDebugMode: this.config.isDebugMode.bind(this.config),
      isMaxMode: this.config.isMaxMode.bind(this.config),
      isLyricsMode: this.config.isLyricsMode.bind(this.config),
      getUseSunoTags: this.config.getUseSunoTags.bind(this.config),
      getModelName: this.config.getModelName.bind(this.config),
      getProvider: this.config.getProvider.bind(this.config),
    };
  }

  /**
   * Get configuration for refinement module.
   */
  private getRefinementConfig(): RefinementConfig {
    return {
      ...this.getGenerationConfig(),
      postProcess: this.postProcessInternal.bind(this),
      buildDebugInfo: this.buildDebugInfoInternal.bind(this),
    };
  }

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
  async generateInitial(options: GenerateInitialOptions): Promise<GenerationResult> {
    return generateInitialImpl(options, this.getGenerationConfig());
  }

  /**
   * Refine existing prompt based on user feedback.
   *
   * Delegates to refinement module which handles LLM-based
   * refinement with fallback on JSON parse failure.
   */
  async refinePrompt(options: RefinePromptOptions): Promise<GenerationResult> {
    return refinePromptImpl(options, this.getRefinementConfig());
  }

  // ==========================================================================
  // LLM-Based Remix (Lyrics Only)
  // ==========================================================================

  /**
   * Remix lyrics using LLM.
   *
   * Note: Deterministic remix operations (instruments, genre, mood, etc.)
   * should be imported directly from @bun/prompt/deterministic.
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
      this.config.getUseSunoTags()
    );
  }

  // ==========================================================================
  // Quick Vibes
  // ==========================================================================

  async generateQuickVibes(
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean,
    sunoStyles: string[]
  ): Promise<GenerationResult> {
    return generateQuickVibesImpl(
      { category, customDescription, withWordlessVocals, sunoStyles },
      {
        getModel: this.getModel,
        isMaxMode: this.config.isMaxMode.bind(this.config),
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfoInternal.bind(this),
      }
    );
  }

  async refineQuickVibes(options: {
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
        getModel: this.getModel,
        isMaxMode: this.config.isMaxMode.bind(this.config),
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfoInternal.bind(this),
      }
    );
  }

  // ==========================================================================
  // Creative Boost
  // ==========================================================================

  async generateCreativeBoost(
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
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfoInternal.bind(this),
        getUseSunoTags: this.config.getUseSunoTags.bind(this.config),
      },
    });
  }

  async refineCreativeBoost(
    currentPrompt: string,
    currentTitle: string,
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
        getModel: this.getModel,
        isDebugMode: this.config.isDebugMode.bind(this.config),
        buildDebugInfo: this.buildDebugInfoInternal.bind(this),
        getUseSunoTags: this.config.getUseSunoTags.bind(this.config),
      },
    });
  }
}
