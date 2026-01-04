import { Loader2, ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionLabel } from "@/components/ui/section-label";
import { type ChatMessage } from "@/lib/chat-utils";
import { cn } from "@/lib/utils";

type ChatHistorySectionProps = {
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export function ChatHistorySection({
  chatMessages,
  isGenerating,
  expanded,
  onExpandedChange,
}: ChatHistorySectionProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full text-left mb-3 group">
          <SectionLabel>Chat History</SectionLabel>
          {chatMessages.length > 0 && (
            <span className="text-micro text-muted-foreground">
              ({chatMessages.length})
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform ml-auto",
            expanded && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4" viewportRef={scrollRef}>
          {chatMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center ui-helper italic opacity-60">
              Conversation history will appear here.
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <ChatMessageBubble key={i} role={msg.role} content={msg.content} />
            ))
          )}
          {isGenerating && (
            <div className="flex w-full mb-3 justify-start">
              <div className="bg-muted/50 rounded-2xl px-4 py-3 rounded-tl-none border shadow-soft animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChatMessageBubble({ role, content }: { role: "user" | "ai"; content: string }): React.JSX.Element {
  return (
    <div className={cn("flex w-full mb-3 animate-fade-in", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-2.5 text-body shadow-soft",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-tr-sm shadow-panel"
            : "bg-surface text-foreground rounded-tl-sm border"
        )}
      >
        <div className="ui-label mb-1">
          {role === "user" ? "You" : "Assistant"}
        </div>
        <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
