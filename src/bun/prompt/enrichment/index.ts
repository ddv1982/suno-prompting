/**
 * Prompt Enrichment Module
 *
 * Barrel export for enrichment module. Maintains backward compatibility
 * with existing imports from '@bun/prompt/enrichment'.
 *
 * @module prompt/enrichment
 */

// Main enrichment functions
export {
  enrichFromGenres,
  extractGenresFromSunoStyles,
  enrichSunoStyles,
  buildEnrichedSunoStylePrompt,
  hasExtractableGenres,
  _testHelpers,
} from './enrichment';

// Formatters
export {
  buildMaxModeEnrichedLines,
  buildStandardModeEnrichedLines,
  buildEnrichedPromptString,
} from './formatters';

// Types
export type {
  EnrichmentResult,
  EnrichmentOptions,
  EnrichedSunoStyleResult,
} from './types';
