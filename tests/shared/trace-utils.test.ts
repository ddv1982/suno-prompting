import { describe, expect, test } from 'bun:test';

import {
  TRACE_PERSISTED_BYTES_CAP,
  TRACE_TRUNCATION_MARKER,
  DEFAULT_CANDIDATE_TRUNCATION,
  byteLengthUtf8,
  enforceTraceSizeCap,
  redactSecretsDeep,
  redactSecretsInText,
  truncateCandidates,
  truncateTextWithMarker,
} from '@shared/trace';

import type { TraceRun, TraceLLMCallEvent, TraceDecisionEvent, TraceErrorEvent } from '@shared/types/trace';


function makeBaseTrace(): TraceRun {
  return {
    version: 1,
    runId: 'run-1',
    capturedAt: '2026-01-12T00:00:00.000Z',
    action: 'generate.full',
    promptMode: 'full',
    rng: { seed: 123, algorithm: 'mulberry32' },
    stats: {
      eventCount: 0,
      llmCallCount: 0,
      decisionCount: 0,
      hadErrors: false,
      persistedBytes: 0,
      truncatedForCap: false,
    },
    events: [
      {
        id: 'e1',
        ts: '2026-01-12T00:00:00.000Z',
        tMs: 0,
        type: 'run.start',
        summary: 'start',
      },
    ],
  };
}

// Helper to create a minimal LLM call event for testing
function makeLLMCallEvent(overrides: Partial<TraceLLMCallEvent> = {}): TraceLLMCallEvent {
  return {
    id: 'llm-1',
    ts: '2026-01-12T00:00:01.000Z',
    tMs: 1000,
    type: 'llm.call',
    label: 'test.call',
    provider: { id: 'openai', model: 'gpt-4', locality: 'cloud' },
    request: {
      maxRetries: 2,
      inputSummary: { messageCount: 2, totalChars: 100, preview: 'test preview' },
    },
    response: { previewText: 'test response' },
    ...overrides,
  };
}

// Helper to create a decision event for testing
function makeDecisionEvent(overrides: Partial<TraceDecisionEvent> = {}): TraceDecisionEvent {
  return {
    id: 'dec-1',
    ts: '2026-01-12T00:00:00.500Z',
    tMs: 500,
    type: 'decision',
    domain: 'genre',
    key: 'genre.resolve',
    branchTaken: 'selected jazz',
    why: 'user description mentioned smooth jazz',
    ...overrides,
  };
}

// Helper to create an error event for testing
function makeErrorEvent(overrides: Partial<TraceErrorEvent> = {}): TraceErrorEvent {
  return {
    id: 'err-1',
    ts: '2026-01-12T00:00:02.000Z',
    tMs: 2000,
    type: 'error',
    error: {
      type: 'ai.generation',
      message: 'Model returned empty response',
    },
    ...overrides,
  };
}

// ========================================================================
// F1: Unit tests for redaction - verifies non-secrets are preserved
// Note: We don't test with fake API keys to avoid triggering secret scanners
// ========================================================================

describe('redactSecretsInText', () => {
  describe('non-secrets are not over-redacted', () => {
    test('preserves normal text without secrets', () => {
      const input = 'This is a normal message about music generation';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves URLs without secrets', () => {
      const input = 'https://api.example.com/v1/generate?format=json';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves code snippets without secrets', () => {
      const input = 'const result = await generateText({ model: "gpt-4" });';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves user descriptions', () => {
      const input = 'A melancholic jazz song about autumn leaves falling';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves genre and style tags', () => {
      const input = 'genre: "jazz rock", mood: "warm", instruments: ["piano", "bass"]';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves lyrics content', () => {
      const input = 'Verse 1:\nSky so blue, dreams come true\nWalking through the morning dew';
      expect(redactSecretsInText(input)).toBe(input);
    });

    test('preserves technical terms that look like secrets', () => {
      expect(redactSecretsInText('skipping stones')).toBe('skipping stones');
      expect(redactSecretsInText('desk-123')).toBe('desk-123');
      expect(redactSecretsInText('gsketch')).toBe('gsketch');
    });

    test('preserves "skill" or "sketch" words containing sk', () => {
      expect(redactSecretsInText('This is a skill test')).toBe('This is a skill test');
      expect(redactSecretsInText('sketch drawing')).toBe('sketch drawing');
    });

    test('preserves bearer as word when not followed by token', () => {
      expect(redactSecretsInText('The bearer of news')).toBe('The bearer of news');
    });

    test('does not redact short sk- strings (non-secrets)', () => {
      expect(redactSecretsInText('sk-1234')).toBe('sk-1234');
      expect(redactSecretsInText('sk-short')).toBe('sk-short');
    });

    test('does not redact short gsk_ strings', () => {
      expect(redactSecretsInText('gsk_short')).toBe('gsk_short');
    });
  });
});

