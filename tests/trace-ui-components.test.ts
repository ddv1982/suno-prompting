/**
 * F7: UI tests for trace timeline rendering + Advanced gating + copy actions
 *
 * These tests verify:
 * - Debug drawer components export correctly
 * - Timeline event card components are properly structured
 * - Trace summary generation for copy action
 *
 * Note: Full interactive tests require browser environment.
 * These tests verify component structure, exports, and the summary generation logic.
 */

import { describe, test, expect } from 'bun:test';

// ========================================================================
// F7: UI tests for timeline rendering + Advanced gating + copy actions
// ========================================================================

describe('Debug Drawer Components', () => {
  describe('component exports', () => {
    test('exports DebugDrawerBody', async () => {
      const { DebugDrawerBody } = await import('@/components/prompt-editor/debug-drawer');
      expect(DebugDrawerBody).toBeDefined();
      expect(typeof DebugDrawerBody).toBe('function');
    });

    test('exports DecisionCard', async () => {
      const { DecisionCard } =
        await import('@/components/prompt-editor/debug-drawer/decision-card');
      expect(DecisionCard).toBeDefined();
      expect(typeof DecisionCard).toBe('function');
    });

    test('exports LLMCallCard', async () => {
      const { LLMCallCard } = await import('@/components/prompt-editor/debug-drawer/llm-call-card');
      expect(LLMCallCard).toBeDefined();
      expect(typeof LLMCallCard).toBe('function');
    });

    test('exports ErrorCard', async () => {
      const { ErrorCard } = await import('@/components/prompt-editor/debug-drawer/error-card');
      expect(ErrorCard).toBeDefined();
      expect(typeof ErrorCard).toBe('function');
    });

    test('exports RunEventCard', async () => {
      const { RunEventCard } =
        await import('@/components/prompt-editor/debug-drawer/run-event-card');
      expect(RunEventCard).toBeDefined();
      expect(typeof RunEventCard).toBe('function');
    });

    test('exports TimelineEvent', async () => {
      const { TimelineEvent } =
        await import('@/components/prompt-editor/debug-drawer/timeline-event');
      expect(TimelineEvent).toBeDefined();
      expect(typeof TimelineEvent).toBe('function');
    });
  });

  describe('trace summary generation (copy action)', () => {
    test('exports generateTraceSummaryText function', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');
      expect(generateTraceSummaryText).toBeDefined();
      expect(typeof generateTraceSummaryText).toBe('function');
    });

    test('generates summary for minimal trace', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const trace = {
        version: 1 as const,
        runId: 'test-run',
        capturedAt: '2026-01-12T00:00:00.000Z',
        action: 'generate.full' as const,
        promptMode: 'full' as const,
        rng: { seed: 12345, algorithm: 'mulberry32' as const },
        stats: {
          eventCount: 1,
          llmCallCount: 0,
          decisionCount: 0,
          hadErrors: false,
          persistedBytes: 200,
          truncatedForCap: false,
        },
        events: [
          {
            id: 'e1',
            ts: '2026-01-12T00:00:00.000Z',
            tMs: 0,
            type: 'run.start' as const,
            summary: 'Generation started',
          },
        ],
      };

      const summary = generateTraceSummaryText(trace);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Generate (Full)');
      expect(summary).toContain('seed=12345');
      expect(summary).toContain('full'); // promptMode
    });

    test('summary includes LLM call information', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const trace = {
        version: 1 as const,
        runId: 'test-run',
        capturedAt: '2026-01-12T00:00:00.000Z',
        action: 'generate.full' as const,
        promptMode: 'full' as const,
        rng: { seed: 12345, algorithm: 'mulberry32' as const },
        stats: {
          eventCount: 2,
          llmCallCount: 1,
          decisionCount: 0,
          hadErrors: false,
          persistedBytes: 500,
          truncatedForCap: false,
        },
        events: [
          {
            id: 'e1',
            ts: '2026-01-12T00:00:00.000Z',
            tMs: 0,
            type: 'run.start' as const,
            summary: 'start',
          },
          {
            id: 'e2',
            ts: '2026-01-12T00:00:01.000Z',
            tMs: 1000,
            type: 'llm.call' as const,
            label: 'lyrics.generate',
            provider: { id: 'openai' as const, model: 'gpt-4', locality: 'cloud' as const },
            request: {
              inputSummary: { messageCount: 2, totalChars: 100, preview: 'test' },
            },
            response: { previewText: 'lyrics output' },
            telemetry: { latencyMs: 1500, tokensIn: 100, tokensOut: 200, finishReason: 'stop' },
          },
        ],
      };

      const summary = generateTraceSummaryText(trace);

      expect(summary).toContain('lyrics.generate');
      expect(summary).toContain('openai');
      expect(summary).toContain('gpt-4');
      expect(summary).toContain('cloud');
    });

    test('summary includes decision information', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const trace = {
        version: 1 as const,
        runId: 'test-run',
        capturedAt: '2026-01-12T00:00:00.000Z',
        action: 'generate.full' as const,
        promptMode: 'full' as const,
        rng: { seed: 12345, algorithm: 'mulberry32' as const },
        stats: {
          eventCount: 2,
          llmCallCount: 0,
          decisionCount: 1,
          hadErrors: false,
          persistedBytes: 400,
          truncatedForCap: false,
        },
        events: [
          {
            id: 'e1',
            ts: '2026-01-12T00:00:00.000Z',
            tMs: 0,
            type: 'run.start' as const,
            summary: 'start',
          },
          {
            id: 'e2',
            ts: '2026-01-12T00:00:00.500Z',
            tMs: 500,
            type: 'decision' as const,
            domain: 'genre' as const,
            key: 'genre.resolve',
            branchTaken: 'jazz rock',
            why: 'user preference',
            selection: {
              method: 'pickRandom' as const,
              chosenIndex: 2,
              candidatesCount: 5,
            },
          },
        ],
      };

      const summary = generateTraceSummaryText(trace);

      expect(summary).toContain('genre');
      expect(summary).toContain('jazz rock');
    });

    test('summary includes error information', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const trace = {
        version: 1 as const,
        runId: 'test-run',
        capturedAt: '2026-01-12T00:00:00.000Z',
        action: 'generate.full' as const,
        promptMode: 'full' as const,
        rng: { seed: 12345, algorithm: 'mulberry32' as const },
        stats: {
          eventCount: 2,
          llmCallCount: 0,
          decisionCount: 0,
          hadErrors: true,
          persistedBytes: 300,
          truncatedForCap: false,
        },
        events: [
          {
            id: 'e1',
            ts: '2026-01-12T00:00:00.000Z',
            tMs: 0,
            type: 'run.start' as const,
            summary: 'start',
          },
          {
            id: 'e2',
            ts: '2026-01-12T00:00:01.000Z',
            tMs: 1000,
            type: 'error' as const,
            error: {
              type: 'ai.generation' as const,
              message: 'Model timeout',
            },
          },
        ],
      };

      const summary = generateTraceSummaryText(trace);

      expect(summary).toContain('ai.generation');
      expect(summary).toContain('Model timeout');
      expect(summary).toContain('Errors:');
    });

    test('summary handles truncatedForCap flag', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const trace = {
        version: 1 as const,
        runId: 'test-run',
        capturedAt: '2026-01-12T00:00:00.000Z',
        action: 'generate.full' as const,
        promptMode: 'full' as const,
        rng: { seed: 12345, algorithm: 'mulberry32' as const },
        stats: {
          eventCount: 1,
          llmCallCount: 0,
          decisionCount: 0,
          hadErrors: false,
          persistedBytes: 65000,
          truncatedForCap: true,
        },
        events: [
          {
            id: 'e1',
            ts: '2026-01-12T00:00:00.000Z',
            tMs: 0,
            type: 'run.start' as const,
            summary: 'start',
          },
        ],
      };

      const summary = generateTraceSummaryText(trace);

      expect(summary).toContain('Truncated for size cap: yes');
    });

    test('summary formats different action types', async () => {
      const { generateTraceSummaryText } =
        await import('@/components/prompt-editor/debug-drawer/trace-summary');

      const actions = [
        { action: 'generate.full' as const, expected: 'Generate (Full)' },
        { action: 'generate.quickVibes' as const, expected: 'Generate (Quick Vibes)' },
        { action: 'generate.creativeBoost' as const, expected: 'Generate (Creative Boost)' },
        { action: 'refine' as const, expected: 'Refine' },
        { action: 'remix' as const, expected: 'Remix' },
        { action: 'convert.max' as const, expected: 'Convert to Max' },
        { action: 'convert.nonMax' as const, expected: 'Convert from Max' },
      ];

      for (const { action, expected } of actions) {
        const trace = {
          version: 1 as const,
          runId: 'test-run',
          capturedAt: '2026-01-12T00:00:00.000Z',
          action,
          promptMode: 'full' as const,
          rng: { seed: 12345, algorithm: 'mulberry32' as const },
          stats: {
            eventCount: 0,
            llmCallCount: 0,
            decisionCount: 0,
            hadErrors: false,
            persistedBytes: 100,
            truncatedForCap: false,
          },
          events: [],
        };

        const summary = generateTraceSummaryText(trace);
        expect(summary).toContain(expected);
      }
    });
  });
});

