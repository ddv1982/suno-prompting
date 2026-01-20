import { Check, Copy } from "lucide-react";
import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

interface RequestMessage { role: string; content: string }
interface ParsedRequest { model?: string; messages?: RequestMessage[]; [key: string]: unknown }
interface RequestInspectorProps {
  requestBody: string; responseBody: string; provider: string;
  onCopy: (text: string, section: string) => void; copiedSection: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  system: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  assistant: "bg-green-500/20 text-green-400 border-green-500/30",
};

function MessageCard({ role, content, isExpanded, onToggle, onCopy, isCopied }: {
  role: string; content: string; isExpanded: boolean; onToggle: () => void;
  onCopy: () => void; isCopied: boolean;
}): React.ReactElement {
  const lines = content.split('\n');
  const needsTruncation = lines.length > 2 || content.length > 150;
  const preview = lines.slice(0, 2).join('\n');
  const displayContent = isExpanded || !needsTruncation ? content : preview + (preview.length < content.length ? '...' : '');

  return (
    <div className="rounded-lg border border-border/50 bg-background/30 overflow-hidden hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/30">
        <Badge variant="outline" className={cn("ui-label h-4 px-1.5", ROLE_COLORS[role] || "")}>{role}</Badge>
        <div className="flex items-center gap-1">
          <span className="ui-helper">{content.length} chars</span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={onCopy}>
            {isCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          </Button>
        </div>
      </div>
      <div className="p-3">
        {isExpanded ? (
          <ScrollArea className="h-64 rounded-lg border bg-background/50 is-scrolling">
            <pre className="p-3 text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">{content}</pre>
          </ScrollArea>
        ) : (
          <pre className="text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">{displayContent}</pre>
        )}
        {needsTruncation && (
          <button onClick={onToggle} className="mt-2 ui-helper text-primary hover:underline">
            {isExpanded ? "Show less" : `Show more (${lines.length} lines)`}
          </button>
        )}
      </div>
    </div>
  );
}

export function RequestInspector({ requestBody, responseBody, provider, onCopy, copiedSection }: RequestInspectorProps): React.ReactElement {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);
  const parsed: ParsedRequest | null = useMemo(() => { try { return JSON.parse(requestBody) as ParsedRequest; } catch { return null; } }, [requestBody]);
  const toggleMessage = (index: number): void => { setExpandedMessages(prev => { const next = new Set(prev); if (next.has(index)) next.delete(index); else next.add(index); return next; }); };

  if (!parsed) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <SectionLabel>{provider.toUpperCase()} Request Body</SectionLabel>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => { onCopy(requestBody, 'request'); }}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <ScrollArea className="h-48 rounded-lg border bg-background/50 is-scrolling">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      </div>
    );
  }

  const modelName = typeof parsed.model === 'string' ? parsed.model.split('/').pop() : parsed.model;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>{provider.toUpperCase()} Request Body</SectionLabel>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowRawJson(!showRawJson); }}
            className="ui-helper hover:text-foreground transition-colors underline"
          >
            {showRawJson ? "Structured" : "Raw JSON"}
          </button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => { onCopy(requestBody, 'request'); }}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {showRawJson ? (
        <ScrollArea className="h-64 rounded-lg border bg-background/50 is-scrolling">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      ) : (
        <div className="space-y-2">
          {parsed.model && (
            <div className="flex items-center gap-2 ui-helper">
              <span>Model:</span>
              <Badge variant="outline" className="font-mono text-tiny h-5">{modelName}</Badge>
            </div>
          )}

          {parsed.messages?.map((msg, idx) => (
            <MessageCard key={idx} role={msg.role} content={msg.content} isExpanded={expandedMessages.has(idx)}
              onToggle={() => { toggleMessage(idx); }} onCopy={() => { onCopy(msg.content, `msg-${idx}`); }} isCopied={copiedSection === `msg-${idx}`} />
          ))}

          <div className="pt-2"><SectionLabel>Response Body</SectionLabel></div>
          <MessageCard role="assistant" content={responseBody} isExpanded={true} onToggle={(): void => { /* no-op for always-expanded response */ }} 
            onCopy={() => { onCopy(responseBody, 'response'); }} isCopied={copiedSection === 'response'} />
        </div>
      )}
    </div>
  );
}
