/**
 * LLM Call Card - Renders a single LLM call event with Default/Advanced views.
 *
 * @module components/prompt-editor/debug-drawer/llm-call-card
 */

import { Bot, ChevronDown, ChevronRight, Clock, Copy, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import type { TraceLLMCallEvent } from '@shared/types';
import type { ReactElement } from 'react';

/** Duration in ms to show "Copied!" feedback before reverting */
const COPY_FEEDBACK_DURATION_MS = 1500;

interface LLMCallCardProps { event: TraceLLMCallEvent }

function formatLatency(ms: number | undefined): string {
  if (ms === undefined) return '-';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function CopyRawButton({ label, data }: { label: string; data: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, COPY_FEEDBACK_DURATION_MS);
  }, [data]);
  return (
    <Button variant="ghost" size="xs" onClick={handleCopy} className="gap-1">
      <Copy className="size-3" />{copied ? 'Copied!' : label}
    </Button>
  );
}

function RequestParams({ request }: { request: TraceLLMCallEvent['request'] }): ReactElement | null {
  const items = [
    request.temperature !== undefined && <span key="t"><span className="text-muted-foreground">temp:</span> {request.temperature}</span>,
    request.maxTokens !== undefined && <span key="m"><span className="text-muted-foreground">maxTokens:</span> {request.maxTokens}</span>,
    request.maxRetries !== undefined && <span key="r"><span className="text-muted-foreground">maxRetries:</span> {request.maxRetries}</span>,
  ].filter(Boolean);
  return items.length > 0 ? <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">{items}</div> : null;
}

function TelemetrySection({ telemetry }: { telemetry: TraceLLMCallEvent['telemetry'] }): ReactElement | null {
  if (!telemetry) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs border-t pt-2">
      {telemetry.latencyMs !== undefined && (
        <span className="flex items-center gap-1">
          <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
          {formatLatency(telemetry.latencyMs)}
        </span>
      )}
      {telemetry.tokensIn !== undefined && <span><span className="text-muted-foreground">in:</span> {telemetry.tokensIn}</span>}
      {telemetry.tokensOut !== undefined && <span><span className="text-muted-foreground">out:</span> {telemetry.tokensOut}</span>}
      {telemetry.finishReason && <span><span className="text-muted-foreground">reason:</span> {telemetry.finishReason}</span>}
    </div>
  );
}

function AttemptsSection({ attempts }: { attempts: TraceLLMCallEvent['attempts'] }): ReactElement | null {
  if (!attempts || attempts.length === 0) return null;
  return (
    <div className="text-xs border-t pt-2 space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Zap className="size-3" aria-hidden="true" />
        <span>{attempts.length} attempt{attempts.length > 1 ? 's' : ''}</span>
      </div>
      {attempts.map((attempt, idx) => (
        <div key={idx} className={cn('pl-4 py-1 border-l-2', attempt.error ? 'border-destructive/50 bg-destructive/5' : 'border-border')}>
          <div className="flex gap-2"><span>#{attempt.attempt}</span><span className="text-muted-foreground">{formatLatency(attempt.latencyMs)}</span></div>
          {attempt.error && <div className="text-destructive mt-1">[{attempt.error.type}] {attempt.error.message}{attempt.error.status && ` (${attempt.error.status})`}</div>}
        </div>
      ))}
    </div>
  );
}

function AdvancedSection({ request, response }: { request: TraceLLMCallEvent['request']; response: TraceLLMCallEvent['response'] }): ReactElement | null {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvanced = Boolean(request.messages ?? response.rawText);
  if (!hasAdvanced) return null;
  return (
    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="xs" className="w-full justify-start gap-1 text-muted-foreground">
          {advancedOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}Advanced
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {request.messages && request.messages.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Raw messages ({request.messages.length})</span>
              <CopyRawButton label="Copy raw" data={JSON.stringify(request.messages, null, 2)} />
            </div>
            <div className="text-xs bg-muted/50 rounded p-2 font-mono max-h-40 overflow-y-auto space-y-2">
              {request.messages.map((msg, idx) => (
                <div key={idx} className="border-l-2 border-border pl-2">
                  <div className="font-semibold text-muted-foreground">[{msg.role}]</div>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {response.rawText && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Raw response</span>
              <CopyRawButton label="Copy raw" data={response.rawText} />
            </div>
            <div className="text-xs bg-muted/50 rounded p-2 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{response.rawText}</div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function LLMCallCard({ event }: LLMCallCardProps): ReactElement {
  const { provider, request, response, telemetry, attempts } = event;
  return (
    <div className="rounded-lg border bg-card/50 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-sm truncate">{event.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={provider.locality === 'local' ? 'secondary' : 'outline'} size="sm">{provider.locality}</Badge>
          <Badge variant="outline" size="sm">{provider.id}</Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Model: <span className="text-foreground">{provider.model}</span></div>
      <RequestParams request={request} />
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground flex gap-2">
          <span>Input: {request.inputSummary.messageCount} messages</span><span>•</span><span>{request.inputSummary.totalChars.toLocaleString()} chars</span>
        </div>
        <div className="text-xs bg-muted/50 rounded p-2 font-mono whitespace-pre-wrap break-words max-h-20 overflow-hidden">{request.inputSummary.preview}</div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Output preview:</div>
        <div className="text-xs bg-muted/50 rounded p-2 font-mono whitespace-pre-wrap break-words max-h-20 overflow-hidden">
          {response.previewText || <span className="text-muted-foreground italic">No response</span>}
        </div>
      </div>
      <TelemetrySection telemetry={telemetry} />
      <AttemptsSection attempts={attempts} />
      <AdvancedSection request={request} response={response} />
    </div>
  );
}
