import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Check, Copy, Send, AlertCircle, RefreshCw, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/lib/chat-utils";
import { type ValidationResult } from "@shared/validation";
import { type DebugInfo } from "@shared/types";

type PromptEditorProps = {
  currentPrompt: string;
  isGenerating: boolean;
  validation: ValidationResult;
  chatMessages: ChatMessage[];
  onGenerate: (input: string) => void;
  onCopy: () => void;
  onRemix: () => void;
  maxChars?: number;
  currentModel?: string;
  debugInfo?: DebugInfo;
};

export function PromptEditor({
  currentPrompt,
  isGenerating,
  validation,
  chatMessages,
  onGenerate,
  onCopy,
  onRemix,
  maxChars = 1000,
  currentModel = "",
  debugInfo,
}: PromptEditorProps) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { charCount, promptOverLimit, inputOverLimit } = useMemo(() => ({
    charCount: currentPrompt.length,
    promptOverLimit: currentPrompt.length > maxChars,
    inputOverLimit: input.trim().length > maxChars,
  }), [currentPrompt, input, maxChars]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    if (trimmed.length > maxChars) {
      return;
    }
    onGenerate(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = () => {
    if (promptOverLimit) {
      return;
    }
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex-1 flex flex-col bg-background">
      <div className="flex-1 flex flex-col p-6 gap-6 max-w-6xl mx-auto w-full overflow-auto">
        <div className="flex justify-between items-center">
          <SectionLabel>Generated Prompt Output</SectionLabel>
          <Badge
            variant={promptOverLimit ? "destructive" : "secondary"}
            className="text-tiny font-mono tabular-nums h-5"
          >
            {charCount} / {maxChars}
          </Badge>
        </div>

        <Card className="flex-1 relative group border shadow-sm bg-card/50 backdrop-blur overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-6">
              {currentPrompt ? (
                <PromptOutput text={currentPrompt} />
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Start by describing your creative vision below…
                </div>
              )}
            </CardContent>
          </ScrollArea>
          <div className="absolute top-4 right-4 flex gap-2">
            {currentPrompt && (
              <>
                {debugInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugOpen(true)}
                    className="h-8 px-3 text-tiny font-bold gap-2 bg-background/70 backdrop-blur-sm"
                  >
                    <Bug className="w-3.5 h-3.5" />
                    DEBUG
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemix}
                  disabled={isGenerating}
                  className="h-8 px-3 text-tiny font-bold gap-2 bg-background/70 backdrop-blur-sm"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                  {isGenerating ? "REMIXING" : "REMIX"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={promptOverLimit}
                  className={cn(
                    "h-8 px-3 text-tiny font-bold gap-2 bg-background/70 backdrop-blur-sm transition-all duration-300",
                    copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "COPIED" : "COPY"}
                </Button>
              </>
            )}
          </div>
        </Card>

        <ValidationMessages errors={validation.errors} warnings={validation.warnings} />

        {debugInfo && (
          <Sheet open={debugOpen} onOpenChange={setDebugOpen}>
            <SheetContent side="right" className="w-[min(640px,95vw)] sm:max-w-none">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Info
                </SheetTitle>
              </SheetHeader>
              <DebugDrawerBody debugInfo={debugInfo} />
            </SheetContent>
          </Sheet>
        )}

        <Separator className="opacity-50" />

        <div className="flex-1 flex flex-col min-h-36 overflow-auto">
          <SectionLabel className="mb-3">Chat History</SectionLabel>
          <ScrollArea className="flex-1 pr-4" viewportRef={scrollRef}>
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic opacity-40">
                Conversation history will appear here.
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <ChatMessageBubble key={i} role={msg.role} content={msg.content} />
              ))
            )}
            {isGenerating && (
              <div className="flex w-full mb-3 justify-start">
                <div className="bg-muted/50 rounded-2xl px-4 py-3 rounded-tl-none border shadow-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="border-t bg-muted/10 p-6 shrink-0">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-20 flex-1 resize-none shadow-sm text-sm p-4 rounded-xl bg-background/40 backdrop-blur focus-visible:ring-primary/20"
              placeholder="Describe your song, style, mood, or refine the existing prompt..."
            />
            <Button
              onClick={handleSend}
              disabled={isGenerating || !input.trim() || inputOverLimit}
              size="sm"
              className={cn(
                "h-9 px-4 rounded-lg gap-2 shadow-lg shadow-primary/10 shrink-0 interactive transition-all duration-300",
                isGenerating && "w-9 px-0"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="font-bold text-tiny tracking-tight">
                    {currentPrompt ? "REFINE" : "GENERATE"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {inputOverLimit && (
            <p className="text-caption text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
            </p>
          )}

          <div className="flex justify-between items-center px-1">
            <p className="text-tiny text-muted-foreground flex gap-4 opacity-70">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 border rounded-md bg-background text-micro">Enter</kbd> to send
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 border rounded-md bg-background text-micro">Shift + Enter</kbd> for new line
              </span>
            </p>
            <div className="flex items-center gap-4">
              {currentModel && (
                <span className="text-tiny font-bold uppercase tracking-tight text-primary/70">
                  {currentModel.split('/').pop()}
                </span>
              )}
              <StatusIndicator status={isGenerating ? "working" : "ready"} showLabel={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromptOutput({ text }: { text: string }) {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
      {lines.map((line, idx) => {
        if (line.trim().length === 0) {
          return <div key={idx} className="h-4" />;
        }

        const cleanLine = line.trim();
        const isSection = /^\[.+\]/.test(cleanLine);
        const isField = /^(Genre|Mood|Instruments|Tempo|Key):/i.test(cleanLine);
        const isHeader = /^\[Mood\],.*Key:/.test(cleanLine); // Relaxed header check

        return (
          <div
            key={idx}
            className={cn(
              isHeader && "text-muted-foreground",
              isField && "text-foreground font-medium",
              isSection && !isHeader && "text-primary font-bold tracking-wide"
            )}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

function DebugDrawerBody({ debugInfo }: { debugInfo: DebugInfo }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="text-tiny text-muted-foreground">
        <span className="font-mono text-foreground">{new Date(debugInfo.timestamp).toLocaleString()}</span>
      </div>
      <RequestInspector requestBody={debugInfo.requestBody} onCopy={copyToClipboard} copiedSection={copiedSection} />
    </div>
  );
}

function ValidationMessages({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {errors.map((error, i) => (
        <Alert key={i} variant="destructive" className="py-2 px-3 border-l-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
        </Alert>
      ))}
      {warnings.map((warning, i) => (
        <Alert
          key={i}
          className="py-2 px-3 border-l-4 border-yellow-500 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs ml-2">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

function ChatMessageBubble({ role, content }: { role: "user" | "ai"; content: string }) {
  return (
    <div className={cn("flex w-full mb-3 animate-fade-in", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-2.5 text-xs shadow-sm",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-tr-sm shadow-lg"
            : "bg-background/40 backdrop-blur text-foreground rounded-tl-sm border"
        )}
      >
        <div className="font-bold opacity-70 mb-1 text-micro uppercase tracking-wider">
          {role === "user" ? "You" : "Assistant"}
        </div>
        <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

type RequestMessage = { role: string; content: string };
type ParsedRequest = { model?: string; messages?: RequestMessage[]; [key: string]: unknown };

function RequestInspector({ 
  requestBody, 
  onCopy, 
  copiedSection 
}: { 
  requestBody: string; 
  onCopy: (text: string, section: string) => void;
  copiedSection: string | null;
}) {
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
          <SectionLabel>Groq Request Body</SectionLabel>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <ScrollArea className="h-48 rounded-lg border bg-background/50">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      </div>
    );
  }

  const modelName = typeof parsed.model === 'string' ? parsed.model.split('/').pop() : parsed.model;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>Groq Request Body</SectionLabel>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-micro text-muted-foreground hover:text-foreground transition-colors underline"
          >
            {showRawJson ? "Structured" : "Raw JSON"}
          </button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {showRawJson ? (
        <ScrollArea className="h-64 rounded-lg border bg-background/50">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      ) : (
        <div className="space-y-2">
          {parsed.model && (
            <div className="flex items-center gap-2 text-caption">
              <span className="text-muted-foreground">Model:</span>
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
              <div key={idx} className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
                  <Badge variant="outline" className={cn("text-micro font-bold uppercase h-4 px-1.5", roleColors[msg.role] || "")}>
                    {msg.role}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-micro text-muted-foreground">{msg.content.length} chars</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onCopy(msg.content, `msg-${idx}`)}>
                      {copiedSection === `msg-${idx}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <pre className="text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {displayContent}
                  </pre>
                  {needsTruncation && (
                    <button
                      onClick={() => toggleMessage(idx)}
                      className="mt-1 text-micro text-primary hover:underline"
                    >
                      {isExpanded ? "Show less" : `Show more (${lines.length} lines)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
