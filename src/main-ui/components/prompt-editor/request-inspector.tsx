import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionLabel } from "@/components/ui/section-label";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type RequestMessage = { role: string; content: string };
type ParsedRequest = { model?: string; messages?: RequestMessage[]; [key: string]: unknown };

type RequestInspectorProps = {
  requestBody: string;
  responseBody: string;
  provider: string;
  onCopy: (text: string, section: string) => void;
  copiedSection: string | null;
};

export function RequestInspector({
  requestBody,
  responseBody,
  provider,
  onCopy,
  copiedSection,
}: RequestInspectorProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);

  const parsed: ParsedRequest | null = useMemo(() => {
    try {
      return JSON.parse(requestBody);
    } catch {
      return null;
    }
  }, [requestBody]);

  const toggleMessage = (index: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const roleColors: Record<string, string> = {
    system: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    assistant: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  if (!parsed) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <SectionLabel>{provider.toUpperCase()} Request Body</SectionLabel>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
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
            onClick={() => setShowRawJson(!showRawJson)}
            className="ui-helper hover:text-foreground transition-colors underline"
          >
            {showRawJson ? "Structured" : "Raw JSON"}
          </button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
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

          {parsed.messages?.map((msg, idx) => {
            const isExpanded = expandedMessages.has(idx);
            const lines = msg.content.split('\n');
            const preview = lines.slice(0, 2).join('\n');
            const needsTruncation = lines.length > 2 || msg.content.length > 150;
            const displayContent = isExpanded || !needsTruncation ? msg.content : preview + (preview.length < msg.content.length ? '...' : '');

            return (
              <div key={idx} className="rounded-lg border border-border/50 bg-background/30 overflow-hidden hover:border-border/80 transition-colors">
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border/30">
                  <Badge variant="outline" className={cn("ui-label h-4 px-1.5", roleColors[msg.role] || "")}>
                    {msg.role}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="ui-helper">{msg.content.length} chars</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onCopy(msg.content, `msg-${idx}`)}>
                      {copiedSection === `msg-${idx}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  {isExpanded ? (
                    <ScrollArea className="h-64 rounded-lg border bg-background/50 is-scrolling">
                      <pre className="p-3 text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {msg.content}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <pre className="text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {displayContent}
                    </pre>
                  )}
                  {needsTruncation && (
                    <button
                      onClick={() => toggleMessage(idx)}
                      className="mt-2 ui-helper text-primary hover:underline"
                    >
                      {isExpanded ? "Show less" : `Show more (${lines.length} lines)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Response Body */}
          <div className="pt-2">
            <SectionLabel>Response Body</SectionLabel>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/30 overflow-hidden hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border/30">
              <Badge variant="outline" className="ui-label h-4 px-1.5 bg-green-500/20 text-green-400 border-green-500/30">
                assistant
              </Badge>
              <div className="flex items-center gap-1">
                <span className="ui-helper">{responseBody.length} chars</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onCopy(responseBody, 'response')}>
                  {copiedSection === 'response' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                </Button>
              </div>
            </div>
            <div className="p-3">
              <ScrollArea className="h-64 rounded-lg border bg-background/50 is-scrolling">
                <pre className="p-3 text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {responseBody}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
