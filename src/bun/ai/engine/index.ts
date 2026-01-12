/**
 * AI Engine Module
 *
 * Re-exports for backward compatibility.
 * All existing imports from '@bun/ai/engine' will continue to work.
 *
 * @module ai/engine
 */

export { AIEngine } from './ai-engine';

// Re-export types for backward compatibility
export type { GenerationResult, ParsedCombinedResponse } from '@bun/ai/types';
export type { GenerateInitialOptions } from '@bun/ai/generation';
export type { RefinePromptOptions } from '@bun/ai/refinement';
