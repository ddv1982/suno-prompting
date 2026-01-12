/**
 * Recording context descriptors and genre-specific recording environments
 * 
 * This module provides conflict-free recording descriptor selection with
 * genre-aware intelligence to ensure musically coherent combinations.
 * 
 * @module prompt/tags/recording-context
 */

// Export structured categories
export {
  MAX_RECORDING_DESCRIPTORS,
  RECORDING_CHARACTER,
  RECORDING_ENVIRONMENT,
  RECORDING_PRODUCTION_QUALITY,
  RECORDING_TECHNIQUE,
} from './categories';

// Legacy export (deprecated - kept for backward compatibility, will be removed in v3.0.0)
// eslint-disable-next-line @typescript-eslint/no-deprecated
export { RECORDING_DESCRIPTORS } from './categories';

// Export context selection
export { selectRecordingContext } from './context';

// Export descriptor selection
export { selectRecordingDescriptors } from './descriptors';

// Export genre contexts
export { GENRE_RECORDING_CONTEXTS } from './genre-contexts';

// Export genre-aware helpers (for advanced usage)
export {
  getPreferredEnvironment,
  getPreferredTechnique,
  isAcousticVintage,
  isClassicalOrchestral,
  isElectronic,
  isJazzBlues,
  isLoFiBedroom,
  isModernPopRock,
  isPunkGarage,
} from './genre-helpers';

// Export utility helpers (for advanced usage)
export { selectFromSubcategory, selectRandomKey } from './helpers';
