export { AIEngine } from '@bun/ai/engine';
export type { GenerateInitialOptions, RefinePromptOptions } from '@bun/ai/engine';
export type {
  GenerationResult,
  ParsedCombinedResponse,
  DebugInfoBuilder,
  GenerationConfig,
  RefinementConfig,
} from '@bun/ai/types';
export { AIConfig } from '@bun/ai/config';

// Re-export generation and refinement modules for direct usage
export { generateInitial } from '@bun/ai/generation';
export { refinePrompt } from '@bun/ai/refinement';