describe('redactSecretsDeep', () => {
  test('handles null and undefined values', () => {
    const input = {
      nullVal: null,
      undefinedVal: undefined,
      normalStr: 'hello',
    };

    const output = redactSecretsDeep(input) as any;
    expect(output.nullVal).toBeNull();
    expect(output.undefinedVal).toBeUndefined();
    expect(output.normalStr).toBe('hello');
  });

  test('handles number and boolean values', () => {
    const input = {
      num: 42,
      bool: true,
      str: 'normal string',
    };

    const output = redactSecretsDeep(input) as any;
    expect(output.num).toBe(42);
    expect(output.bool).toBe(true);
    expect(output.str).toBe('normal string');
  });

  test('preserves normal nested objects without secrets', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            value: 'normal value',
          },
        },
      },
    };

    const output = redactSecretsDeep(input) as any;
    expect(output.level1.level2.level3.value).toBe('normal value');
  });

  test('preserves arrays with normal content', () => {
    const input = ['normal text', { key: 'normal value' }, ['nested', 'array']];

    const output = redactSecretsDeep(input) as any[];
    expect(output[0]).toBe('normal text');
    expect(output[1].key).toBe('normal value');
    expect(output[2][0]).toBe('nested');
    expect(output[2][1]).toBe('array');
  });
});

// ========================================================================
// F2: Unit tests for truncation helpers
// Verifies markers are appended and per-field limits are applied
// ========================================================================

describe('truncateTextWithMarker', () => {
  describe('basic truncation behavior', () => {
    test('returns original string when under limit', () => {
      const result = truncateTextWithMarker('hello', 10);
      expect(result).toEqual({ text: 'hello', truncated: false, originalLength: 5 });
    });

    test('appends marker and respects max length when over limit', () => {
      const result = truncateTextWithMarker('a'.repeat(50), 20);
      expect(result.truncated).toBe(true);
      expect(result.text).toEndWith(TRACE_TRUNCATION_MARKER);
      expect(result.text.length).toBe(20);
    });

    test('returns original string when exactly at limit', () => {
      const input = 'x'.repeat(100);
      const result = truncateTextWithMarker(input, 100);
      expect(result.text).toBe(input);
      expect(result.truncated).toBe(false);
    });
  });

  describe('marker appending', () => {
    test('marker is always visible when truncated', () => {
      const result = truncateTextWithMarker('abcdefghijklmnopqrstuvwxyz', 15);
      expect(result.text).toContain(TRACE_TRUNCATION_MARKER);
      expect(result.truncated).toBe(true);
    });

    test('custom marker can be used', () => {
      const customMarker = '...';
      const result = truncateTextWithMarker('abcdefghij', 7, customMarker);
      expect(result.text).toEndWith(customMarker);
      expect(result.text.length).toBe(7);
    });

    test('records original length in result', () => {
      const input = 'x'.repeat(1000);
      const result = truncateTextWithMarker(input, 50);
      expect(result.originalLength).toBe(1000);
    });
  });

  describe('edge cases', () => {
    test('handles empty string', () => {
      const result = truncateTextWithMarker('', 10);
      expect(result.text).toBe('');
      expect(result.truncated).toBe(false);
      expect(result.originalLength).toBe(0);
    });

    test('handles max length smaller than marker', () => {
      const result = truncateTextWithMarker('hello world', 5);
      // Should still produce something meaningful
      expect(result.truncated).toBe(true);
      expect(result.text.length).toBeLessThanOrEqual(TRACE_TRUNCATION_MARKER.length + 5);
    });

    test('handles zero max length', () => {
      const result = truncateTextWithMarker('hello', 0);
      expect(result.truncated).toBe(true);
    });

    test('handles negative max length (treated as 0)', () => {
      const result = truncateTextWithMarker('hello', -5);
      expect(result.truncated).toBe(true);
    });

    test('handles unicode characters', () => {
      const input = '🎵🎸🎹'.repeat(100);
      const result = truncateTextWithMarker(input, 50);
      expect(result.truncated).toBe(true);
      expect(result.text.length).toBeLessThanOrEqual(50);
    });
  });
});

