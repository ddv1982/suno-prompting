import { describe, expect, test } from 'bun:test';

import { buildDebugInfo, cleanLyrics, cleanTitle } from '@bun/ai/utils';

describe('cleanTitle', () => {
  test('removes double quotes from title', () => {
    expect(cleanTitle('"My Song"')).toBe('My Song');
  });

  test('removes single quotes from title', () => {
    expect(cleanTitle("'My Song'")).toBe('My Song');
  });

  test('trims whitespace', () => {
    expect(cleanTitle('  My Song  ')).toBe('My Song');
  });

  test('handles both quotes and whitespace', () => {
    expect(cleanTitle('  "My Song"  ')).toBe('My Song');
  });

  test('returns fallback for undefined', () => {
    expect(cleanTitle(undefined)).toBe('Untitled');
  });

  test('returns fallback for empty string', () => {
    expect(cleanTitle('')).toBe('Untitled');
  });

  test('uses custom fallback', () => {
    expect(cleanTitle(undefined, 'Default')).toBe('Default');
  });

  test('preserves internal quotes', () => {
    expect(cleanTitle('"It\'s a "Song""')).toBe("It's a \"Song\"");
  });
});

describe('cleanLyrics', () => {
  test('trims whitespace', () => {
    expect(cleanLyrics('  [VERSE]\nHello  ')).toBe('[VERSE]\nHello');
  });

  test('returns undefined for empty string', () => {
    expect(cleanLyrics('')).toBeUndefined();
  });

  test('returns undefined for undefined', () => {
    expect(cleanLyrics(undefined)).toBeUndefined();
  });

  test('returns undefined for whitespace only', () => {
    expect(cleanLyrics('   ')).toBeUndefined();
  });

  test('preserves internal whitespace', () => {
    expect(cleanLyrics('[VERSE]\n  Line 1\n  Line 2')).toBe('[VERSE]\n  Line 1\n  Line 2');
  });
});

describe('buildDebugInfo', () => {
  test('builds debug info with required fields', () => {
    const result = buildDebugInfo(
      'System prompt',
      'User prompt',
      'Raw response',
      'test-model',
      'groq'
    );

    expect(result.systemPrompt).toBe('System prompt');
    expect(result.userPrompt).toBe('User prompt');
    expect(result.responseBody).toBe('Raw response');
    expect(result.model).toBe('test-model');
    expect(result.provider).toBe('groq');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.requestBody).toContain('"model": "test-model"');
  });

  test('includes messages in requestBody when provided', () => {
    const messages = [
      { role: 'assistant', content: 'Previous response' },
      { role: 'user', content: 'Follow-up' },
    ];

    const result = buildDebugInfo(
      'System prompt',
      'User prompt',
      'Raw response',
      'test-model',
      'openai',
      messages
    );

    expect(result.requestBody).toContain('Previous response');
    expect(result.requestBody).toContain('Follow-up');
  });

  test('builds default messages when none provided', () => {
    const result = buildDebugInfo(
      'System prompt',
      'User prompt',
      'Raw response',
      'test-model',
      'anthropic'
    );

    const requestBody = JSON.parse(result.requestBody);
    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1].role).toBe('user');
  });
});