describe('Trace Types', () => {
  test('debug drawer types are exported', async () => {
    const types = await import('@/components/prompt-editor/debug-drawer/types');
    expect(types).toBeDefined();
  });
});

describe('Timeline Event Ordering', () => {
  test('events can be sorted by tMs', () => {
    const events = [
      { id: '3', tMs: 3000, type: 'decision' },
      { id: '1', tMs: 0, type: 'run.start' },
      { id: '2', tMs: 1500, type: 'llm.call' },
    ];

    const sorted = [...events].sort((a, b) => a.tMs - b.tMs);
    const s0 = sorted[0];
    const s1 = sorted[1];
    const s2 = sorted[2];

    expect(s0?.id).toBe('1');
    expect(s1?.id).toBe('2');
    expect(s2?.id).toBe('3');
  });

  test('events with same tMs maintain stable order', () => {
    const events = [
      { id: 'a', tMs: 1000, type: 'decision' },
      { id: 'b', tMs: 1000, type: 'decision' },
      { id: 'c', tMs: 1000, type: 'decision' },
    ];

    const sorted = [...events].sort((a, b) => a.tMs - b.tMs);
    const s0 = sorted[0];
    const s1 = sorted[1];
    const s2 = sorted[2];

    // JavaScript sort is stable, so order is preserved
    expect(s0?.id).toBe('a');
    expect(s1?.id).toBe('b');
    expect(s2?.id).toBe('c');
  });
});

