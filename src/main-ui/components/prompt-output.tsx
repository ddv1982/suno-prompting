import { useMemo } from "react";

import { cn } from "@/lib/utils";

type PromptOutputProps = {
  text: string;
};

export function PromptOutput({ text }: PromptOutputProps): React.JSX.Element {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <div className="font-mono text-[length:var(--text-body)] leading-[1.7] whitespace-pre-wrap break-words">
      {lines.map((line, idx) => {
        if (line.trim().length === 0) {
          return <div key={idx} className="h-4" />;
        }

        const cleanLine = line.trim();
        const isSection = /^\[.+\]/.test(cleanLine);
        const isField = /^(Genre|Mood|Instruments|Tempo|Key):/i.test(cleanLine);
        const isHeader = /^\[Mood\],.*Key:/.test(cleanLine);
        // Recognize both MAX mode header formats:
        // - Standard: [Is_MAX_MODE: MAX](MAX), [QUALITY: MAX](MAX), etc.
        // - Suno V5 tags: ::tags..., ::quality..., ::style...
        const isMaxModeHeader = /^\[.+: MAX\]/.test(cleanLine) || /^::.+::$/.test(cleanLine);

        return (
          <div
            key={idx}
            className={cn(
              (isHeader || isMaxModeHeader) && "text-muted-foreground",
              isField && "text-foreground font-medium",
              isSection && !isHeader && !isMaxModeHeader && "text-primary font-bold tracking-wide"
            )}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}
