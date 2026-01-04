import { RefreshCw, Copy, Check, Bug } from "lucide-react";
import { useState } from "react";

import { OutputSection } from "@/components/prompt-editor/output-section";
import { PromptOutput } from "@/components/prompt-output";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@shared/constants";
import { stripMaxModeHeader } from "@shared/prompt-utils";

type QuickVibesOutputProps = {
  prompt: string;
  title?: string;
  isGenerating: boolean;
  hasDebugInfo: boolean;
  onRemix: () => void;
  onCopy: () => void;
  onDebugOpen: () => void;
};

export function QuickVibesOutput({
  prompt,
  title,
  isGenerating,
  hasDebugInfo,
  onRemix,
  onCopy,
  onDebugOpen,
}: QuickVibesOutputProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const contentOnly = stripMaxModeHeader(prompt);
  const charCount = contentOnly.length;
  const isOverLimit = charCount > APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;

  const handleCopyPrompt = () => {
    onCopy();
    setCopiedPrompt(true);
    setTimeout(() => { setCopiedPrompt(false); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };

  const handleCopyTitle = () => {
    if (!title) return;
    navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => { setCopiedTitle(false); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="space-y-[var(--space-5)]">
      {title && (
        <OutputSection
          label="Title"
          content={title}
          onCopy={() => navigator.clipboard.writeText(title)}
        />
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <SectionLabel>Quick Vibes Prompt</SectionLabel>
          <Badge
            variant={isOverLimit ? "destructive" : "secondary"}
            className="text-tiny font-mono tabular-nums h-5"
          >
            {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
          </Badge>
        </div>
        <Card className="relative group border bg-surface overflow-hidden">
          <CardContent className="p-6">
            <PromptOutput text={prompt} />
          </CardContent>
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {hasDebugInfo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDebugOpen}
              className="font-bold"
            >
              <Bug className="w-3.5 h-3.5" />
              DEBUG
            </Button>
          )}
          {title && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTitle}
              disabled={isGenerating}
              className={cn(
                "font-bold",
                copiedTitle && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
              )}
            >
              {copiedTitle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTitle ? "COPIED TITLE" : "COPY TITLE"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRemix}
            disabled={isGenerating}
            className="font-bold"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
            {isGenerating ? "REMIXING" : "REMIX"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className={cn(
              "font-bold",
              copiedPrompt && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
            )}
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPrompt ? "COPIED PROMPT" : "COPY PROMPT"}
          </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
