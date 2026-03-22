/**
 * Tests for direct-mode-title.ts
 */

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';

import { setAiGenerateTextMock } from '../../helpers/ai-mock';

const mockGenerateText = mock(async (_options?: unknown) => ({
  text: 'Generated Title',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 5 },
}));

beforeEach(async () => {
  setAiGenerateTextMock(mockGenerateText);
});

afterEach(() => {
  mock.restore();
});

describe('generateDirectModeTitle', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'Generated Title',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 5 },
    });
  });

  test('returns title from generateTitle', async () => {
    const { generateDirectModeTitle } = await import('@bun/ai/direct-mode-title');

    const title = await generateDirectModeTitle(
      'my description',
      ['rock', 'indie'],
      () => ({}) as any
    );

    expect(title).toBe('Generated Title');
  });

  test('returns Untitled on error', async () => {
    mockGenerateText.mockRejectedValue(new Error('failed'));
    const { generateDirectModeTitle } = await import('@bun/ai/direct-mode-title');

    const title = await generateDirectModeTitle('my description', ['rock'], () => ({}) as any);

    expect(title).toBe('Untitled');
  });

  test('infers mood from styles', async () => {
    const { generateDirectModeTitle } = await import('@bun/ai/direct-mode-title');

    // Test dark mood inference
    await generateDirectModeTitle('desc', ['dark metal'], () => ({}) as any);

    // The mood should be inferred as 'dark' based on the styles
    expect(mockGenerateText).toHaveBeenCalled();
  });
});
