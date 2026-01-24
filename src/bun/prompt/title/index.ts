/**
 * Deterministic Title Generator
 *
 * Generates song titles without LLM calls using genre/mood-based templates.
 *
 * @module prompt/title
 */

// Public API - Generation functions
export { generateDeterministicTitle, generateTitleOptions } from './generator';

// Re-export keyword extraction from unified module for backwards compatibility
export { extractKeywordsForTitle as extractKeywords } from '@bun/keywords';
