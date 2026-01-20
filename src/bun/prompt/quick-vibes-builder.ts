import { QUICK_VIBES_CATEGORIES, QUICK_VIBES_GENERATION_LIMIT } from '@bun/prompt/quick-vibes-categories';
import { WORDLESS_VOCALS_GUIDANCE } from '@bun/prompt/shared-instructions';
import { MAX_MODE_HEADER } from '@bun/prompt/tags';

import type { QuickVibesCategory } from '@shared/types';
export { stripMaxModeHeader } from '@shared/prompt-utils';

/**
 * Builds the system prompt for Quick Vibes generation
 */
function buildQuickVibesSystemPrompt(_maxMode: boolean, withWordlessVocals: boolean): string {
  const vocalInstruction = withWordlessVocals 
    ? WORDLESS_VOCALS_GUIDANCE
    : 'This is instrumental music - do NOT mention vocals or singing.';

  return `You are a Quick Vibes prompt writer for Suno V5. Generate short, evocative music prompts that capture a mood or atmosphere.

RULES:
1. Output MUST be under ${QUICK_VIBES_GENERATION_LIMIT} characters - be CONCISE
2. Focus on VIBE and FEELING, not technical specifications
3. Use vivid, emotional language (dreamy, cozy, warm, chill, mellow)
4. Include activity or setting context when relevant (to study to, for a rainy day)
5. ${vocalInstruction}
6. Do NOT list instruments or technical specs, do NOT use section tags like [VERSE] or [CHORUS]

OUTPUT: Return ONLY the prompt text, nothing else.`;
}

/**
 * Builds the user prompt for Quick Vibes generation
 */
function buildQuickVibesUserPrompt(
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
    .filter(line => !(/^(Category|Keywords|Example|User's|Note|Output):/i.exec(line)))
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
  if (result.length > QUICK_VIBES_GENERATION_LIMIT) {
    // Find last space before limit
    const truncated = result.slice(0, QUICK_VIBES_GENERATION_LIMIT);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > QUICK_VIBES_GENERATION_LIMIT * 0.7) {
      result = truncated.slice(0, lastSpace).trim();
    } else {
      result = truncated.trim();
    }
  }
  
  return result;
}

/**
 * Applies Max Mode processing: prepends header only (no realism tags for purer genres)
 */
export function applyQuickVibesMaxMode(prompt: string, maxMode: boolean): string {
  if (!maxMode) return prompt;
  return `${MAX_MODE_HEADER}\n${prompt}`;
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
export function buildQuickVibesRefineUserPrompt(
  currentPrompt: string, 
  feedback: string,
  category?: QuickVibesCategory | null
): string {
  let prompt = `Current prompt: "${currentPrompt}"`;

  if (feedback.trim()) {
    prompt += `\n\nUser feedback: ${feedback}`;
  }

  if (category) {
    const catDef = QUICK_VIBES_CATEGORIES[category];
    prompt += `\n\nRefine toward this category style:
- Category: ${catDef.label}
- Keywords: ${catDef.keywords.join(', ')}`;
  }

  prompt += `\n\nGenerate the refined prompt:`;
  return prompt;
}

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 */
export const _testHelpers = {
  buildQuickVibesSystemPrompt,
  buildQuickVibesUserPrompt,
} as const;
