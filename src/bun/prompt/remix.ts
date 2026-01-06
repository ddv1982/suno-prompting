/**
 * Remix Utilities
 *
 * Functions for replacing specific fields in Suno prompts.
 * Supports both MAX MODE (lowercase, quoted) and STANDARD MODE (capitalized) formats.
 *
 * @module prompt/remix
 */

import { createLogger } from '@bun/logger';

const log = createLogger('Remix');

/**
 * Replace a field line in a prompt with a new value.
 * Handles both MAX MODE format (lowercase with quotes) and STANDARD MODE format (capitalized).
 *
 * @param prompt - The prompt text to modify
 * @param field - The field name to replace (Genre, Mood, Instruments, or BPM)
 * @param value - The new value for the field
 * @returns Modified prompt with the field replaced, or original if field not found
 *
 * @example
 * // MAX MODE format
 * replaceFieldLine('genre: "jazz"\nbpm: "120"', 'Genre', 'rock')
 * // Returns: 'genre: "rock"\nbpm: "120"'
 *
 * @example
 * // STANDARD MODE format
 * replaceFieldLine('Genre: Jazz\nBPM: 120', 'Genre', 'Rock')
 * // Returns: 'Genre: Rock\nBPM: 120'
 */
export function replaceFieldLine(prompt: string, field: 'Genre' | 'Mood' | 'Instruments' | 'BPM', value: string): string {
  // Try max mode format first (lowercase with quotes): genre: "value"
  const maxModeRegex = new RegExp(`^${field.toLowerCase()}:\\s*"[^"]*"`, 'mi');
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `${field.toLowerCase()}: "${value}"`);
  }
  
  // Try regular mode format (capitalized without quotes): Genre: value
  const regularRegex = new RegExp(`^${field}:.*$`, 'm');
  if (regularRegex.test(prompt)) {
    return prompt.replace(regularRegex, `${field}: ${value}`);
  }
  
  log.warn('replaceFieldLine:field_not_found', { field });
  return prompt;
}

/**
 * Replace the style tags line in a prompt with a new value.
 * Handles both MAX MODE format (lowercase) and STANDARD MODE format (capitalized).
 *
 * @param prompt - The prompt text to modify
 * @param value - The new style tags value
 * @returns Modified prompt with style tags replaced, or original if field not found
 *
 * @example
 * replaceStyleTagsLine('style tags: "warm, analog"', 'bright, digital')
 * // Returns: 'style tags: "bright, digital"'
 */
export function replaceStyleTagsLine(prompt: string, value: string): string {
  // Try max mode format (lowercase): style tags: "value"
  const maxModeRegex = /^style tags:.*$/mi;
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `style tags: "${value}"`);
  }
  
  // Try standard mode format (capitalized): Style Tags: value
  const standardRegex = /^Style Tags:.*$/m;
  if (standardRegex.test(prompt)) {
    return prompt.replace(standardRegex, `Style Tags: ${value}`);
  }
  
  log.warn('replaceStyleTagsLine:field_not_found');
  return prompt;
}

/**
 * Replace the recording line in a prompt with a new value.
 * Handles both MAX MODE format (lowercase) and STANDARD MODE format (capitalized).
 *
 * @param prompt - The prompt text to modify
 * @param value - The new recording context value
 * @returns Modified prompt with recording replaced, or original if field not found
 *
 * @example
 * replaceRecordingLine('recording: "studio session"', 'live concert')
 * // Returns: 'recording: "live concert"'
 */
export function replaceRecordingLine(prompt: string, value: string): string {
  // Try max mode format (lowercase): recording: "value"
  const maxModeRegex = /^recording:.*$/mi;
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `recording: "${value}"`);
  }
  
  // Try standard mode format (capitalized): Recording: value
  const standardRegex = /^Recording:.*$/m;
  if (standardRegex.test(prompt)) {
    return prompt.replace(standardRegex, `Recording: ${value}`);
  }
  
  log.warn('replaceRecordingLine:field_not_found');
  return prompt;
}
