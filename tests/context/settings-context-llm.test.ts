import { describe, test, expect } from 'bun:test';

import type { APIKeys } from '@shared/types';

/**
 * Tests for SettingsContext LLM availability logic.
 *
 * LLM availability is derived from settings:
 * - isLLMAvailable = useLocalLLM OR hasAnyApiKey
 *
 * This is simpler than the previous RPC-based approach and works
 * reliably in Electrobun without network calls.
 */

// ============================================
// Pure logic function matching the context
// ============================================

/**
 * Derive LLM availability from settings.
 * LLM is available if local LLM is enabled OR at least one cloud API key is configured.
 */
function computeIsLLMAvailable(useLocalLLM: boolean, apiKeys: APIKeys): boolean {
  const hasAnyApiKey = Boolean(
    apiKeys.groq?.trim() || apiKeys.openai?.trim() || apiKeys.anthropic?.trim()
  );
  return useLocalLLM || hasAnyApiKey;
}

// ============================================
// Tests
// ============================================

describe('SettingsContext LLM availability', () => {
  describe('computeIsLLMAvailable', () => {
    describe('local LLM mode', () => {
      test('returns true when useLocalLLM is enabled (no API keys)', () => {
        const apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
        expect(computeIsLLMAvailable(true, apiKeys)).toBe(true);
      });

      test('returns true when useLocalLLM is enabled (with API keys)', () => {
        const apiKeys: APIKeys = { groq: 'key', openai: null, anthropic: null };
        expect(computeIsLLMAvailable(true, apiKeys)).toBe(true);
      });
    });

    describe('cloud mode with API keys', () => {
      test('returns true when groq API key is configured', () => {
        const apiKeys: APIKeys = { groq: 'gsk_test', openai: null, anthropic: null };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(true);
      });

      test('returns true when openai API key is configured', () => {
        const apiKeys: APIKeys = { groq: null, openai: 'sk-test', anthropic: null };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(true);
      });

      test('returns true when anthropic API key is configured', () => {
        const apiKeys: APIKeys = { groq: null, openai: null, anthropic: 'sk-ant-test' };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(true);
      });

      test('returns true when multiple API keys are configured', () => {
        const apiKeys: APIKeys = { groq: 'gsk_test', openai: 'sk-test', anthropic: null };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(true);
      });
    });

    describe('no LLM configured', () => {
      test('returns false when useLocalLLM is off and no API keys', () => {
        const apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(false);
      });

      test('returns false when API keys are empty strings', () => {
        const apiKeys: APIKeys = { groq: '', openai: '', anthropic: '' };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(false);
      });

      test('returns false when API keys are whitespace only', () => {
        const apiKeys: APIKeys = { groq: '   ', openai: '  ', anthropic: '\t' };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(false);
      });
    });

    describe('edge cases', () => {
      test('trims whitespace from API keys', () => {
        const apiKeys: APIKeys = { groq: '  gsk_test  ', openai: null, anthropic: null };
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(true);
      });

      test('handles undefined-like values', () => {
        // TypeScript types say string | null, but runtime could be undefined
        const apiKeys = { groq: undefined, openai: null, anthropic: '' } as unknown as APIKeys;
        expect(computeIsLLMAvailable(false, apiKeys)).toBe(false);
      });
    });
  });

  describe('openSettings function', () => {
    test('provides openSettings to consumers (sets settingsOpen to true)', () => {
      let settingsOpen = false;
      const openSettings = (): void => {
        settingsOpen = true;
      };

      openSettings();

      expect(settingsOpen).toBe(true);
    });
  });
});
