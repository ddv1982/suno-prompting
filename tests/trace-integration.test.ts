/**
 * F5 & F6: Integration tests for trace instrumentation
 * 
 * F5: LLM tracing instrumentation (mock AI SDK + Ollama)
 * F6: Deterministic decision tracing
 */

import { describe, expect, test } from 'bun:test';

import {
  createTraceCollector,
  maybeCreateTraceCollector,
  traceDecision,
  normalizeTraceError,
  traceError,
} from '@bun/trace';
import { AIGenerationError, OllamaUnavailableError, OllamaTimeoutError, ValidationError } from '@shared/errors';

import type { TraceCollectorInit } from '@bun/trace';
import type { TraceDecisionEvent } from '@shared/types/trace';


// ========================================================================
// F5: Integration tests for LLM tracing instrumentation
// Mock AI SDK + Ollama; check llm.call event shapes for success, retry, failure
// ========================================================================

describe('TraceCollector', () => {
  const baseInit: TraceCollectorInit = {
    runId: 'test-run-1',
    action: 'generate.full',
    promptMode: 'full',
    rng: { seed: 12345, algorithm: 'mulberry32' },
  };

  describe('initialization', () => {
    test('creates collector with enabled=true', () => {
      const collector = createTraceCollector(baseInit);
      expect(collector.enabled).toBe(true);
    });

    test('captures runId and capturedAt', () => {
      const collector = createTraceCollector(baseInit);
      expect(collector.runId).toBe('test-run-1');
      expect(collector.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('maybeCreateTraceCollector returns undefined when disabled', () => {
      const collector = maybeCreateTraceCollector(false, baseInit);
      expect(collector).toBeUndefined();
    });

    test('maybeCreateTraceCollector returns collector when enabled', () => {
      const collector = maybeCreateTraceCollector(true, baseInit);
      expect(collector).toBeDefined();
      expect(collector?.enabled).toBe(true);
    });
  });

  describe('addRunEvent', () => {
    test('adds run.start event with correct shape', () => {
      const collector = createTraceCollector(baseInit);
      collector.addRunEvent('run.start', 'Starting generation');
      
      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'run.start');
      
      expect(event).toBeDefined();
      expect(event?.type).toBe('run.start');
      if (event?.type === 'run.start') {
        expect(event.summary).toBe('Starting generation');
        expect(event.id).toContain(collector.runId);
        expect(event.ts).toBeDefined();
        expect(event.tMs).toBeGreaterThanOrEqual(0);
      }
    });

    test('adds run.end event with correct shape', () => {
      const collector = createTraceCollector(baseInit);
      collector.addRunEvent('run.start', 'start');
      collector.addRunEvent('run.end', 'Completed successfully');
      
      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'run.end');
      
      expect(event).toBeDefined();
      if (event?.type === 'run.end') {
        expect(event.summary).toBe('Completed successfully');
      }
    });
  });

  describe('addLLMCallEvent - llm.call event shapes', () => {
    test('produces correct shape for successful cloud call', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addLLMCallEvent({
        label: 'lyrics.generate',
        provider: { id: 'openai', model: 'gpt-4', locality: 'cloud' },
        request: {
          temperature: 0.7,
          maxTokens: 2000,
          maxRetries: 2,
          inputSummary: {
            messageCount: 2,
            totalChars: 500,
            preview: 'System: You are a lyricist...',
          },
          messages: [
            { role: 'system', content: 'You are a lyricist' },
            { role: 'user', content: 'Write lyrics about rain' },
          ],
        },
        response: {
          previewText: 'Verse 1: Rain falls down...',
          rawText: 'Verse 1: Rain falls down on the city streets...',
        },
        telemetry: {
          latencyMs: 1500,
          tokensIn: 150,
          tokensOut: 300,
          finishReason: 'stop',
        },
      });

      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'llm.call')!;

      expect(event).toBeDefined();
      expect(event.type).toBe('llm.call');
      expect(event.label).toBe('lyrics.generate');
      
      // Provider info
      expect(event.provider.id).toBe('openai');
      expect(event.provider.model).toBe('gpt-4');
      expect(event.provider.locality).toBe('cloud');
      
      // Request params
      expect(event.request.temperature).toBe(0.7);
      expect(event.request.maxTokens).toBe(2000);
      expect(event.request.maxRetries).toBe(2);
      
      // Input summary
      expect(event.request.inputSummary.messageCount).toBe(2);
      expect(event.request.inputSummary.totalChars).toBe(500);
      expect(event.request.inputSummary.preview).toContain('lyricist');
      
      // Raw messages (Advanced view)
      expect(event.request.messages).toHaveLength(2);
      
      // Response
      expect(event.response.previewText).toContain('Verse 1');
      expect(event.response.rawText).toContain('city streets');
      
      // Telemetry
      expect(event.telemetry?.latencyMs).toBe(1500);
      expect(event.telemetry?.tokensIn).toBe(150);
      expect(event.telemetry?.tokensOut).toBe(300);
      expect(event.telemetry?.finishReason).toBe('stop');
    });

    test('produces correct shape for local Ollama call', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addLLMCallEvent({
        label: 'title.generate',
        provider: { id: 'ollama', model: 'gemma3:4b', locality: 'local' },
        request: {
          inputSummary: {
            messageCount: 2,
            totalChars: 200,
            preview: 'Generate a title...',
          },
        },
        response: {
          previewText: 'Rainy Day Blues',
        },
        telemetry: {
          latencyMs: 800,
        },
      });

      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'llm.call')!;

      expect(event.provider.id).toBe('ollama');
      expect(event.provider.model).toBe('gemma3:4b');
      expect(event.provider.locality).toBe('local');
    });

    test('produces correct shape for retry + eventual success', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addLLMCallEvent({
        label: 'lyrics.generate',
        provider: { id: 'groq', model: 'llama-3.3-70b-versatile', locality: 'cloud' },
        request: {
          maxRetries: 2,
          inputSummary: { messageCount: 2, totalChars: 300, preview: 'test' },
        },
        response: { previewText: 'success' },
        attempts: [
          {
            attempt: 1,
            startedAt: '2026-01-12T00:00:01.000Z',
            endedAt: '2026-01-12T00:00:02.000Z',
            latencyMs: 1000,
            error: { type: 'ai.generation', message: 'Rate limited', status: 429 },
          },
          {
            attempt: 2,
            startedAt: '2026-01-12T00:00:03.000Z',
            endedAt: '2026-01-12T00:00:04.000Z',
            latencyMs: 1000,
          },
        ],
      });

      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'llm.call')!;
      const attempts = event.attempts;

      expect(attempts).toHaveLength(2);
      expect(attempts?.[0]?.error).toBeDefined();
      expect(attempts?.[0]?.error?.type).toBe('ai.generation');
      expect(attempts?.[0]?.error?.status).toBe(429);
      expect(attempts?.[1]?.error).toBeUndefined();
    });

    test('produces correct shape for failure with error event', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addLLMCallEvent({
        label: 'failed.call',
        provider: { id: 'anthropic', model: 'claude-3-opus', locality: 'cloud' },
        request: {
          maxRetries: 1,
          inputSummary: { messageCount: 1, totalChars: 100, preview: 'test' },
        },
        response: { previewText: '' },
        attempts: [
          {
            attempt: 1,
            startedAt: '2026-01-12T00:00:01.000Z',
            endedAt: '2026-01-12T00:00:31.000Z',
            latencyMs: 30000,
            error: {
              type: 'ai.generation',
              message: 'Request timeout after 30s',
              providerRequestId: 'req-abc123',
            },
          },
        ],
      });

      collector.addErrorEvent({
        type: 'ai.generation',
        message: 'Request timeout after 30s',
      });

      const trace = collector.finalize();
      
      expect(trace.stats.hadErrors).toBe(true);
      
      const llmEvent = trace.events.find((e) => e.type === 'llm.call')!;
      expect(llmEvent.attempts?.[0]?.error?.providerRequestId).toBe('req-abc123');
      
      const errorEvent = trace.events.find((e) => e.type === 'error')!;
      expect(errorEvent.error.type).toBe('ai.generation');
    });

    test('produces same event shape for all providers', () => {
      const providers = [
        { id: 'openai' as const, model: 'gpt-4', locality: 'cloud' as const },
        { id: 'anthropic' as const, model: 'claude-3-opus', locality: 'cloud' as const },
        { id: 'groq' as const, model: 'llama-3.3-70b', locality: 'cloud' as const },
        { id: 'ollama' as const, model: 'gemma3:4b', locality: 'local' as const },
      ];

      for (const provider of providers) {
        const collector = createTraceCollector(baseInit);
        
        collector.addLLMCallEvent({
          label: `test.${provider.id}`,
          provider,
          request: {
            inputSummary: { messageCount: 1, totalChars: 50, preview: 'test' },
          },
          response: { previewText: 'response' },
        });

        const trace = collector.finalize();
        const event = trace.events.find((e) => e.type === 'llm.call')!;

        // All should have the same structure
        expect(event.type).toBe('llm.call');
        expect(event.label).toBeDefined();
        expect(event.provider.id).toBeDefined();
        expect(event.provider.model).toBeDefined();
        expect(event.provider.locality).toBeDefined();
        expect(event.request.inputSummary).toBeDefined();
        expect(event.response.previewText).toBeDefined();
      }
    });
  });

  describe('finalize', () => {
    test('produces valid TraceRun with correct stats', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addRunEvent('run.start', 'start');
      collector.addLLMCallEvent({
        label: 'call1',
        provider: { id: 'openai', model: 'gpt-4', locality: 'cloud' },
        request: { inputSummary: { messageCount: 1, totalChars: 50, preview: 'test' } },
        response: { previewText: 'response' },
      });
      collector.addLLMCallEvent({
        label: 'call2',
        provider: { id: 'openai', model: 'gpt-4', locality: 'cloud' },
        request: { inputSummary: { messageCount: 1, totalChars: 50, preview: 'test' } },
        response: { previewText: 'response' },
      });
      collector.addRunEvent('run.end', 'end');

      const trace = collector.finalize();

      expect(trace.version).toBe(1);
      expect(trace.runId).toBe('test-run-1');
      expect(trace.action).toBe('generate.full');
      expect(trace.promptMode).toBe('full');
      expect(trace.rng.seed).toBe(12345);
      expect(trace.stats.eventCount).toBe(4);
      expect(trace.stats.llmCallCount).toBe(2);
      expect(trace.stats.decisionCount).toBe(0);
      expect(trace.stats.hadErrors).toBe(false);
    });

    test('events have sequential IDs and timestamps', () => {
      const collector = createTraceCollector(baseInit);
      
      collector.addRunEvent('run.start', 'start');
      collector.addRunEvent('run.end', 'end');

      const trace = collector.finalize();
      const events = trace.events;
      const event0 = events[0];
      const event1 = events[1];
      
      expect(event0).toBeDefined();
      expect(event1).toBeDefined();
      expect(event0?.id).toContain('.1');
      expect(event1?.id).toContain('.2');
      expect(event1?.tMs).toBeGreaterThanOrEqual(event0?.tMs ?? 0);
    });
  });
});

