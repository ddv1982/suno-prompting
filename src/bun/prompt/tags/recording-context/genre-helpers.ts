/**
 * Genre-aware selection helpers for recording contexts
 * @module prompt/tags/recording-context/genre-helpers
 */

import { RECORDING_ENVIRONMENT } from './categories';

/**
 * Check if genre matches electronic patterns
 */
export function isElectronic(normalized: string): boolean {
  return (
    normalized.includes('electronic') ||
    normalized.includes('edm') ||
    normalized.includes('house') ||
    normalized.includes('techno') ||
    normalized.includes('trap') ||
    normalized.includes('dubstep')
  );
}

/**
 * Check if genre matches acoustic/vintage patterns
 */
export function isAcousticVintage(normalized: string): boolean {
  return (
    normalized.includes('folk') ||
    normalized.includes('blues') ||
    normalized.includes('jazz') ||
    normalized.includes('soul') ||
    normalized.includes('vintage') ||
    normalized.includes('retro')
  );
}

/**
 * Check if genre matches modern pop/rock patterns
 */
export function isModernPopRock(normalized: string): boolean {
  return normalized.includes('pop') || normalized.includes('rock') || normalized.includes('indie');
}

/**
 * Check if genre matches classical/orchestral patterns
 */
export function isClassicalOrchestral(normalized: string): boolean {
  return (
    normalized.includes('classical') ||
    normalized.includes('orchestral') ||
    normalized.includes('symphonic')
  );
}

/**
 * Check if genre matches jazz/blues patterns
 */
export function isJazzBlues(normalized: string): boolean {
  return normalized.includes('jazz') || normalized.includes('blues');
}

/**
 * Check if genre matches lo-fi/bedroom patterns
 */
export function isLoFiBedroom(normalized: string): boolean {
  return (
    normalized.includes('lofi') || normalized.includes('lo-fi') || normalized.includes('bedroom')
  );
}

/**
 * Check if genre matches punk/garage patterns
 */
export function isPunkGarage(normalized: string): boolean {
  return normalized.includes('punk') || normalized.includes('garage');
}

/**
 * Determine preferred recording technique based on genre
 */
export function getPreferredTechnique(genre?: string): 'analog' | 'digital' | 'hybrid' | null {
  if (!genre) return null;

  const normalized = genre.toLowerCase();

  // Electronic genres prefer digital
  if (isElectronic(normalized)) return 'digital';

  // Vintage/acoustic genres prefer analog
  if (isAcousticVintage(normalized)) return 'analog';

  // Modern pop/rock can use hybrid
  if (isModernPopRock(normalized)) return 'hybrid';

  return null;
}

/**
 * Determine preferred environment based on genre
 */
export function getPreferredEnvironment(genre?: string): keyof typeof RECORDING_ENVIRONMENT | null {
  if (!genre) return null;

  const normalized = genre.toLowerCase();

  // Classical/orchestral prefer live venues
  if (isClassicalOrchestral(normalized)) return 'live';

  // Jazz/blues often recorded live
  if (isJazzBlues(normalized)) return 'live';

  // Lo-fi/bedroom pop prefer home
  if (isLoFiBedroom(normalized)) return 'home';

  // Punk/garage prefer rehearsal
  if (isPunkGarage(normalized)) return 'rehearsal';

  return null;
}
