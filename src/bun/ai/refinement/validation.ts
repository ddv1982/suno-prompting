/**
 * Refinement Validation Logic
 *
 * Contains validation functions for refinement operations,
 * including Ollama availability checks and locked phrase handling.
 *
 * @module ai/refinement/validation
 */

import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { createLogger } from '@bun/logger';
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

const log = createLogger('RefinementValidation');

/**
 * Validate Ollama availability for offline mode.
 *
 * @throws {OllamaUnavailableError} When Ollama is not running
 * @throws {OllamaModelMissingError} When Gemma model is missing
 */
export async function validateOllamaForRefinement(endpoint: string): Promise<void> {
  const status = await checkOllamaAvailable(endpoint);

  if (!status.available) {
    throw new OllamaUnavailableError(endpoint);
  }

  if (!status.hasGemma) {
    throw new OllamaModelMissingError('gemma3:4b');
  }

  log.info('refinePrompt:usingOllama', { endpoint });
}

/**
 * Apply locked phrase to prompt if provided.
 *
 * @param prompt - Prompt text to modify
 * @param lockedPhrase - Optional locked phrase to inject
 * @param isMaxMode - Whether max mode is enabled
 * @returns Prompt with locked phrase injected if provided
 */
export async function applyLockedPhraseIfNeeded(
  prompt: string,
  lockedPhrase: string | undefined,
  isMaxMode: boolean
): Promise<string> {
  if (!lockedPhrase) return prompt;

  const { injectLockedPhrase } = await import('@bun/prompt/postprocess');
  return injectLockedPhrase(prompt, lockedPhrase, isMaxMode);
}