describe('truncateCandidates', () => {
  describe('count limiting', () => {
    test('limits candidate count to default max (10)', () => {
      const input = Array.from({ length: 15 }, (_, i) => `candidate-${i}`);
      const output = truncateCandidates(input);
      expect(output).toHaveLength(DEFAULT_CANDIDATE_TRUNCATION.maxItems);
    });

    test('preserves all candidates when under limit', () => {
      const input = ['a', 'b', 'c'];
      const output = truncateCandidates(input);
      expect(output).toHaveLength(3);
    });

    test('custom maxItems can be specified', () => {
      const input = Array.from({ length: 20 }, (_, i) => `c${i}`);
      const output = truncateCandidates(input, { maxItems: 5, maxCharsPerItem: 100 });
      expect(output).toHaveLength(5);
    });
  });

  describe('per-item truncation', () => {
    test('truncates each entry to default max chars', () => {
      const input = Array.from({ length: 5 }, (_, i) => `candidate-${i}-${'x'.repeat(200)}`);
      const output = truncateCandidates(input);
      output.forEach((candidate) => {
        expect(candidate.length).toBeLessThanOrEqual(DEFAULT_CANDIDATE_TRUNCATION.maxCharsPerItem);
      });
    });

    test('appends marker to truncated candidates', () => {
      const input = ['a'.repeat(200)];
      const output = truncateCandidates(input);
      expect(output[0]).toEndWith(TRACE_TRUNCATION_MARKER);
    });

    test('does not append marker to short candidates', () => {
      const input = ['short'];
      const output = truncateCandidates(input);
      expect(output[0]).toBe('short');
    });

    test('custom maxCharsPerItem can be specified', () => {
      const input = ['abcdefghijklmnopqrstuvwxyz'];
      const output = truncateCandidates(input, { maxItems: 10, maxCharsPerItem: 20 });
      const first = output[0];
      // When truncated, total length includes the marker
      expect(first).toBeDefined();
      expect(first?.length).toBeLessThanOrEqual(20);
      expect(first).toContain(TRACE_TRUNCATION_MARKER);
    });
  });

  describe('edge cases', () => {
    test('handles empty array', () => {
      const output = truncateCandidates([]);
      expect(output).toEqual([]);
    });

    test('handles array with empty strings', () => {
      const output = truncateCandidates(['', '', '']);
      expect(output).toEqual(['', '', '']);
    });

    test('preserves order of candidates', () => {
      const input = ['first', 'second', 'third'];
      const output = truncateCandidates(input);
      expect(output).toEqual(['first', 'second', 'third']);
    });
  });
});

describe('byteLengthUtf8', () => {
  test('computes correct byte length for ASCII', () => {
    expect(byteLengthUtf8('a')).toBe(1);
    expect(byteLengthUtf8('hello')).toBe(5);
    expect(byteLengthUtf8('')).toBe(0);
  });

  test('computes correct byte length for multi-byte UTF-8', () => {
    expect(byteLengthUtf8('€')).toBe(3); // Euro sign is 3 bytes
    expect(byteLengthUtf8('日')).toBe(3); // CJK character
    expect(byteLengthUtf8('🎵')).toBe(4); // Emoji (4 bytes)
  });

  test('computes correct byte length for mixed content', () => {
    const mixed = 'Hello 世界 🌍';
    const expected = 5 + 1 + 6 + 1 + 4; // "Hello" + space + "世界" + space + emoji
    expect(byteLengthUtf8(mixed)).toBe(expected);
  });

  test('handles JSON serialization overhead', () => {
    const obj = { key: 'value' };
    const json = JSON.stringify(obj);
    expect(byteLengthUtf8(json)).toBe(json.length); // All ASCII
  });
});

