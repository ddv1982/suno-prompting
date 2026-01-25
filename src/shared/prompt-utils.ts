import { isMaxFormat } from '@shared/max-format';

/**
 * Cleans JSON response from LLM by removing markdown code blocks.
 * Handles common LLM output patterns like:
 * - ```json\n{...}\n```
 * - ``` followed by code blocks
 * 
 * @param text - Raw LLM response text
 * @returns Cleaned text ready for JSON.parse
 */
export function cleanJsonResponse(text: string): string {
  return text.trim().replace(/```json\n?|\n?```/g, '');
}

/**
 * Strips MAX_MODE_HEADER from prompt if present.
 *
 * Two formats exist due to evolution of the codebase:
 * - Standard format ([Is_MAX_MODE:...]) - original header used by most code paths
 * - Suno V5 tags format (::tags...) - newer format used by deterministic builder
 *
 * Used for accurate character counting (header is metadata, not content).
 */
export function stripMaxModeHeader(prompt: string): string {
  // Standard format used by max-conversion.ts, context-preservation.ts, etc.
  if (prompt.startsWith('[Is_MAX_MODE:')) {
    const lines = prompt.split('\n');
    const contentStart = lines.findIndex((line, i) => i > 0 && !line.startsWith('['));
    if (contentStart > 0) {
      return lines.slice(contentStart).join('\n').trim();
    }
  }

  // Suno V5 tags format used by deterministic-builder.ts for faster generation
  if (prompt.startsWith('::tags')) {
    const lines = prompt.split('\n');
    const contentStart = lines.findIndex((line, i) => i > 0 && !line.startsWith('::'));
    if (contentStart > 0) {
      return lines.slice(contentStart).join('\n').trim();
    }
  }

  return prompt;
}

/**
 * Detects if text is a structured prompt (vs a simple description/narrative).
 * Used to determine if auto-conversion should be applied and if field remix buttons should show.
 * 
 * Detects:
 * - Non-max structured prompts (Genre:, BPM:, section tags)
 * - Max format body with structured fields (genre: "...", bpm: "...")
 * 
 * Important: For MAX-formatted text, we analyze the BODY content after stripping the header.
 * This allows Story Mode + MAX Mode output (header + narrative prose) to be correctly
 * identified as non-structured.
 * 
 * @param text - The input text to analyze
 * @returns true if text appears to be a structured prompt, false if it's narrative prose
 */
export function isStructuredPrompt(text: string): boolean {
  // Strip MAX header if present to analyze the body content
  const bodyText = stripMaxModeHeader(text);
  
  // If we stripped a header and only have whitespace/empty, it's not structured
  if (isMaxFormat(text) && bodyText.trim().length === 0) {
    return false;
  }
  
  // Check for non-max format field markers (Capitalized: value)
  // e.g., "Genre: rock", "BPM: 120", "Mood: energetic"
  const hasNonMaxFields = /^(Genre|BPM|Mood|Instruments):\s*\S/mi.test(bodyText);
  
  // Check for section tags
  // e.g., [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
  const hasSectionTags = /\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|HOOK|PRE-CHORUS)\]/i.test(bodyText);
  
  // Check for max format style fields (lowercase: "quoted")
  // e.g., genre: "jazz", bpm: "110", instruments: "..."
  const hasMaxStyleFields = /^(genre|bpm|instruments|style tags|recording):\s*"/mi.test(bodyText);
  
  return hasNonMaxFields || hasSectionTags || hasMaxStyleFields;
}

/**
 * Detects if prompt is in story mode format (narrative prose without structured fields).
 * Story mode output is flowing prose, NOT structured like "Genre: jazz\nMood: warm..."
 * 
 * Used to determine if field-specific remix buttons should be shown.
 * Returns true for empty/whitespace prompts since there are no fields to remix.
 * 
 * @param text - The prompt text to analyze
 * @returns true if text is narrative prose or empty (no structured fields), false if structured
 */
export function isStoryModeFormat(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  return !isStructuredPrompt(text);
}
