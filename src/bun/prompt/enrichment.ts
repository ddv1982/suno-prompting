/**
 * Centralized Prompt Enrichment Service
 *
 * Re-exports from the enrichment directory for backward compatibility.
 * See @bun/prompt/enrichment/ for implementation details.
 *
 * @module prompt/enrichment
 */

export {
  enrichFromGenres,
  extractGenresFromSunoStyles,
  enrichSunoStyles,
  buildEnrichedSunoStylePrompt,
  hasExtractableGenres,
  buildMaxModeEnrichedLines,
  buildStandardModeEnrichedLines,
  _testHelpers,
} from './enrichment/index';

export type {
  EnrichmentResult,
  EnrichmentOptions,
  EnrichedSunoStyleResult,
} from './enrichment/index';