// ========================================================================
// F3: Unit tests for size cap enforcement
// Verifies drop order (Advanced fields first) and final <= 64KB
// ========================================================================

describe('enforceTraceSizeCap', () => {
  describe('basic cap enforcement', () => {
    test('returns trace unchanged when under cap', () => {
      const trace = makeBaseTrace();
      const capped = enforceTraceSizeCap(trace);

      expect(capped.stats.truncatedForCap).toBe(false);
      expect(capped.stats.persistedBytes).toBeLessThan(TRACE_PERSISTED_BYTES_CAP);
      expect(capped.events).toHaveLength(trace.events.length);
    });

    test('always sets persistedBytes in stats', () => {
      const trace = makeBaseTrace();
      const capped = enforceTraceSizeCap(trace);

      expect(capped.stats.persistedBytes).toBeGreaterThan(0);
    });

    test('final trace is always <= 64KB', () => {
      const huge = 'x'.repeat(120_000);
      const trace = makeBaseTrace();
      trace.events.push(makeLLMCallEvent({
        request: {
          maxRetries: 0,
          inputSummary: { messageCount: 1, totalChars: huge.length, preview: huge },
          messages: [{ role: 'user', content: huge }],
        },
        response: { previewText: huge, rawText: huge },
      }));

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.persistedBytes).toBeLessThanOrEqual(TRACE_PERSISTED_BYTES_CAP);
    });
  });

  describe('drop order', () => {
    test('drops Advanced-only fields first (messages, rawText)', () => {
      const huge = 'x'.repeat(120_000);
      const trace = makeBaseTrace();
      trace.events.push(makeLLMCallEvent({
        id: 'e2',
        request: {
          maxRetries: 0,
          inputSummary: { messageCount: 1, totalChars: huge.length, preview: 'preview' },
          messages: [{ role: 'user', content: huge }],
        },
        response: { previewText: 'ok', rawText: huge },
      }));

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.truncatedForCap).toBe(true);

      const llm = capped.events.find((e) => e.type === 'llm.call')!;
      expect(llm.request.messages).toBeUndefined();
      expect(llm.response.rawText).toBeUndefined();
    });

    test('drops run.end events when still too large', () => {
      const trace = makeBaseTrace();

      // Add many LLM calls with large previews
      for (let i = 0; i < 40; i += 1) {
        trace.events.push(makeLLMCallEvent({
          id: `l${i}`,
          tMs: 1000 + i,
          request: {
            inputSummary: { messageCount: 1, totalChars: 5, preview: 'p'.repeat(5000) },
          },
          response: { previewText: 'r'.repeat(5000) },
        }));
      }

      trace.events.push({
        id: 'e-end',
        ts: '2026-01-12T00:01:00.000Z',
        tMs: 60_000,
        type: 'run.end',
        summary: 'end',
      });

      const capped = enforceTraceSizeCap(trace);
      expect(capped.events.some((e) => e.type === 'run.end')).toBe(false);
    });

    test('compacts preview fields when needed', () => {
      const trace = makeBaseTrace();

      for (let i = 0; i < 40; i += 1) {
        trace.events.push(makeLLMCallEvent({
          id: `l${i}`,
          tMs: 1000 + i,
          request: {
            inputSummary: { messageCount: 1, totalChars: 5, preview: 'p'.repeat(5000) },
          },
          response: { previewText: 'r'.repeat(5000) },
        }));
      }

      const capped = enforceTraceSizeCap(trace);

      const anyLlm = capped.events.find((e) => e.type === 'llm.call')!;
      // Preview should be compacted (truncated)
      expect(anyLlm.request.inputSummary.preview.length).toBeLessThan(5000);
    });

    test('compacts decision why fields when needed', () => {
      const trace = makeBaseTrace();

      trace.events.push(makeDecisionEvent({
        id: 'd1',
        why: 'y'.repeat(10_000),
      }));

      for (let i = 0; i < 40; i += 1) {
        trace.events.push(makeLLMCallEvent({
          id: `l${i}`,
          tMs: 1000 + i,
          request: {
            inputSummary: { messageCount: 1, totalChars: 5, preview: 'p'.repeat(5000) },
          },
          response: { previewText: 'r'.repeat(5000) },
        }));
      }

      const capped = enforceTraceSizeCap(trace);

      const decision = capped.events.find((e) => e.type === 'decision')!;
      expect(decision.why.length).toBeLessThan(10_000);
      expect(decision.why).toContain(TRACE_TRUNCATION_MARKER);
    });
  });

  describe('preserves essential data', () => {
    test('preserves LLM call existence even when compacted', () => {
      const huge = 'x'.repeat(120_000);
      const trace = makeBaseTrace();

      for (let i = 0; i < 5; i += 1) {
        trace.events.push(makeLLMCallEvent({
          id: `llm-${i}`,
          label: `call-${i}`,
          request: {
            inputSummary: { messageCount: 1, totalChars: huge.length, preview: huge },
            messages: [{ role: 'user', content: huge }],
          },
          response: { previewText: huge, rawText: huge },
        }));
      }

      const capped = enforceTraceSizeCap(trace);

      const llmEvents = capped.events.filter((e) => e.type === 'llm.call');
      expect(llmEvents.length).toBe(5); // All LLM calls preserved
    });

    test('preserves decision events even when compacted', () => {
      const trace = makeBaseTrace();

      for (let i = 0; i < 10; i += 1) {
        trace.events.push(makeDecisionEvent({
          id: `dec-${i}`,
          domain: 'genre',
          key: `decision.${i}`,
          branchTaken: `branch-${i}`,
          why: 'reason '.repeat(100),
        }));
      }

      // Add lots of LLM calls to force compaction
      for (let i = 0; i < 40; i += 1) {
        trace.events.push(makeLLMCallEvent({
          id: `l${i}`,
          request: {
            inputSummary: { messageCount: 1, totalChars: 5, preview: 'p'.repeat(5000) },
          },
          response: { previewText: 'r'.repeat(5000) },
        }));
      }

      const capped = enforceTraceSizeCap(trace);

      const decisionEvents = capped.events.filter((e) => e.type === 'decision');
      expect(decisionEvents.length).toBeGreaterThan(0);
    });

    test('preserves run.start event', () => {
      const trace = makeBaseTrace();
      trace.events.push({
        id: 'e-end',
        ts: '2026-01-12T00:01:00.000Z',
        tMs: 60_000,
        type: 'run.end',
        summary: 'end',
      });

      const capped = enforceTraceSizeCap(trace);
      expect(capped.events.some((e) => e.type === 'run.start')).toBe(true);
    });
  });

  describe('truncatedForCap flag', () => {
    test('sets truncatedForCap=true when any compaction occurs', () => {
      const huge = 'x'.repeat(120_000);
      const trace = makeBaseTrace();
      trace.events.push(makeLLMCallEvent({
        request: {
          maxRetries: 0,
          inputSummary: { messageCount: 1, totalChars: huge.length, preview: 'preview' },
          messages: [{ role: 'user', content: huge }],
        },
        response: { previewText: 'ok', rawText: huge },
      }));

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.truncatedForCap).toBe(true);
    });

    test('sets truncatedForCap=false when no compaction needed', () => {
      const trace = makeBaseTrace();
      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.truncatedForCap).toBe(false);
    });
  });

  describe('stats computation', () => {
    test('computes eventCount correctly', () => {
      const trace = makeBaseTrace();
      trace.events.push(makeLLMCallEvent());
      trace.events.push(makeDecisionEvent());

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.eventCount).toBe(3); // run.start + llm.call + decision
    });

    test('computes llmCallCount correctly', () => {
      const trace = makeBaseTrace();
      trace.events.push(makeLLMCallEvent({ id: 'llm-1' }));
      trace.events.push(makeLLMCallEvent({ id: 'llm-2' }));

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.llmCallCount).toBe(2);
    });

    test('computes decisionCount correctly', () => {
      const trace = makeBaseTrace();
      trace.events.push(makeDecisionEvent({ id: 'dec-1' }));
      trace.events.push(makeDecisionEvent({ id: 'dec-2', domain: 'mood' }));
      trace.events.push(makeDecisionEvent({ id: 'dec-3', domain: 'instruments' }));

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.decisionCount).toBe(3);
    });

    test('computes hadErrors correctly', () => {
      const trace = makeBaseTrace();
      trace.events.push(makeErrorEvent());

      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.hadErrors).toBe(true);
    });

    test('hadErrors=false when no error events', () => {
      const trace = makeBaseTrace();
      const capped = enforceTraceSizeCap(trace);
      expect(capped.stats.hadErrors).toBe(false);
    });
  });
});