// ========================================================================
// F5 continued: Error normalization
// ========================================================================

describe('normalizeTraceError', () => {
  test('normalizes AIGenerationError', () => {
    const error = new AIGenerationError('Model failed to respond');
    const normalized = normalizeTraceError(error);

    expect(normalized.type).toBe('ai.generation');
    expect(normalized.message).toContain('Model failed');
  });

  test('normalizes OllamaUnavailableError', () => {
    const error = new OllamaUnavailableError('http://localhost:11434');
    const normalized = normalizeTraceError(error);

    expect(normalized.type).toBe('ollama.unavailable');
  });

  test('normalizes OllamaTimeoutError', () => {
    const error = new OllamaTimeoutError(30000);
    const normalized = normalizeTraceError(error);

    expect(normalized.type).toBe('ollama.timeout');
  });

  test('normalizes ValidationError', () => {
    const error = new ValidationError('Invalid input');
    const normalized = normalizeTraceError(error);

    expect(normalized.type).toBe('validation');
  });

  test('normalizes unknown errors to unknown type', () => {
    const error = new Error('Something random happened');
    const normalized = normalizeTraceError(error);

    expect(normalized.type).toBe('unknown');
  });

  test('extracts HTTP status when present', () => {
    const error = Object.assign(new AIGenerationError('Rate limited'), { status: 429 });
    const normalized = normalizeTraceError(error);

    expect(normalized.status).toBe(429);
  });

  test('extracts provider request ID when present', () => {
    const error = Object.assign(new AIGenerationError('Failed'), { requestId: 'req-123' });
    const normalized = normalizeTraceError(error);

    expect(normalized.providerRequestId).toBe('req-123');
  });

  test('redacts secrets in error messages', () => {
    const error = new AIGenerationError('Failed with key sk-1234567890abcdefghijklmnop');
    const normalized = normalizeTraceError(error);

    expect(normalized.message).not.toContain('sk-1234567890');
    expect(normalized.message).toContain('[REDACTED]');
  });

  test('truncates very long error messages', () => {
    const longMessage = 'x'.repeat(1000);
    const error = new AIGenerationError(longMessage);
    const normalized = normalizeTraceError(error);

    expect(normalized.message.length).toBeLessThanOrEqual(550); // 500 + marker
  });
});

