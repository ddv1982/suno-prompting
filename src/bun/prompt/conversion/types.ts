/**
 * Shared types for conversion modules
 *
 * Contains common type definitions used by both max and non-max
 * conversion modules.
 *
 * @module prompt/conversion/types
 */


// =============================================================================
// Max Mode Types
// =============================================================================

/**
 * Section content extracted from a prompt
 */
export interface SectionContent {
  tag: string;
  content: string;
}

/**
 * Parsed prompt structure from max mode parsing.
 * Supports both simple prompts and full standard mode format.
 */
export interface ParsedMaxPrompt {
  description: string;
  genre: string | null;
  moods: string[];
  instruments: string[];
  sections: SectionContent[];
  /** Style tags extracted from standard mode (if present) */
  styleTags?: string;
  /** Recording context extracted from standard mode (if present) */
  recording?: string;
  /** BPM value or range extracted from standard mode (if present) */
  bpm?: string;
}

/**
 * AI enhancement result for max mode conversion
 */
export interface AIEnhancementResult {
  styleTags: string;
  recording: string;
}

/**
 * Fields required for max format output
 */
export interface MaxFormatFields {
  genre: string;
  bpm: string | number;
  instruments: string;
  styleTags: string;
  recording: string;
}

/**
 * Result from max mode conversion
 */
export interface MaxConversionResult {
  convertedPrompt: string;
  wasConverted: boolean;
}

// =============================================================================
// Non-Max Mode Types
// =============================================================================

/**
 * Parsed style description for non-max mode
 */
export interface ParsedStyleDescription {
  description: string;
  detectedGenre: string | null;
  detectedMoods: string[];
  detectedInstruments: string[];
}

/**
 * Section content for non-max format
 */
export interface NonMaxSectionContent {
  intro: string;
  verse: string;
  chorus: string;
  bridge?: string;
  outro: string;
}

/**
 * Fields required for non-max format output
 */
export interface NonMaxFormatFields {
  genre: string;
  bpm: string | number;
  mood: string;
  instruments: string;
  sections: NonMaxSectionContent;
}

/**
 * Result from non-max mode conversion
 */
export interface NonMaxConversionResult {
  convertedPrompt: string;
  wasConverted: boolean;
}
