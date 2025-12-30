import type { QuickVibesCategory } from '@shared/types';
import { QUICK_VIBES_CATEGORIES, QUICK_VIBES_MAX_CHARS } from '@bun/prompt/quick-vibes-categories';
import { MAX_MODE_HEADER } from '@bun/prompt/realism-tags';
export { stripMaxModeHeader } from '@shared/prompt-utils';

// Lo-fi appropriate realism tags for Max Mode
const LOFI_MAX_TAGS = [
  'vinyl warmth',
  'tape hiss',
  'lo-fi dusty',
  'analog warmth',
  'tape saturation',
] as const;

/**
 * Builds the system prompt for Quick Vibes generation
 */
export function buildQuickVibesSystemPrompt(maxMode: boolean, withWordlessVocals: boolean): string {
  const vocalInstruction = withWordlessVocals 
    ? 'Include WORDLESS vocals only (e.g., "with soft humming", "gentle vocalizations", "ethereal oohs and aahs"). NO actual lyrics or words.'
    : 'This is instrumental music - do NOT mention vocals or singing.';

  const maxModeInstructions = maxMode 
    ? `\n7. Add subtle realism tags if appropriate (e.g., "vinyl warmth", "tape hiss", "lo-fi dusty").`
    : '';

  return `You are a Quick Vibes prompt writer for Suno V5. Generate short, evocative music prompts that capture a mood or atmosphere.

RULES:
1. Output MUST be under ${QUICK_VIBES_MAX_CHARS} characters
2. Focus on VIBE and FEELING, not technical specifications
3. Use vivid, emotional language (dreamy, cozy, warm, chill, mellow)
4. Include activity or setting context when relevant (to study to, for a rainy day)
5. ${vocalInstruction}
6. Do NOT list instruments or technical specs, do NOT use section tags like [VERSE] or [CHORUS]${maxModeInstructions}

OUTPUT: Return ONLY the prompt text, nothing else.`;
}

/**
 * Builds the user prompt for Quick Vibes generation
 */
export function buildQuickVibesUserPrompt(
  category: QuickVibesCategory | null,
  customDescription: string
): string {
  const parts: string[] = [];

  if (category) {
    const catDef = QUICK_VIBES_CATEGORIES[category];
    parts.push(`Category: ${catDef.label}`);
    parts.push(`Keywords: ${catDef.keywords.join(', ')}`);
    parts.push(`Example style: "${catDef.exampleOutput}"`);
  }

  if (customDescription.trim()) {
    parts.push(`User's vibe description: "${customDescription.trim()}"`);
  }

  if (parts.length === 0) {
    parts.push('Generate a generic chill lo-fi vibe prompt.');
  }

  return parts.join('\n');
}

/**
 * Post-processes Quick Vibes output to enforce character limit and clean formatting
 */
export function postProcessQuickVibes(text: string): string {
  // Trim whitespace
  let result = text.trim();
  
  // Remove any markdown code blocks
  result = result.replace(/```[^`]*```/g, '').trim();
  
  // Remove any leaked meta-lines (lines starting with Category:, Keywords:, etc.)
  result = result.split('\n')
    .filter(line => !line.match(/^(Category|Keywords|Example|User's|Note|Output):/i))
    .join(' ')
    .trim();
  
  // Remove any section tags
  result = result.replace(/\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|HOOK|PRE-CHORUS)\]/gi, '').trim();
  
  // Remove double spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  // Remove surrounding quotes if present
  if ((result.startsWith('"') && result.endsWith('"')) || 
      (result.startsWith("'") && result.endsWith("'"))) {
    result = result.slice(1, -1).trim();
  }
  
  // Enforce max length - truncate gracefully at word boundary if needed
  if (result.length > QUICK_VIBES_MAX_CHARS) {
    // Find last space before limit
    const truncated = result.slice(0, QUICK_VIBES_MAX_CHARS);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > QUICK_VIBES_MAX_CHARS * 0.7) {
      result = truncated.slice(0, lastSpace).trim();
    } else {
      result = truncated.trim();
    }
  }
  
  return result;
}

/**
 * Injects lo-fi realism tags for Max Mode if space permits
 */
export function injectQuickVibesMaxTags(prompt: string, maxChars: number): string {
  const shuffled = [...LOFI_MAX_TAGS].sort(() => Math.random() - 0.5);
  const tag = shuffled[0];
  const withTag = `${prompt}, ${tag}`;
  
  if (withTag.length <= maxChars) {
    return withTag;
  }
  return prompt;
}

/**
 * Applies Max Mode processing: injects realism tags and prepends header
 */
export function applyQuickVibesMaxMode(prompt: string, maxMode: boolean, maxChars: number): string {
  if (!maxMode) return prompt;
  
  const withTags = injectQuickVibesMaxTags(prompt, maxChars);
  return `${MAX_MODE_HEADER}\n${withTags}`;
}

/**
 * Builds the system prompt for Quick Vibes refinement
 */
export function buildQuickVibesRefineSystemPrompt(maxMode: boolean, withWordlessVocals: boolean): string {
  const basePrompt = buildQuickVibesSystemPrompt(maxMode, withWordlessVocals);
  
  return `${basePrompt}

You are REFINING an existing Quick Vibes prompt based on user feedback.
Keep the same general vibe but apply the requested changes.`;
}

/**
 * Builds the user prompt for Quick Vibes refinement
 */
export function buildQuickVibesRefineUserPrompt(currentPrompt: string, feedback: string): string {
  return `Current prompt: "${currentPrompt}"

User feedback: ${feedback}

Generate the refined prompt:`;
}
