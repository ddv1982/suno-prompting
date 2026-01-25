/**
 * Ollama Client Module
 *
 * Provides direct Ollama API integration using node:http.
 * This bypasses both the AI SDK and the official Ollama package to avoid
 * Bun fetch compatibility issues where empty response bodies are returned
 * due to missing Content-Length headers (Bun bug #6932).
 *
 * @module ai/ollama-client
 */

import * as http from 'node:http';

import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError, OllamaTimeoutError, getErrorMessage } from '@shared/errors';

const log = createLogger('OllamaClient');

/** Default Ollama model to use for local generation */
const DEFAULT_OLLAMA_MODEL = 'gemma3:4b';

/**
 * Options for Ollama text generation.
 * These values are passed to the Ollama API in the `options` object.
 */
export interface OllamaGenerationOptions {
  /**
   * Temperature for generation (0-1 range).
   * Higher values produce more random/creative outputs.
   * Maps to Ollama API: `options.temperature`
   */
  readonly temperature?: number;
  /**
   * Maximum number of tokens to generate.
   * Maps to Ollama API: `options.num_predict`
   */
  readonly maxTokens?: number;
  /**
   * Context window length in tokens.
   * Maps to Ollama API: `options.num_ctx`
   */
  readonly contextLength?: number;
}

/** Ollama chat response type */
interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  eval_count?: number;
}

/**
 * Make an HTTP request to Ollama using node:http.
 * This avoids Bun fetch issues with empty response bodies.
 */
async function ollamaRequest(
  endpoint: string,
  body: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const port = url.port ? parseInt(url.port, 10) : 11434;
    
    const req = http.request({
      hostname: url.hostname,
      port,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: timeoutMs,
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer | string) => {
        data += String(chunk);
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new AIGenerationError(`Ollama returned status ${String(res.statusCode)}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });
    
    req.on('error', (error: Error) => {
      reject(new AIGenerationError(`Ollama request failed: ${error.message}`, error));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new OllamaTimeoutError(timeoutMs));
    });
    
    req.write(body);
    req.end();
  });
}

/**
 * Generate text using the Ollama API via node:http.
 * Bypasses Bun fetch to avoid empty body issues.
 *
 * @param endpoint - Ollama server endpoint (e.g., http://127.0.0.1:11434)
 * @param systemPrompt - System prompt for the model
 * @param userPrompt - User prompt for the model
 * @param timeoutMs - Timeout in milliseconds (default: 90s)
 * @param model - Ollama model to use (default: gemma3:4b)
 * @param options - Optional generation options (temperature, maxTokens, contextLength)
 * @returns Generated text response
 */
export async function generateWithOllama(
  endpoint: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number = APP_CONSTANTS.AI.TIMEOUT_MS,
  model: string = DEFAULT_OLLAMA_MODEL,
  options?: OllamaGenerationOptions
): Promise<string> {
  log.info('generateWithOllama:start', {
    endpoint,
    model,
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
    ...(options && {
      options: {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        contextLength: options.contextLength,
      },
    }),
  });

  // Build Ollama options object with correct field mappings
  const ollamaOptions: Record<string, number> = {};
  if (options?.temperature !== undefined) {
    ollamaOptions.temperature = options.temperature;
  }
  if (options?.maxTokens !== undefined) {
    ollamaOptions.num_predict = options.maxTokens;
  }
  if (options?.contextLength !== undefined) {
    ollamaOptions.num_ctx = options.contextLength;
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
    // Only include options if at least one option is provided
    ...(Object.keys(ollamaOptions).length > 0 && { options: ollamaOptions }),
  });

  try {
    const responseText = await ollamaRequest(endpoint, body, timeoutMs);
    const response = JSON.parse(responseText) as OllamaChatResponse;
    
    const content = response.message.content;
    log.info('generateWithOllama:success', {
      responseLength: content.length,
      evalCount: response.eval_count,
    });

    return content;
  } catch (error: unknown) {
    // Re-throw custom errors as-is
    if (error instanceof AIGenerationError || error instanceof OllamaTimeoutError) {
      log.error('generateWithOllama:failed', { error: error.message });
      throw error;
    }
    // Wrap unexpected errors
    const errorMessage = getErrorMessage(error);
    log.error('generateWithOllama:failed', { error: errorMessage });
    throw new AIGenerationError(`Ollama generation failed: ${errorMessage}`, error instanceof Error ? error : undefined);
  }
}
