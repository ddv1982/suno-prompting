/**
 * Generate a human-readable text summary from a TraceRun.
 * Used by "Copy as text summary" action.
 *
 * @module components/prompt-editor/debug-drawer/trace-summary
 */

import type {
  TraceRun,
  TraceEvent,
  TraceLLMCallEvent,
  TraceDecisionEvent,
  TraceErrorEvent,
  TraceRunEvent,
} from '@shared/types';

export function formatAction(action: TraceRun['action']): string {
  switch (action) {
    case 'generate.full':
      return 'Generate (Full)';
    case 'generate.quickVibes':
      return 'Generate (Quick Vibes)';
    case 'generate.creativeBoost':
      return 'Generate (Creative Boost)';
    case 'refine':
      return 'Refine';
    case 'remix':
      return 'Remix';
    case 'convert.max':
      return 'Convert to Max';
    case 'convert.nonMax':
      return 'Convert from Max';
    default:
      return action;
  }
}

export function formatLatency(ms: number | undefined): string {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatLLMCall(event: TraceLLMCallEvent): string {
  const parts: string[] = [];
  const { provider, telemetry, attempts } = event;

  parts.push(`LLM: ${event.label}`);
  parts.push(`  via ${provider.id} ${provider.model} (${provider.locality})`);

  if (attempts && attempts.length > 0) {
    parts.push(`  attempts=${attempts.length}`);
  }

  if (telemetry) {
    const telemetryParts: string[] = [];
    if (telemetry.latencyMs !== undefined) {
      telemetryParts.push(`latency=${formatLatency(telemetry.latencyMs)}`);
    }
    if (telemetry.tokensIn !== undefined) {
      telemetryParts.push(`in=${telemetry.tokensIn}`);
    }
    if (telemetry.tokensOut !== undefined) {
      telemetryParts.push(`out=${telemetry.tokensOut}`);
    }
    if (telemetry.finishReason) {
      telemetryParts.push(`reason=${telemetry.finishReason}`);
    }
    if (telemetryParts.length > 0) {
      parts.push(`  ${telemetryParts.join(', ')}`);
    }
  }

  return parts.join('\n');
}

function formatDecision(event: TraceDecisionEvent): string {
  const parts: string[] = [];
  parts.push(`Decision [${event.domain}]: ${event.key}`);
  parts.push(`  branch: ${event.branchTaken}`);
  if (event.why) {
    parts.push(`  why: ${event.why}`);
  }
  if (event.selection) {
    const { method, chosenIndex, candidatesCount } = event.selection;
    const selParts = [`method=${method}`];
    if (chosenIndex !== undefined) selParts.push(`idx=${chosenIndex}`);
    if (candidatesCount !== undefined) selParts.push(`count=${candidatesCount}`);
    parts.push(`  selection: ${selParts.join(', ')}`);
  }
  return parts.join('\n');
}

function formatError(event: TraceErrorEvent): string {
  return `Error [${event.error.type}]: ${event.error.message}`;
}

function formatRunEvent(event: TraceRunEvent): string {
  return `${event.type === 'run.start' ? 'Run started' : 'Run ended'}: ${event.summary}`;
}

function formatEvent(event: TraceEvent): string {
  switch (event.type) {
    case 'run.start':
    case 'run.end':
      return formatRunEvent(event);
    case 'llm.call':
      return formatLLMCall(event);
    case 'decision':
      return formatDecision(event);
    case 'error':
      return formatError(event);
    default:
      return '';
  }
}

/**
 * Generate a human-readable text summary of a trace.
 */
export function generateTraceSummaryText(trace: TraceRun): string {
  const lines: string[] = [];

  // Header
  lines.push(`Run: ${formatAction(trace.action)} (seed=${trace.rng.seed})`);
  lines.push(`Mode: ${trace.promptMode}`);
  lines.push(`Captured: ${trace.capturedAt}`);
  lines.push('');

  // Stats
  lines.push('Stats:');
  lines.push(`  Events: ${trace.stats.eventCount}`);
  lines.push(`  LLM calls: ${trace.stats.llmCallCount}`);
  lines.push(`  Decisions: ${trace.stats.decisionCount}`);
  if (trace.stats.hadErrors) {
    lines.push('  Had errors: yes');
  }
  if (trace.stats.truncatedForCap) {
    lines.push('  Truncated for size cap: yes');
  }
  lines.push('');

  // Group events by type for summary
  const decisions = trace.events.filter((e): e is TraceDecisionEvent => e.type === 'decision');
  const llmCalls = trace.events.filter((e): e is TraceLLMCallEvent => e.type === 'llm.call');
  const errors = trace.events.filter((e): e is TraceErrorEvent => e.type === 'error');

  // Deterministic decisions summary (grouped by domain)
  if (decisions.length > 0) {
    lines.push('Deterministic Decisions:');
    const byDomain = new Map<string, TraceDecisionEvent[]>();
    for (const d of decisions) {
      const list = byDomain.get(d.domain) ?? [];
      list.push(d);
      byDomain.set(d.domain, list);
    }
    for (const [domain, domainDecisions] of byDomain) {
      const summaries = domainDecisions.map((d) => d.branchTaken).join(', ');
      lines.push(`  ${domain}: ${summaries}`);
    }
    lines.push('');
  }

  // LLM calls
  if (llmCalls.length > 0) {
    lines.push('LLM Calls:');
    for (const call of llmCalls) {
      lines.push(formatLLMCall(call));
    }
    lines.push('');
  }

  // Errors
  if (errors.length > 0) {
    lines.push('Errors:');
    for (const err of errors) {
      lines.push(`  ${formatError(err)}`);
    }
    lines.push('');
  }

  // Full timeline
  lines.push('Timeline:');
  const sortedEvents = [...trace.events].sort((a, b) => a.tMs - b.tMs);
  for (const event of sortedEvents) {
    const formatted = formatEvent(event);
    if (formatted) {
      lines.push(`[+${event.tMs}ms] ${formatted.split('\n').join('\n         ')}`);
    }
  }

  return lines.join('\n');
}
