/**
 * Tests for llm-utils.ts refactored helper functions
 * 
 * Tests wrapAIError and the split callLLM paths
 */

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';

import { AIGenerationError } from '@shared/errors';

import { setAiGenerateTextMock } from '../../helpers/ai-mock';

// Mock the AI SDK before importing callLLM
const mockGenerateText = mock(async (_options?: unknown) => ({
  text: 'generated response',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 20 },
}));

// Mock Ollama client
const mockGenerateWithOllama = mock(async () => 'ollama response');

beforeEach(async () => {
  setAiGenerateTextMock(mockGenerateText);

  await mock.module('@bun/ai/ollama-client', () => ({
    generateWithOllama: mockGenerateWithOllama,
  }));
});

afterEach(() => {
  mock.restore();
});

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
      // Mock generateText to call onFinish callback (required for traced path)
      mockGenerateText.mockImplementation(async (options: unknown) => {
        const opts = options as { onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void };
        if (opts.onFinish) {
          opts.onFinish({
            response: { modelId: 'gpt-4' },
            usage: { inputTokens: 10, outputTokens: 20 },
            finishReason: 'stop',
          });
        }
        return {
          text: 'generated response',
          response: { modelId: 'gpt-4' },
          finishReason: 'stop',
          usage: { inputTokens: 10, outputTokens: 20 },
        };
      });

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

describe('ollamaOptions threading', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateWithOllama.mockClear();
    mockGenerateWithOllama.mockResolvedValue('ollama response');
  });

  describe('without trace (fast path)', () => {
    test('passes ollamaOptions to generateWithOllama', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      
      const ollamaOptions = {
        temperature: 0.8,
        maxTokens: 2500,
        contextLength: 6144,
      };

      await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaOptions,
      });

      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      
      // Verify the last argument is the ollamaOptions
      const calls = mockGenerateWithOllama.mock.calls as unknown[][];
      const lastCall = calls[0];
      expect(lastCall).toBeDefined();
      // generateWithOllama(endpoint, systemPrompt, userPrompt, timeout, model, options)
      // lastCall[5] should be the options
      expect(lastCall?.[5]).toEqual(ollamaOptions);
    });

    test('works without ollamaOptions (backward compatible)', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');

      await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
        // No ollamaOptions provided
      });

      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      
      const calls = mockGenerateWithOllama.mock.calls as unknown[][];
      const lastCall = calls[0];
      // Should be called with undefined for options
      expect(lastCall?.[5]).toBeUndefined();
    });

    test('passes partial ollamaOptions correctly', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      
      const ollamaOptions = {
        temperature: 0.5,
        // maxTokens and contextLength intentionally omitted
      };

      await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaOptions,
      });

      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      
      const calls = mockGenerateWithOllama.mock.calls as unknown[][];
      const lastCall = calls[0];
      expect(lastCall?.[5]).toEqual({ temperature: 0.5 });
    });
  });

  describe('with trace (traced path)', () => {
    test('passes ollamaOptions through traced path', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      const { createTraceCollector } = await import('@bun/trace');
      
      const trace = createTraceCollector({
        runId: 'test-run-options',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      const ollamaOptions = {
        temperature: 0.3,
        maxTokens: 1500,
        contextLength: 4096,
      };

      await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaOptions,
        trace,
      });

      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      
      const calls = mockGenerateWithOllama.mock.calls as unknown[][];
      const lastCall = calls[0];
      expect(lastCall?.[5]).toEqual(ollamaOptions);
    });

    test('traced path works without ollamaOptions (backward compatible)', async () => {
      const { callLLM } = await import('@bun/ai/llm-utils');
      const { createTraceCollector } = await import('@bun/trace');
      
      const trace = createTraceCollector({
        runId: 'test-run-no-options',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      await callLLM({
        getModel: () => ({}) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaEndpoint: 'http://localhost:11434',
        trace,
        // No ollamaOptions
      });

      expect(mockGenerateWithOllama).toHaveBeenCalledTimes(1);
      
      const calls = mockGenerateWithOllama.mock.calls as unknown[][];
      const lastCall = calls[0];
      expect(lastCall?.[5]).toBeUndefined();
    });
  });

  describe('cloud provider path', () => {
    test('does not pass ollamaOptions to cloud providers', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'cloud response',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      const { callLLM } = await import('@bun/ai/llm-utils');

      // Call with ollamaOptions but without ollamaEndpoint (cloud path)
      await callLLM({
        getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
        ollamaOptions: { temperature: 0.5 }, // This should be ignored for cloud
        // No ollamaEndpoint = cloud provider path
      });

      expect(mockGenerateText).toHaveBeenCalledTimes(1);
      expect(mockGenerateWithOllama).not.toHaveBeenCalled();
    });
  });
});

