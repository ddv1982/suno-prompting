/**
 * Initial Prompt Generation Module
 *
 * Barrel export for generation module. Maintains backward compatibility
 * with existing imports from '@bun/ai/generation'.
 *
 * @module ai/generation
 */

// Main generation function
export { generateInitial } from './generation';

// Types
export type { GenerateInitialOptions, TraceRuntime } from './types';

// Direct mode generation (for advanced use cases)
export { generateDirectMode } from './direct-mode-generation';
