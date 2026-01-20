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
 * Detects if text is a structured prompt (vs a simple description).
 * Used to determine if auto-conversion should be applied.
 * 
 * Detects:
 * - Max format prompts (with header)
 * - Non-max structured prompts (Genre:, BPM:, section tags)
 * - Max format body without header (genre: "...", bpm: "...")
 * 
 * @param text - The input text to analyze
 * @returns true if text appears to be a structured prompt, false if it's a simple description
 */
export function isStructuredPrompt(text: string): boolean {
  // 1. Check for max format header
  if (isMaxFormat(text)) return true;
  
  // 2. Check for non-max format field markers (Capitalized: value)
  //    e.g., "Genre: rock", "BPM: 120", "Mood: energetic"
  const hasNonMaxFields = /^(Genre|BPM|Mood|Instruments):\s*\S/mi.test(text);
  
  // 3. Check for section tags
  //    e.g., [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
  const hasSectionTags = /\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|HOOK|PRE-CHORUS)\]/i.test(text);
  
  // 4. Check for max format style fields WITHOUT header (lowercase: "quoted")
  //    e.g., genre: "jazz", bpm: "110", instruments: "..."
  const hasMaxStyleFields = /^(genre|bpm|instruments|style tags|recording):\s*"/mi.test(text);
  
  return hasNonMaxFields || hasSectionTags || hasMaxStyleFields;
}

/**
 * Clean and normalize a title string.
 * Removes leading/trailing quotes and whitespace.
 */
export function cleanTitle(title: string | undefined, fallback = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

/**
 * Clean lyrics string, returning undefined for empty/whitespace.
 */
export function cleanLyrics(lyrics: string | undefined): string | undefined {
  return lyrics?.trim() || undefined;
}

export interface ParsedCombinedResponse {
  prompt: string;
  title?: string;
  lyrics?: string;
}

/**
 * Parse a combined JSON response from LLM (prompt + optional title/lyrics).
 * Returns null if parsing fails or prompt is missing.
 */
export function parseJsonResponse(rawResponse: string): ParsedCombinedResponse | null {
  try {
    const cleaned = cleanJsonResponse(rawResponse);
    const parsed = JSON.parse(cleaned) as ParsedCombinedResponse;
    if (!parsed.prompt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