describe('traceError', () => {
  test('adds error event to collector', () => {
    const collector = createTraceCollector({
      runId: 'test',
      action: 'generate.full',
      promptMode: 'full',
      rng: { seed: 1, algorithm: 'mulberry32' },
    });

    const error = new AIGenerationError('Test error');
    traceError(collector, error);

    const trace = collector.finalize();
    expect(trace.stats.hadErrors).toBe(true);

    const errorEvent = trace.events.find((e) => e.type === 'error');
    expect(errorEvent).toBeDefined();
  });

  test('does nothing when collector is undefined', () => {
    // Should not throw
    const normalized = traceError(undefined, new Error('test'));
    expect(normalized.type).toBe('unknown');
  });
});

// ========================================================================
// F6: Integration tests for deterministic decision tracing
// Events include domain/key/branchTaken/why/selection; no rejected branches
// ========================================================================

describe('traceDecision', () => {
  const baseInit: TraceCollectorInit = {
    runId: 'decision-test',
    action: 'generate.full',
    promptMode: 'full',
    rng: { seed: 99999, algorithm: 'mulberry32' },
  };

  test('adds decision event with required fields', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'genre',
      key: 'genre.resolve',
      branchTaken: 'jazz rock',
      why: 'User description mentions smooth jazz with rock elements',
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event).toBeDefined();
    expect(event.type).toBe('decision');
    expect(event.domain).toBe('genre');
    expect(event.key).toBe('genre.resolve');
    expect(event.branchTaken).toBe('jazz rock');
    expect(event.why).toContain('smooth jazz');
  });

  test('includes selection metadata for pickRandom', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'instruments',
      key: 'instruments.select',
      branchTaken: 'piano, bass, drums',
      why: 'Random selection from jazz instrument pool',
      selection: {
        method: 'pickRandom',
        chosenIndex: 2,
        candidates: ['guitar', 'saxophone', 'piano', 'trumpet', 'bass'],
      },
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.selection).toBeDefined();
    expect(event.selection?.method).toBe('pickRandom');
    expect(event.selection?.chosenIndex).toBe(2);
    expect(event.selection?.candidatesCount).toBe(5);
    expect(event.selection?.candidatesPreview).toContain('piano');
  });

  test('includes selection metadata for shuffleSlice', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'mood',
      key: 'mood.select',
      branchTaken: 'warm, smooth',
      why: 'Shuffled and sliced mood candidates',
      selection: {
        method: 'shuffleSlice',
        candidates: ['warm', 'smooth', 'mellow', 'relaxed', 'cozy'],
      },
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.selection?.method).toBe('shuffleSlice');
    expect(event.selection?.candidatesCount).toBe(5);
  });

  test('includes selection metadata for weightedChance', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'styleTags',
      key: 'styleTags.applyBoost',
      branchTaken: 'applied hi-fi boost',
      why: 'Weighted random decided to apply recording quality boost',
      selection: {
        method: 'weightedChance',
        rolls: [0.72],
      },
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.selection?.method).toBe('weightedChance');
    expect(event.selection?.rolls).toEqual([0.72]);
  });

  test('includes selection metadata for index', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'bpm',
      key: 'bpm.fromGenre',
      branchTaken: '120-140',
      why: 'BPM range selected based on genre index lookup',
      selection: {
        method: 'index',
        chosenIndex: 3,
        candidates: ['60-80', '80-100', '100-120', '120-140', '140-160'],
      },
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.selection?.method).toBe('index');
    expect(event.selection?.chosenIndex).toBe(3);
  });

  test('all decision domains are supported', () => {
    const domains: TraceDecisionEvent['domain'][] = [
      'genre',
      'mood',
      'instruments',
      'styleTags',
      'recording',
      'bpm',
      'other',
    ];

    for (const domain of domains) {
      const collector = createTraceCollector(baseInit);
      
      traceDecision(collector, {
        domain,
        key: `${domain}.test`,
        branchTaken: 'test branch',
        why: 'test reason',
      });

      const trace = collector.finalize();
      const event = trace.events.find((e) => e.type === 'decision')!;

      expect(event.domain).toBe(domain);
    }
  });

  test('does not emit rejected branches', () => {
    const collector = createTraceCollector(baseInit);
    
    // Only the chosen branch is recorded
    traceDecision(collector, {
      domain: 'genre',
      key: 'genre.resolve',
      branchTaken: 'jazz',
      why: 'Jazz was selected over rock and pop',
    });

    const trace = collector.finalize();
    const decisions = trace.events.filter((e) => e.type === 'decision');

    expect(decisions).toHaveLength(1);
    // No "rejected" events
    expect(decisions.every((d) => d.type === 'decision')).toBe(true);
  });

  test('truncates long branchTaken values', () => {
    const collector = createTraceCollector(baseInit);
    const longBranch = 'x'.repeat(500);
    
    traceDecision(collector, {
      domain: 'genre',
      key: 'genre.resolve',
      branchTaken: longBranch,
      why: 'test',
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.branchTaken.length).toBeLessThan(500);
    expect(event.branchTaken).toContain('[TRUNCATED]');
  });

  test('truncates long why values', () => {
    const collector = createTraceCollector(baseInit);
    const longWhy = 'y'.repeat(1000);
    
    traceDecision(collector, {
      domain: 'mood',
      key: 'mood.select',
      branchTaken: 'warm',
      why: longWhy,
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.why.length).toBeLessThan(1000);
    expect(event.why).toContain('[TRUNCATED]');
  });

  test('truncates candidates preview', () => {
    const collector = createTraceCollector(baseInit);
    
    // More than 10 candidates
    const manyCandidates = Array.from({ length: 20 }, (_, i) => `candidate-${i}`);
    
    traceDecision(collector, {
      domain: 'instruments',
      key: 'instruments.pool',
      branchTaken: 'selected subset',
      why: 'test',
      selection: {
        method: 'shuffleSlice',
        candidates: manyCandidates,
      },
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.selection?.candidatesPreview?.length).toBeLessThanOrEqual(10);
    expect(event.selection?.candidatesCount).toBe(20);
  });

  test('redacts secrets in branchTaken and why', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, {
      domain: 'other',
      key: 'debug.test',
      branchTaken: 'used key sk-1234567890abcdefghijklmnop',
      why: 'Authorization: Bearer abc.def.ghijklmnopqrst was valid',
    });

    const trace = collector.finalize();
    const event = trace.events.find((e) => e.type === 'decision')!;

    expect(event.branchTaken).toContain('[REDACTED]');
    expect(event.why).toContain('[REDACTED]');
    expect(event.branchTaken).not.toContain('sk-1234567890');
    expect(event.why).not.toContain('Bearer abc.def');
  });

  test('does nothing when collector is undefined', () => {
    // Should not throw
    traceDecision(undefined, {
      domain: 'genre',
      key: 'test',
      branchTaken: 'test',
      why: 'test',
    });
    // No assertion needed - just verifying no error
  });

  test('multiple decisions are recorded in order', () => {
    const collector = createTraceCollector(baseInit);
    
    traceDecision(collector, { domain: 'genre', key: 'genre.1', branchTaken: 'jazz', why: 'first' });
    traceDecision(collector, { domain: 'mood', key: 'mood.1', branchTaken: 'warm', why: 'second' });
    traceDecision(collector, { domain: 'instruments', key: 'inst.1', branchTaken: 'piano', why: 'third' });

    const trace = collector.finalize();
    const decisions = trace.events.filter((e): e is TraceDecisionEvent => e.type === 'decision');
    const d0 = decisions[0];
    const d1 = decisions[1];
    const d2 = decisions[2];

    expect(decisions).toHaveLength(3);
    expect(d0?.domain).toBe('genre');
    expect(d1?.domain).toBe('mood');
    expect(d2?.domain).toBe('instruments');
    
    // tMs should be non-decreasing
    expect(d1?.tMs).toBeGreaterThanOrEqual(d0?.tMs ?? 0);
    expect(d2?.tMs).toBeGreaterThanOrEqual(d1?.tMs ?? 0);
  });
});
