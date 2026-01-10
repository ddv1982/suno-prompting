import { describe, test, expect } from 'bun:test';

import { AIGenerationError, OllamaTimeoutError } from '@shared/errors';

describe('generateWithOllama', () => {

  describe('parameter validation', () => {
    test('exports generateWithOllama function', async () => {
      const { generateWithOllama } = await import('@bun/ai/ollama-client');
      expect(typeof generateWithOllama).toBe('function');
    });

    test('exports invalidateOllamaClient function', async () => {
      const { invalidateOllamaClient } = await import('@bun/ai/ollama-client');
      expect(typeof invalidateOllamaClient).toBe('function');
    });
  });

  describe('with live Ollama server', () => {
    // These tests require a running Ollama server
    // They're useful for integration testing but can be skipped in CI
    
    const isOllamaRunning = async (): Promise<boolean> => {
      try {
        const response = await fetch('http://127.0.0.1:11434/api/tags', {
          signal: AbortSignal.timeout(2000),
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    test('generates text successfully with valid prompts', async () => {
      const ollamaAvailable = await isOllamaRunning();
      if (!ollamaAvailable) {
        // Skip test if Ollama is not running
        return;
      }

      const { generateWithOllama } = await import('@bun/ai/ollama-client');
      
      const result = await generateWithOllama(
        'http://127.0.0.1:11434',
        'You are a helpful assistant.',
        'Say hello in one word.',
        30000
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('uses custom model when provided', async () => {
      const ollamaAvailable = await isOllamaRunning();
      if (!ollamaAvailable) {
        // Skip test if Ollama is not running
        return;
      }

      const { generateWithOllama } = await import('@bun/ai/ollama-client');
      
      // Should work with default model
      const result = await generateWithOllama(
        'http://127.0.0.1:11434',
        'You are a helpful assistant.',
        'Say hi.',
        30000,
        'gemma3:4b' // explicit model
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('throws AIGenerationError for invalid endpoint', async () => {
      const { generateWithOllama } = await import('@bun/ai/ollama-client');
      
      await expect(
        generateWithOllama(
          'http://127.0.0.1:99999', // invalid port
          'System prompt',
          'User prompt',
          5000
        )
      ).rejects.toThrow(AIGenerationError);
    });

    test('throws OllamaTimeoutError when timeout exceeded', async () => {
      const ollamaAvailable = await isOllamaRunning();
      if (!ollamaAvailable) {
        // Skip test if Ollama is not running
        return;
      }

      const { generateWithOllama } = await import('@bun/ai/ollama-client');
      
      // Use extremely short timeout to trigger timeout error
      await expect(
        generateWithOllama(
          'http://127.0.0.1:11434',
          'You are a helpful assistant. Write a very long detailed story.',
          'Write a 10000 word essay about the history of computing.',
          1 // 1ms timeout - should definitely timeout
        )
      ).rejects.toThrow(OllamaTimeoutError);
    }, 10000);
  });

  describe('invalidateOllamaClient', () => {
    test('does not throw when called', async () => {
      const { invalidateOllamaClient } = await import('@bun/ai/ollama-client');
      
      expect(() => invalidateOllamaClient()).not.toThrow();
    });
  });
});

describe('error types', () => {
  test('AIGenerationError has correct properties', () => {
    const error = new AIGenerationError('Test error');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AIGenerationError);
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AIGenerationError');
  });

  test('AIGenerationError preserves cause', () => {
    const cause = new Error('Original error');
    const error = new AIGenerationError('Wrapped error', cause);
    
    expect(error.cause).toBe(cause);
  });

  test('OllamaTimeoutError has correct message format', () => {
    const error = new OllamaTimeoutError(30000);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OllamaTimeoutError);
    expect(error.message).toContain('30 seconds');
    expect(error.name).toBe('OllamaTimeoutError');
  });
});