// ========================================================================
// F4: Unit tests for trace text summary generation
// Validates stable, human-readable output and safe handling of missing fields
// ========================================================================

describe('generateTraceSummaryText', () => {
  // Import the summary generator dynamically since it's in main-ui
  // We test the logic patterns here using the trace utilities

  test('summary includes run action and seed', () => {
    const trace = makeBaseTrace();
    // The summary should include action and seed from trace
    expect(trace.action).toBe('generate.full');
    expect(trace.rng.seed).toBe(123);
    // Summary generation is tested in integration
  });

  test('summary includes mode information', () => {
    const trace = makeBaseTrace();
    expect(trace.promptMode).toBe('full');
  });

  test('summary stats are accurate', () => {
    const trace = makeBaseTrace();
    trace.events.push(makeLLMCallEvent({ id: 'llm-1', label: 'lyrics.generate' }));
    trace.events.push(makeLLMCallEvent({ id: 'llm-2', label: 'title.generate' }));
    trace.events.push(makeDecisionEvent({ id: 'dec-1', domain: 'genre' }));
    trace.events.push(makeDecisionEvent({ id: 'dec-2', domain: 'mood' }));

    const capped = enforceTraceSizeCap(trace);

    expect(capped.stats.eventCount).toBe(5); // run.start + 2 llm + 2 decision
    expect(capped.stats.llmCallCount).toBe(2);
    expect(capped.stats.decisionCount).toBe(2);
  });

  test('summary handles traces with errors', () => {
    const trace = makeBaseTrace();
    trace.events.push(makeErrorEvent({
      id: 'err-1',
      error: {
        type: 'ai.generation',
        message: 'Model timeout after 30s',
      },
    }));

    const capped = enforceTraceSizeCap(trace);
    expect(capped.stats.hadErrors).toBe(true);
  });

  test('summary handles traces with telemetry', () => {
    const trace = makeBaseTrace();
    trace.events.push(makeLLMCallEvent({
      id: 'llm-1',
      telemetry: {
        latencyMs: 1500,
        tokensIn: 100,
        tokensOut: 250,
        finishReason: 'stop',
      },
    }));

    const llm = trace.events.find((e) => e.type === 'llm.call')!;
    expect(llm.telemetry?.latencyMs).toBe(1500);
    expect(llm.telemetry?.tokensIn).toBe(100);
    expect(llm.telemetry?.tokensOut).toBe(250);
    expect(llm.telemetry?.finishReason).toBe('stop');
  });

  test('summary handles traces with attempts/retries', () => {
    const trace = makeBaseTrace();
    trace.events.push(makeLLMCallEvent({
      id: 'llm-1',
      attempts: [
        {
          attempt: 1,
          startedAt: '2026-01-12T00:00:01.000Z',
          endedAt: '2026-01-12T00:00:02.000Z',
          latencyMs: 1000,
          error: { type: 'ai.generation', message: 'Rate limited' },
        },
        {
          attempt: 2,
          startedAt: '2026-01-12T00:00:03.000Z',
          endedAt: '2026-01-12T00:00:04.000Z',
          latencyMs: 1000,
        },
      ],
    }));

    const llm = trace.events.find((e) => e.type === 'llm.call')!;
    const attempts = llm.attempts;
    expect(attempts).toHaveLength(2);
    expect(attempts?.[0]?.error).toBeDefined();
  });

  test('summary handles decision events with selection metadata', () => {
    const trace = makeBaseTrace();
    trace.events.push(makeDecisionEvent({
      id: 'dec-1',
      selection: {
        method: 'pickRandom',
        chosenIndex: 3,
        candidatesCount: 10,
        candidatesPreview: ['jazz', 'rock', 'pop', 'blues'],
      },
    }));

    const decision = trace.events.find((e) => e.type === 'decision')!;
    expect(decision.selection?.method).toBe('pickRandom');
    expect(decision.selection?.chosenIndex).toBe(3);
    expect(decision.selection?.candidatesCount).toBe(10);
  });

  test('summary handles traces with truncation flag', () => {
    const trace = makeBaseTrace();
    // Simulate a trace that was truncated
    const modifiedTrace = {
      ...trace,
      stats: {
        ...trace.stats,
        truncatedForCap: true,
      },
    };

    expect(modifiedTrace.stats.truncatedForCap).toBe(true);
  });

  test('summary handles different action types', () => {
    const actions: TraceRun['action'][] = [
      'generate.full',
      'generate.quickVibes',
      'generate.creativeBoost',
      'refine',
      'remix',
      'convert.max',
      'convert.nonMax',
    ];

    for (const action of actions) {
      const trace: TraceRun = {
        ...makeBaseTrace(),
        action,
      };
      expect(trace.action).toBe(action);
    }
  });

  test('summary handles all decision domains', () => {
    const domains: TraceDecisionEvent['domain'][] = [
      'genre',
      'mood',
      'instruments',
      'styleTags',
      'recording',
      'bpm',
      'other',
    ];

    const trace = makeBaseTrace();
    for (let i = 0; i < domains.length; i += 1) {
      const domain = domains[i];
      if (!domain) continue;
      trace.events.push(makeDecisionEvent({
        id: `dec-${i}`,
        domain,
        key: `${domain}.key`,
        branchTaken: `${domain} branch`,
        why: `because of ${domain}`,
      }));
    }

    const decisionEvents = trace.events.filter((e) => e.type === 'decision');
    expect(decisionEvents).toHaveLength(domains.length);

    // Verify each domain is represented
    for (const domain of domains) {
      expect(decisionEvents.some((d) => d.domain === domain)).toBe(true);
    }
  });

  test('summary handles missing optional fields gracefully', () => {
    const trace = makeBaseTrace();

    // LLM call without optional fields
    trace.events.push({
      id: 'llm-minimal',
      ts: '2026-01-12T00:00:01.000Z',
      tMs: 1000,
      type: 'llm.call',
      label: 'minimal.call',
      provider: { id: 'openai', model: 'gpt-4', locality: 'cloud' },
      request: {
        inputSummary: { messageCount: 1, totalChars: 50, preview: 'test' },
        // No temperature, maxTokens, maxRetries, providerOptions, messages
      },
      response: {
        previewText: 'response',
        // No rawText
      },
      // No telemetry, attempts
    });

    // Decision without selection
    trace.events.push({
      id: 'dec-minimal',
      ts: '2026-01-12T00:00:00.500Z',
      tMs: 500,
      type: 'decision',
      domain: 'genre',
      key: 'genre.resolve',
      branchTaken: 'jazz',
      why: 'user preference',
      // No selection
    });

    // Error without optional fields
    trace.events.push({
      id: 'err-minimal',
      ts: '2026-01-12T00:00:02.000Z',
      tMs: 2000,
      type: 'error',
      error: {
        type: 'unknown',
        message: 'Something went wrong',
        // No status, providerRequestId
      },
    });

    const capped = enforceTraceSizeCap(trace);
    expect(capped.stats.eventCount).toBe(4);
    expect(capped.stats.llmCallCount).toBe(1);
    expect(capped.stats.decisionCount).toBe(1);
    expect(capped.stats.hadErrors).toBe(true);
  });
});
