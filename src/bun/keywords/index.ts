/**
 * Unified Keyword Matching System
 *
 * Provides efficient, cached keyword extraction from text descriptions.
 * Centralizes all keyword matching logic with lazy-compiled regex patterns
 * and result caching for performance.
 *
 * @module keywords
 */

export {
  matches,
  matchKeywords,
  matchRegistry,
  matchMapping,
  clearCache,
  getCacheStats,
} from './matcher';

export {
  extractAllKeywords,
  extractMoods,
  extractThemes,
  extractEnrichment,
  extractKeywordsForTitle,
  extractHarmonicComplexity,
  extractPriorityMoods,
  hasKeywords,
} from './extractor';

export type {
  Intent,
  KeywordCategory,
  KeywordExtractionResult,
  KeywordMapping,
  KeywordRegistry,
  MatchOptions,
} from './types';
