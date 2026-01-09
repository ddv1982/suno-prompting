import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_OLLAMA_CONFIG,
  createOllamaProvider,
  getOllamaModel,
} from '@bun/ai/ollama-provider';
import { APP_CONSTANTS } from '@shared/constants';

import type { OllamaConfig } from '@shared/types';

describe('DEFAULT_OLLAMA_CONFIG', () => {
  test('has correct default endpoint', () => {
    expect(DEFAULT_OLLAMA_CONFIG.endpoint).toBe(
      APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT
    );
  });

  test('has correct default temperature', () => {
    expect(DEFAULT_OLLAMA_CONFIG.temperature).toBe(
      APP_CONSTANTS.OLLAMA.DEFAULT_TEMPERATURE
    );
  });

  test('has correct default maxTokens', () => {
    expect(DEFAULT_OLLAMA_CONFIG.maxTokens).toBe(
      APP_CONSTANTS.OLLAMA.DEFAULT_MAX_TOKENS
    );
  });

  test('has correct default contextLength', () => {
    expect(DEFAULT_OLLAMA_CONFIG.contextLength).toBe(
      APP_CONSTANTS.OLLAMA.DEFAULT_CONTEXT_LENGTH
    );
  });
});

describe('createOllamaProvider', () => {
  test('creates provider with default config', () => {
    const provider = createOllamaProvider(DEFAULT_OLLAMA_CONFIG);
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  test('creates provider with custom endpoint', () => {
    const customConfig: OllamaConfig = {
      ...DEFAULT_OLLAMA_CONFIG,
      endpoint: 'http://custom-host:12345',
    };
    const provider = createOllamaProvider(customConfig);
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  test('creates provider with custom settings', () => {
    const customConfig: OllamaConfig = {
      endpoint: 'http://127.0.0.1:11434',
      temperature: 0.9,
      maxTokens: 3000,
      contextLength: 8192,
    };
    const provider = createOllamaProvider(customConfig);
    expect(provider).toBeDefined();
  });
});

describe('getOllamaModel', () => {
  test('returns language model with default config', () => {
    const model = getOllamaModel(DEFAULT_OLLAMA_CONFIG);
    expect(model).toBeDefined();
    expect(typeof model).toBe('object');
  });

  test('returns language model with custom config', () => {
    const customConfig: OllamaConfig = {
      endpoint: 'http://127.0.0.1:11434',
      temperature: 0.8,
      maxTokens: 2500,
      contextLength: 6144,
    };
    const model = getOllamaModel(customConfig);
    expect(model).toBeDefined();
  });

  test('model is usable with AI SDK (has required properties)', () => {
    const model = getOllamaModel(DEFAULT_OLLAMA_CONFIG);
    // Language model should have a modelId property
    expect(model).toHaveProperty('modelId');
  });
});
