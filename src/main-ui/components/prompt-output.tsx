import { useMemo } from "react";
import { cn } from "@/lib/utils";

type PromptOutputProps = {
  text: string;
};

export function PromptOutput({ text }: PromptOutputProps) {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <div className="font-mono text-[length:var(--text-footnote)] leading-relaxed whitespace-pre-wrap break-words">
      {lines.map((line, idx) => {
        if (line.trim().length === 0) {
          return <div key={idx} className="h-4" />;
        }

        const cleanLine = line.trim();
        const isSection = /^\[.+\]/.test(cleanLine);
        const isField = /^(Genre|Mood|Instruments|Tempo|Key):/i.test(cleanLine);
        const isHeader = /^\[Mood\],.*Key:/.test(cleanLine);

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
