/**
 * Global Test Setup for Bun Test Runner
 * 
 * This file is preloaded before all tests run via bunfig.toml.
 * It sets up global mocks that need to be available across all test files.
 * 
 * Loaded via: [test] preload = ["./tests/setup.ts"]
 * 
 * Note: This uses Object.defineProperty to ensure the mock is immutable
 * and works correctly across all test files in Bun's test runner.
 */

import { afterEach, mock } from 'bun:test';

import type { generateText as generateTextType } from 'ai';

// Store original fetch for potential restoration
const originalFetch = globalThis.fetch;

// Create a global mock that can be configured per-test
// This will be available to ALL test files
const fetchMock = mock(() => Promise.resolve(new Response()));

// Replace global fetch with our mock using Object.defineProperty
// This ensures the mock persists across all test file imports
Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
  configurable: true,
});

type GenerateTextFn = typeof generateTextType;

const defaultGenerateTextMock = mock(async (..._args: unknown[]) => {
  throw new Error('AI generateText mock not configured');
});
const defaultGenerateTextFn = defaultGenerateTextMock as unknown as GenerateTextFn;

type AiMockGlobals = typeof globalThis & {
  __aiGenerateTextMock?: GenerateTextFn;
};

const aiGlobals = globalThis as AiMockGlobals;
aiGlobals.__aiGenerateTextMock = defaultGenerateTextFn;

const createProviderRegistryMock = () => ({
  languageModel: () => ({}),
});

void mock.module('ai', () => ({
  generateText: (...args: Parameters<GenerateTextFn>) =>
    (aiGlobals.__aiGenerateTextMock ?? defaultGenerateTextFn)(...args),
  createProviderRegistry: createProviderRegistryMock,
  experimental_createProviderRegistry: createProviderRegistryMock,
}));

afterEach(() => {
  defaultGenerateTextMock.mockClear();
  aiGlobals.__aiGenerateTextMock = defaultGenerateTextFn;
});

// Export both for test access
export { fetchMock, originalFetch };
