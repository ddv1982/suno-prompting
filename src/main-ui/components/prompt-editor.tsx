import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, Copy, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "../lib/chat-utils";
import { type ValidationResult } from "../../shared/validation";
import DOMPurify from "dompurify";

type PromptEditorProps = {
  currentPrompt: string;
  isGenerating: boolean;
  isCondensing?: boolean;
  validation: ValidationResult;
  chatMessages: ChatMessage[];
  onGenerate: (input: string) => void;
  onCopy: () => void;
  maxChars?: number;
  currentModel?: string;
};

export function PromptEditor({
  currentPrompt,
  isGenerating,
  isCondensing = false,
  validation,
  chatMessages,
  onGenerate,
  onCopy,
  maxChars = 1000,
  currentModel = "",
}: PromptEditorProps) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { charCount, promptOverLimit, inputOverLimit } = useMemo(() => ({
    charCount: currentPrompt.length,
    promptOverLimit: currentPrompt.length > maxChars,
    inputOverLimit: input.trim().length > maxChars,
  }), [currentPrompt, input, maxChars]);

  // Sanitize the prompt for display
  const sanitizedPrompt = useMemo(() => 
    currentPrompt ? DOMPurify.sanitize(currentPrompt) : "", 
  [currentPrompt]);

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
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Generated Prompt Output
          </h2>
          <Badge
            variant={promptOverLimit ? "destructive" : "secondary"}
            className="text-[10px] font-mono tabular-nums h-5"
          >
            {charCount} / {maxChars}
          </Badge>
        </div>

        <Card className="flex-1 relative group border shadow-sm bg-muted/5 overflow-hidden">
          <ScrollArea className="h-full">
            <CardContent className="p-6">
              {isCondensing ? (
                <div className="flex items-center gap-3 text-muted-foreground italic">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Optimizing prompt length...</span>
                </div>
              ) : (
                <div
                  className={cn(
                    "font-mono text-sm leading-relaxed",
                    !sanitizedPrompt && "text-muted-foreground italic"
                  )}
                  dangerouslySetInnerHTML={{ __html: sanitizedPrompt || "Start by describing your creative vision below..." }}
                />
              )}
            </CardContent>
          </ScrollArea>
          <div className="absolute top-4 right-4 flex gap-2">
            {currentPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={promptOverLimit}
                className={cn(
                  "h-8 px-3 text-[10px] font-bold gap-2 bg-background/80 backdrop-blur-sm transition-all",
                  copied && "bg-primary text-primary-foreground border-primary"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "COPIED" : "COPY"}
              </Button>
            )}
          </div>
        </Card>

        <ValidationMessages errors={validation.errors} warnings={validation.warnings} />

        <Separator className="opacity-50" />

        <div className="flex-1 flex flex-col min-h-37.5 overflow-auto">
          <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Chat History
          </h3>
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
              className="min-h-20 flex-1 resize-none shadow-sm text-sm p-4 rounded-xl focus-visible:ring-primary/20"
              placeholder="Describe your song, style, mood, or refine the existing prompt..."
            />
            <Button
              onClick={handleSend}
              disabled={isGenerating || !input.trim() || inputOverLimit}
              size="sm"
              className="h-9 px-4 rounded-lg gap-2 shadow-lg shadow-primary/10 shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="font-bold text-[10px] tracking-tight">
                {isGenerating ? "WORKING" : currentPrompt ? "REFINE" : "GENERATE"}
              </span>
            </Button>
          </div>

          {inputOverLimit && (
            <p className="text-[11px] text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
            </p>
          )}

          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] text-muted-foreground flex gap-4 opacity-70">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 border rounded bg-background text-[9px]">Enter</kbd> to send
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 border rounded bg-background text-[9px]">Shift + Enter</kbd> for new line
              </span>
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground opacity-80">
              {currentModel && (
                <span className="text-primary/70">{currentModel.split('/').pop()}</span>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isGenerating ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-green-500/50"
                  )}
                ></span>
                {isGenerating ? "Generating" : "Ready"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
    <div className={cn("flex w-full mb-3", role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-xs shadow-sm",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted text-foreground rounded-tl-none border"
        )}
      >
        <div className="font-bold opacity-70 mb-0.5 text-[9px] uppercase tracking-tighter">
          {role === "user" ? "Refinement" : "Assistant"}
        </div>
        <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
