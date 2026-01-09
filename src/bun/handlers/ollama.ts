/**
 * Ollama RPC Handlers
 *
 * Provides RPC handlers for Ollama status checking and settings management.
 * Used by the frontend to configure and monitor local LLM availability.
 *
 * @module handlers/ollama
 */

import { checkOllamaAvailable, invalidateOllamaCache } from '@bun/ai/ollama-availability';
import { DEFAULT_OLLAMA_CONFIG } from '@bun/ai/ollama-provider';
import { SetOllamaSettingsSchema } from '@shared/schemas/ollama';

import { withErrorHandling, log } from './utils';
import { validate } from './validated';

import type { AIEngine } from '@bun/ai';
import type { StorageManager } from '@bun/storage';
import type { RPCHandlers } from '@shared/types';

type OllamaHandlers = Pick<
  RPCHandlers,
  'checkOllamaStatus' | 'getOllamaSettings' | 'setOllamaSettings'
>;

/**
 * Create Ollama RPC handlers.
 *
 * @param aiEngine - AI engine for updating configuration
 * @param storage - Storage manager for persisting settings
 * @returns Ollama handler implementations
 */
export function createOllamaHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): OllamaHandlers {
  return {
    /**
     * Check Ollama server status and model availability.
     * Returns availability status, Gemma model presence, and current endpoint.
     */
    checkOllamaStatus: async () => {
      return withErrorHandling('checkOllamaStatus', async () => {
        const config = await storage.getConfig();
        const endpoint = config.ollamaConfig?.endpoint ?? DEFAULT_OLLAMA_CONFIG.endpoint;
        const status = await checkOllamaAvailable(endpoint);

        log.info('checkOllamaStatus:result', {
          available: status.available,
          hasGemma: status.hasGemma,
          endpoint,
        });

        return {
          available: status.available,
          hasGemma: status.hasGemma,
          endpoint,
        };
      });
    },

    /**
     * Get current Ollama configuration settings.
     * Returns endpoint, temperature, maxTokens, and contextLength.
     */
    getOllamaSettings: async () => {
      return withErrorHandling('getOllamaSettings', async () => {
        const config = await storage.getConfig();
        const ollamaConfig = config.ollamaConfig;

        return {
          endpoint: ollamaConfig?.endpoint ?? DEFAULT_OLLAMA_CONFIG.endpoint,
          temperature: ollamaConfig?.temperature ?? DEFAULT_OLLAMA_CONFIG.temperature,
          maxTokens: ollamaConfig?.maxTokens ?? DEFAULT_OLLAMA_CONFIG.maxTokens,
          contextLength: ollamaConfig?.contextLength ?? DEFAULT_OLLAMA_CONFIG.contextLength,
        };
      });
    },

    /**
     * Update Ollama configuration settings.
     * Validates input, persists to storage, and updates AIEngine.
     * Invalidates availability cache when endpoint changes.
     */
    setOllamaSettings: async (params) => {
      const validated = validate(SetOllamaSettingsSchema, params);

      return withErrorHandling(
        'setOllamaSettings',
        async () => {
          const config = await storage.getConfig();

          // Merge new settings with existing config
          const newOllamaConfig = {
            ...DEFAULT_OLLAMA_CONFIG,
            ...config.ollamaConfig,
            ...validated,
          };

          // Persist to storage
          await storage.saveConfig({ ollamaConfig: newOllamaConfig });

          // Update AIEngine configuration
          if (validated.endpoint !== undefined) {
            aiEngine.setOllamaEndpoint(validated.endpoint);
          }
          if (validated.temperature !== undefined) {
            aiEngine.setOllamaTemperature(validated.temperature);
          }
          if (validated.maxTokens !== undefined) {
            aiEngine.setOllamaMaxTokens(validated.maxTokens);
          }
          if (validated.contextLength !== undefined) {
            aiEngine.setOllamaContextLength(validated.contextLength);
          }

          // Invalidate availability cache when endpoint changes
          if (validated.endpoint !== undefined) {
            invalidateOllamaCache();
            log.info('setOllamaSettings:cacheInvalidated', { newEndpoint: validated.endpoint });
          }

          return { success: true };
        },
        { settings: validated }
      );
    },
  };
}
