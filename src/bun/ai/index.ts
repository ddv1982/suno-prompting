export { AIEngine } from '@bun/ai/engine';
export type { GenerateInitialOptions, RefinePromptOptions } from '@bun/ai/engine';
export type {
  GenerationResult,
  EngineConfig,
  GenerationConfig,
  RefinementConfig,
} from '@bun/ai/types';
export { AIConfig } from '@bun/ai/config';

// Re-export generation and refinement modules for direct usage
export { generateInitial } from '@bun/ai/generation';
export { refinePrompt } from '@bun/ai/refinement';

// Re-export utilities for shared use
export { cleanLyrics, cleanTitle, postProcess } from '@bun/ai/utils';
