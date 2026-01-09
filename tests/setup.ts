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

import { mock } from 'bun:test';

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

// Export both for test access
export { fetchMock, originalFetch };
