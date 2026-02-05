/**
 * Prompt Construction Functions
 *
 * Builds JSON input and user prompts for story generation LLM calls.
 *
 * @module ai/story-generator/builders
 */

import type { StoryGenerationInput } from './index';

/**
 * Set optional field on object if value is truthy.
 */
export function setIfTruthy(obj: Record<string, unknown>, key: string, value: unknown): void {
  if (value) {
    obj[key] = value;
  }
}

/**
 * Set optional array field on object if array has items.
 */
export function setIfHasItems(
  obj: Record<string, unknown>,
  key: string,
  value: readonly unknown[] | undefined
): void {
  if (value && value.length > 0) {
    obj[key] = value;
  }
}

/**
 * Build the JSON input object for story generation.
 */
export function buildStoryJsonInput(input: StoryGenerationInput): Record<string, unknown> {
  const jsonInput: Record<string, unknown> = {
    genre: input.genre,
    bpmRange: input.bpmRange,
  };

  setIfHasItems(jsonInput, 'subGenres', input.subGenres);
  setIfTruthy(jsonInput, 'key', input.key);
  setIfHasItems(jsonInput, 'moods', input.moods);
  setIfHasItems(jsonInput, 'instruments', input.instruments);
  setIfHasItems(jsonInput, 'styleTags', input.styleTags);
  setIfTruthy(jsonInput, 'recordingContext', input.recordingContext);
  setIfHasItems(jsonInput, 'themes', input.themes);
  setIfTruthy(jsonInput, 'scene', input.scene);
  setIfTruthy(jsonInput, 'era', input.era);
  setIfTruthy(jsonInput, 'energyLevel', input.energyLevel);

  return jsonInput;
}

/**
 * Build the user prompt from structured input.
 */
export function buildStoryUserPrompt(input: StoryGenerationInput): string {
  const parts: string[] = ['Transform this musical data into narrative prose:'];
  parts.push('');

  const jsonInput = buildStoryJsonInput(input);
  parts.push(JSON.stringify(jsonInput, null, 2));

  if (input.isDirectMode && input.sunoStyles?.length) {
    parts.push('');
    parts.push(
      'Important: Incorporate these Suno V5 styles naturally: ' + input.sunoStyles.join(', ')
    );
  }

  return parts.join('\n');
}
