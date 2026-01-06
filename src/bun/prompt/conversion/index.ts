/**
 * Prompt Conversion Services
 *
 * Converts prompts between max and non-max Suno formats.
 *
 * @module prompt/conversion
 */

// Public API - Max Mode Conversion
export {
  convertToMaxFormat,
  enhanceWithAI,
  buildMaxFormatPrompt,
  isMaxFormat,
  // Re-exports for backwards compatibility
  DEFAULT_BPM,
  DEFAULT_GENRE,
  DEFAULT_INSTRUMENTS_FALLBACK,
  GENRE_ALIASES,
  normalizeGenre,
  inferBpm,
  enhanceInstruments,
  resolveGenre,
  // Parsing
  parseNonMaxPrompt,
} from './max';

// Public API - Non-Max Mode Conversion
export {
  convertToNonMaxFormat,
  buildNonMaxFormatPrompt,
  // Parsing
  parseStyleDescription,
  // Re-exports for backwards compatibility
  extractFirstGenre,
} from './non-max';

// Public API - Types
export type {
  SectionContent,
  ParsedMaxPrompt,
  AIEnhancementResult,
  MaxFormatFields,
  MaxConversionResult,
  ParsedStyleDescription,
  NonMaxSectionContent,
  NonMaxFormatFields,
  NonMaxConversionResult,
} from './types';

// Re-export for backwards compatibility
export type { ConversionOptions } from '@shared/types';
