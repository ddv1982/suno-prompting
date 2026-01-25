import { Check, Copy, Shuffle } from "lucide-react";

import { PromptOutput } from "@/components/prompt-output";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

interface OutputSectionProps {
  label: string;
  content: string;
  onRemix?: () => void;
  isRemixing?: boolean;
  scrollable?: boolean;
}

export function OutputSection({
  label,
  content,
  onRemix,
  isRemixing = false,
  scrollable = false,
}: OutputSectionProps): ReactElement {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = (): void => {
    void copy(content);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <SectionLabel>{label}</SectionLabel>
      </div>
      <Card className="relative border bg-surface overflow-hidden">
        <CardContent className="p-4 sm:pr-36">
          {scrollable ? (
            <PromptOutput text={content} />
          ) : (
            <div className="font-mono text-[length:var(--text-body)] leading-[1.6]">{content}</div>
          )}
        </CardContent>
        <div className="absolute top-4 right-4 flex gap-2">
          {onRemix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemix}
              autoDisable
              className="font-bold"
            >
              <Shuffle className={cn("w-3.5 h-3.5", isRemixing && "animate-spin")} />
              REMIX
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "font-bold",
              copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "COPIED" : "COPY"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
