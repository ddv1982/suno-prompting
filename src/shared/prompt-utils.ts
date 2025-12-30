/**
 * Strips MAX_MODE_HEADER from prompt if present
 * Used for accurate character counting (header is metadata, not content)
 */
export function stripMaxModeHeader(prompt: string): string {
  if (prompt.startsWith('[Is_MAX_MODE:')) {
    const lines = prompt.split('\n');
    const contentStart = lines.findIndex((line, i) => i > 0 && !line.startsWith('['));
    if (contentStart > 0) {
      return lines.slice(contentStart).join('\n').trim();
    }
  }
  return prompt;
}
