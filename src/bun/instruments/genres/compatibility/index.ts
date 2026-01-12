/**
 * Genre Compatibility Module
 *
 * Re-exports all compatibility-related types, data, and functions.
 *
 * @module instruments/genres/compatibility
 */

// Types and constants
export { type CompatibilityScore, FUSION_THRESHOLD } from './types';

// Data
export { GENRE_COMPATIBILITY } from './matrix';

// Functions
export { getCompatibilityScore, canFuse, isValidScore, getCompatibleGenres } from './functions';