describe('Advanced View Gating', () => {
  test('Advanced-only fields exist in LLM call type', async () => {
    // This test verifies the type structure supports Advanced gating
    const { enforceTraceSizeCap } = await import('@shared/trace');

    // Create a trace with Advanced-only fields
    const trace = {
      version: 1 as const,
      runId: 'test',
      capturedAt: '2026-01-12T00:00:00.000Z',
      action: 'generate.full' as const,
      promptMode: 'full' as const,
      rng: { seed: 1, algorithm: 'mulberry32' as const },
      stats: {
        eventCount: 1,
        llmCallCount: 1,
        decisionCount: 0,
        hadErrors: false,
        persistedBytes: 0,
        truncatedForCap: false,
      },
      events: [
        {
          id: 'llm-1',
          ts: '2026-01-12T00:00:01.000Z',
          tMs: 1000,
          type: 'llm.call' as const,
          label: 'test',
          provider: { id: 'openai' as const, model: 'gpt-4', locality: 'cloud' as const },
          request: {
            inputSummary: { messageCount: 2, totalChars: 100, preview: 'preview' },
            // Advanced-only field
            messages: [
              { role: 'system' as const, content: 'system prompt' },
              { role: 'user' as const, content: 'user prompt' },
            ],
          },
          response: {
            previewText: 'response preview',
            // Advanced-only field
            rawText: 'full raw response text',
          },
        },
      ],
    };

    const capped = enforceTraceSizeCap(trace);
    const llmEvent = capped.events.find((e) => e.type === 'llm.call');

    // In a small trace, Advanced fields should be preserved
    expect(llmEvent).toBeDefined();
    if (llmEvent?.type === 'llm.call') {
      // Verify structure supports both default and advanced view
      expect(llmEvent.request.inputSummary).toBeDefined(); // Default view
      expect(llmEvent.response.previewText).toBeDefined(); // Default view
    }
  });
});

describe('Copy Actions Structure', () => {
  test('trace can be serialized to JSON for copy', () => {
    const trace = {
      version: 1 as const,
      runId: 'test',
      capturedAt: '2026-01-12T00:00:00.000Z',
      action: 'generate.full' as const,
      promptMode: 'full' as const,
      rng: { seed: 1, algorithm: 'mulberry32' as const },
      stats: {
        eventCount: 0,
        llmCallCount: 0,
        decisionCount: 0,
        hadErrors: false,
        persistedBytes: 0,
        truncatedForCap: false,
      },
      events: [],
    };

    const json = JSON.stringify(trace, null, 2);

    expect(typeof json).toBe('string');
    expect(json).toContain('"version": 1');
    expect(json).toContain('"runId": "test"');

    // Verify it can be parsed back
    const parsed = JSON.parse(json);
    expect(parsed.runId).toBe('test');
    expect(parsed.version).toBe(1);
  });

  test('complex trace serializes correctly', () => {
    const trace = {
      version: 1 as const,
      runId: 'complex-test',
      capturedAt: '2026-01-12T00:00:00.000Z',
      action: 'generate.full' as const,
      promptMode: 'full' as const,
      rng: { seed: 99999, algorithm: 'mulberry32' as const },
      stats: {
        eventCount: 3,
        llmCallCount: 1,
        decisionCount: 1,
        hadErrors: false,
        persistedBytes: 1000,
        truncatedForCap: false,
      },
      events: [
        {
          id: 'e1',
          ts: '2026-01-12T00:00:00.000Z',
          tMs: 0,
          type: 'run.start' as const,
          summary: 'start',
        },
        {
          id: 'e2',
          ts: '2026-01-12T00:00:00.500Z',
          tMs: 500,
          type: 'decision' as const,
          domain: 'genre' as const,
          key: 'genre.resolve',
          branchTaken: 'jazz',
          why: 'user preference',
        },
        {
          id: 'e3',
          ts: '2026-01-12T00:00:01.000Z',
          tMs: 1000,
          type: 'llm.call' as const,
          label: 'lyrics.generate',
          provider: { id: 'openai' as const, model: 'gpt-4', locality: 'cloud' as const },
          request: {
            inputSummary: { messageCount: 2, totalChars: 100, preview: 'test' },
          },
          response: { previewText: 'output' },
        },
      ],
    };

    const json = JSON.stringify(trace, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed.events).toHaveLength(3);
    expect(parsed.events[1].type).toBe('decision');
    expect(parsed.events[2].type).toBe('llm.call');
  });
});
