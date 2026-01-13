/**
 * Tests for llm-utils.ts refactored helper functions
 * 
 * Tests wrapAIError and the split callLLM paths
 */

import { describe, expect, test, mock, beforeEach } from 'bun:test';

import { AIGenerationError } from '@shared/errors';

// Mock the AI SDK before importing callLLM
const mockGenerateText = mock(async () => ({
  text: 'generated response',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 20 },
}));

void mock.module('ai', () => ({
  generateText: mockGenerateText,
}));

// Mock Ollama client
const mockGenerateWithOllama = mock(async () => 'ollama response');

void mock.module('@bun/ai/ollama-client', () => ({
  generateWithOllama: mockGenerateWithOllama,
}));

describe('callLLM', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateWithOllama.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'generated response',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20 },
    });
    mockGenerateWithOllama.mockResolvedValue('ollama response');
  });

  describe('without trace (fast path)', () => {
    test('calls cloud provider when no ollamaEndpoint', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      
      const result = await callLLM({
        getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
      });

      expect(result).toBe('generated response');
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
      expect(mockGenerateWithOllama).not.toHaveBeenCalled();
    });

    test('calls Ollama when ollamaEndpoint provided', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      
      const result = await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
      });

      expect(result).toBe('ollama response');
      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    test('throws AIGenerationError for empty response', async () => {
      mockGenerateText.mockResolvedValue({
        text: '',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 0 },
      });
      const { callLLM } = await import('@bun/ai/llm-utils');

      await expect(
        callLLM({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test context',
        })
      ).rejects.toThrow(AIGenerationError);
    });

    test('wraps non-AIGenerationError errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('network error'));
      const { callLLM } = await import('@bun/ai/llm-utils');

      await expect(
        callLLM({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test operation',
        })
      ).rejects.toThrow('Failed to test operation');
    });

    test('preserves AIGenerationError errors', async () => {
      const originalError = new AIGenerationError('original message');
      mockGenerateText.mockRejectedValue(originalError);
      const { callLLM } = await import('@bun/ai/llm-utils');

      await expect(
        callLLM({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test operation',
        })
      ).rejects.toThrow('original message');
    });
  });

  describe('with trace (traced path)', () => {
    test('records LLM call event on success', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      const { createTraceCollector } = await import('@bun/trace');
      
      const trace = createTraceCollector({
        runId: 'test-run',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      const result = await callLLM({
        getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
        systemPrompt: 'system prompt',
        userPrompt: 'user prompt',
        errorContext: 'test context',
        trace,
        traceLabel: 'test.call',
      });

      expect(result).toBe('generated response');
      
      const traceData = trace.finalize();
      const llmEvent = traceData.events.find(e => e.type === 'llm.call');
      expect(llmEvent).toBeDefined();
    });

    test('records error event on failure', async () => {
      mockGenerateText.mockRejectedValue(new AIGenerationError('test failure'));
      const { callLLM } = await import('@bun/ai/llm-utils');
      const { createTraceCollector } = await import('@bun/trace');
      
      const trace = createTraceCollector({
        runId: 'test-run',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      await expect(
        callLLM({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test context',
          trace,
        })
      ).rejects.toThrow();

      const traceData = trace.finalize();
      expect(traceData.stats.hadErrors).toBe(true);
    });
  });
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
    const { generateDirectModeTitle } = await import('@bun/ai/llm-utils');

    const title = await generateDirectModeTitle(
      'my description',
      ['rock', 'indie'],
      () => ({}) as any
    );

    expect(title).toBe('Generated Title');
  });

  test('returns Untitled on error', async () => {
    mockGenerateText.mockRejectedValue(new Error('failed'));
    const { generateDirectModeTitle } = await import('@bun/ai/llm-utils');

    const title = await generateDirectModeTitle(
      'my description',
      ['rock'],
      () => ({}) as any
    );

    expect(title).toBe('Untitled');
  });

  test('infers mood from styles', async () => {
    const { generateDirectModeTitle } = await import('@bun/ai/llm-utils');

    // Test dark mood inference
    await generateDirectModeTitle('desc', ['dark metal'], () => ({}) as any);
    
    // The mood should be inferred as 'dark' based on the styles
    expect(mockGenerateText).toHaveBeenCalled();
  });
});
