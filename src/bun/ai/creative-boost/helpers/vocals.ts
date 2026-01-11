/**
 * Creative Boost Vocal Injection
 *
 * Wordless vocals injection utilities.
 *
 * @module ai/creative-boost/helpers/vocals
 */

/**
 * Inject wordless vocals into the instruments line of a prompt.
 * Handles both MAX mode (instruments: "...") and standard mode (Instruments: ...) formats.
 */
export function injectWordlessVocals(prompt: string): string {
  // Match instruments line in both formats
  const maxModePattern = /(instruments:\s*"[^"]+)/i;
  const standardModePattern = /(Instruments:\s*[^\n]+)/i;

  // Try MAX mode format first
  if (maxModePattern.test(prompt)) {
    return prompt.replace(maxModePattern, '$1, wordless vocals');
  }

  // Try standard mode format
  if (standardModePattern.test(prompt)) {
    return prompt.replace(standardModePattern, '$1, wordless vocals');
  }

  // If no instruments line found, return unchanged
  return prompt;
}
