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

import type { ReactElement } from "react";

/** Reusable copy button with copied state feedback */
function CopyButton({ label, copiedLabel, onClick, disabled }: {
  label: string; copiedLabel: string; onClick: () => void; disabled?: boolean;
}): ReactElement {
  const [copied, setCopied] = useState(false);
  const handleClick = (): void => {
    onClick();
    setCopied(true);
    setTimeout(() => { setCopied(false); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled}
      className={cn("font-bold", copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400")}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

type QuickVibesOutputProps = {
  prompt: string; title?: string; lyrics?: string; isGenerating: boolean; hasDebugInfo: boolean;
  onRemix: () => void; onCopy: () => void; onDebugOpen: () => void; onRemixLyrics?: () => void;
};

export function QuickVibesOutput({ prompt, title, lyrics, isGenerating, hasDebugInfo, onRemix, onCopy, onDebugOpen, onRemixLyrics }: QuickVibesOutputProps): ReactElement {
  const contentOnly = stripMaxModeHeader(prompt);
  const charCount = contentOnly.length;
  const isOverLimit = charCount > APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;

  return (
    <div className="space-y-[var(--space-5)]">
      {title && <OutputSection label="Title" content={title} onCopy={() => navigator.clipboard.writeText(title)} />}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <SectionLabel>Quick Vibes Prompt</SectionLabel>
          <Badge variant={isOverLimit ? "destructive" : "secondary"} className="text-tiny font-mono tabular-nums h-5">
            {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
          </Badge>
        </div>
        <Card className="relative group border bg-surface overflow-hidden">
          <CardContent className="p-6"><PromptOutput text={prompt} /></CardContent>
          <div className="absolute top-4 right-4 flex gap-2">
            {hasDebugInfo && (
              <Button variant="outline" size="sm" onClick={onDebugOpen} className="font-bold">
                <Bug className="w-3.5 h-3.5" />DEBUG
              </Button>
            )}
            {title && <CopyButton label="COPY TITLE" copiedLabel="COPIED TITLE" onClick={() => navigator.clipboard.writeText(title)} disabled={isGenerating} />}
            <Button variant="outline" size="sm" onClick={onRemix} disabled={isGenerating} className="font-bold">
              <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
              {isGenerating ? "REMIXING" : "REMIX"}
            </Button>
            <CopyButton label="COPY PROMPT" copiedLabel="COPIED PROMPT" onClick={onCopy} />
          </div>
        </Card>
      </div>

      {lyrics && (
        <OutputSection
          label="Lyrics"
          content={lyrics}
          onCopy={() => navigator.clipboard.writeText(lyrics)}
          onRemix={onRemixLyrics}
          isGenerating={isGenerating}
          scrollable
        />
      )}
    </div>
  );
}
