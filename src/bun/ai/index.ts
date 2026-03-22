export { AIEngine } from '@bun/ai/engine';
export type { GenerateInitialOptions, RefinePromptOptions } from '@bun/ai/engine';
export type {
  GenerationResult,
  EngineConfig,
  GenerationConfig,
  RefinementConfig,
} from '@bun/ai/types';
export { AIConfig } from '@bun/ai/config';
export { createGenerationRequestConfig } from '@bun/ai/core/request-config-factory';
export { buildGenerationPolicy } from '@bun/ai/core/policy';
export { generateDirectModeTitle } from '@bun/ai/direct-mode-title';
export { runAIRequest } from '@bun/ai/request-runner';
export { generateStructuredOutput } from '@bun/ai/structured-output';
export type {
  AIRequestConfig,
  GenerationPolicySnapshot,
  GenerationRequestConfig,
} from '@bun/ai/core/request-config';
export type { AIRequestOptions } from '@bun/ai/request-runner';

// Re-export generation and refinement modules for direct usage
export { generateInitial } from '@bun/ai/generation';
export { refinePrompt } from '@bun/ai/refinement';

// Re-export utilities for shared use
export { cleanLyrics, cleanTitle, postProcess } from '@bun/ai/utils';
