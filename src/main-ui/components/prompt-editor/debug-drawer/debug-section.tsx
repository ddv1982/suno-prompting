/**
 * Debug Section Components
 *
 * Collapsible section for displaying LLM call prompts and metadata.
 *
 * @module components/prompt-editor/debug-drawer/debug-section
 */

import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

import type { LLMCallSectionProps, DebugMetadataHeaderProps } from "./types";
import type { ReactElement } from "react";

// =============================================================================
// Constants
// =============================================================================

/** Max characters before showing "Show more" - keeps initial view scannable */
const PROMPT_PREVIEW_MAX_CHARS = 200;

/** Max lines before truncating - 3 lines gives enough context without overwhelming */
const PROMPT_PREVIEW_MAX_LINES = 3;

/** Color coding for message roles - matches request-inspector.tsx pattern */
const ROLE_COLORS: Record<string, string> = {
  system: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// =============================================================================
// Components
// =============================================================================

/**
 * Displays timestamp, provider, and model info for debug inspection.
 * Extracted to reduce complexity of parent component.
 */
export function DebugMetadataHeader({ debugInfo }: DebugMetadataHeaderProps): ReactElement {
  return (
    <div className="ui-helper flex items-center gap-3">
      <span className="font-mono text-foreground">
        {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'N/A'}
      </span>
      <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary ui-label">
        {debugInfo.provider ?? 'unknown'}
      </span>
      <span className="font-mono text-foreground/70">
        {debugInfo.model?.split('/').pop() ?? 'unknown'}
      </span>
    </div>
  );
}

/**
 * Collapsible section displaying an LLM call's system and user prompts.
 * Used to show the actual prompts sent for genre detection, title generation,
 * lyrics generation, and max mode conversion - providing transparency into
 * how the AI generates content.
 */
export function LLMCallSection({
  title,
  systemPrompt,
  userPrompt,
  extraInfo,
  // Default expanded so users immediately see the prompts they came to inspect
  defaultExpanded = false,
  onCopy,
  copiedSection,
  sectionKey,
}: LLMCallSectionProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const togglePrompt = (key: string): void => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderPromptCard = (role: string, content: string, key: string): ReactElement => {
    const lines = content.split('\n');
    const needsTruncation = lines.length > PROMPT_PREVIEW_MAX_LINES || content.length > PROMPT_PREVIEW_MAX_CHARS;
    const preview = lines.slice(0, PROMPT_PREVIEW_MAX_LINES).join('\n');
    const isPromptExpanded = expandedPrompts.has(key);
    const displayContent = isPromptExpanded || !needsTruncation ? content : preview + (preview.length < content.length ? '...' : '');

    return (
      <div className="rounded-lg border border-border/50 bg-background/30 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/30">
          <Badge variant="outline" className={cn("ui-label h-4 px-1.5", ROLE_COLORS[role] ?? "")}>{role}</Badge>
          <div className="flex items-center gap-1">
            <span className="ui-helper">{content.length} chars</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { onCopy(content, `${sectionKey}-${key}`); }}>
              {copiedSection === `${sectionKey}-${key}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            </Button>
          </div>
        </div>
        <div className="p-2">
          {isPromptExpanded ? (
            <ScrollArea className="h-48 rounded border bg-background/50 is-scrolling">
              <pre className="p-2 text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">{content}</pre>
            </ScrollArea>
          ) : (
            <pre className="text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">{displayContent}</pre>
          )}
          {needsTruncation && (
            <button onClick={() => { togglePrompt(key); }} className="mt-1 ui-helper text-primary hover:underline">
              {isPromptExpanded ? "Show less" : `Show more (${lines.length} lines)`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10">
      <button
        onClick={() => { setIsExpanded(!isExpanded); }}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <SectionLabel className="m-0">{title}</SectionLabel>
        </div>
        {extraInfo && (
          <Badge variant="outline" className="font-mono text-tiny">{extraInfo}</Badge>
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {renderPromptCard("system", systemPrompt, "system")}
          {renderPromptCard("user", userPrompt, "user")}
        </div>
      )}
    </div>
  );
}