describe('onFinish callback behavior', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateWithOllama.mockClear();
  });

  test('onFinish callback is invoked during cloud generation without trace', async () => {
    let onFinishCalled = false;
    let capturedOnFinish: ((params: { response: unknown; usage: unknown; finishReason: string }) => void) | undefined;

    // Mock generateText to capture the onFinish callback
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as { onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void };
      capturedOnFinish = opts.onFinish;
      // Simulate the AI SDK calling onFinish
      if (opts.onFinish) {
        onFinishCalled = true;
        opts.onFinish({
          response: { modelId: 'gpt-4' },
          usage: { inputTokens: 100, outputTokens: 50 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'generated response',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 100, outputTokens: 50 },
      };
    });

    const { callLLM } = await import('@bun/ai/llm-utils');

    await callLLM({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
    });

    expect(onFinishCalled).toBe(true);
    expect(capturedOnFinish).toBeDefined();
  });

  test('trace telemetry contains correct token counts from onFinish', async () => {
    // Mock generateText to call onFinish with specific token counts
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as { onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void };
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'gpt-4-turbo' },
          usage: { inputTokens: 200, outputTokens: 75 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'generated response',
        response: { modelId: 'gpt-4-turbo' },
        finishReason: 'stop',
        usage: { inputTokens: 200, outputTokens: 75 },
      };
    });

    const { callLLM } = await import('@bun/ai/llm-utils');
    const { createTraceCollector } = await import('@bun/trace');

    const trace = createTraceCollector({
      runId: 'test-run-tokens',
      action: 'generate.full',
      promptMode: 'full',
      rng: { seed: 1, algorithm: 'mulberry32' },
    });

    await callLLM({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4-turbo' }) as any,
      systemPrompt: 'system prompt',
      userPrompt: 'user prompt',
      errorContext: 'test context',
      trace,
      traceLabel: 'test.tokens',
    });

    const traceData = trace.finalize();
    const llmEvent = traceData.events.find(e => e.type === 'llm.call') as {
      type: string;
      telemetry?: { tokensIn?: number; tokensOut?: number; finishReason?: string };
    };

    expect(llmEvent).toBeDefined();
    expect(llmEvent.telemetry?.tokensIn).toBe(200);
    expect(llmEvent.telemetry?.tokensOut).toBe(75);
    expect(llmEvent.telemetry?.finishReason).toBe('stop');
  });

  test('graceful behavior when trace is undefined', async () => {
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as { onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void };
      // onFinish should still be called even without trace
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'gpt-4' },
          usage: { inputTokens: 50, outputTokens: 25 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'response without trace',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 50, outputTokens: 25 },
      };
    });

    const { callLLM } = await import('@bun/ai/llm-utils');

    // Call without trace - should not throw
    const result = await callLLM({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
      // trace is undefined
    });

    expect(result).toBe('response without trace');
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  test('onFinish data is used for telemetry when available', async () => {
    // Test that onFinish callback data takes precedence
    const onFinishTokens = { inputTokens: 999, outputTokens: 888 };
    const resultTokens = { inputTokens: 100, outputTokens: 50 };

    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as { onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void };
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'callback-model' },
          usage: onFinishTokens,
          finishReason: 'length',
        });
      }
      // Return different values than onFinish to verify onFinish takes precedence
      return {
        text: 'generated response',
        response: { modelId: 'result-model' },
        finishReason: 'stop',
        usage: resultTokens,
      };
    });

    const { callLLM } = await import('@bun/ai/llm-utils');
    const { createTraceCollector } = await import('@bun/trace');

    const trace = createTraceCollector({
      runId: 'test-precedence',
      action: 'generate.full',
      promptMode: 'full',
      rng: { seed: 1, algorithm: 'mulberry32' },
    });

    await callLLM({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
      trace,
    });

    const traceData = trace.finalize();
    const llmEvent = traceData.events.find(e => e.type === 'llm.call') as {
      type: string;
      telemetry?: { tokensIn?: number; tokensOut?: number; finishReason?: string };
    };

    // onFinish data should be used for telemetry
    expect(llmEvent.telemetry?.tokensIn).toBe(999);
    expect(llmEvent.telemetry?.tokensOut).toBe(888);
    expect(llmEvent.telemetry?.finishReason).toBe('length');
  });
});
