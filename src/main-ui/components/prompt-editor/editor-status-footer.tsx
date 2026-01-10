import { useMemo } from "react";

import { StatusIndicator } from "@/components/ui/status-indicator";

type StatusType = "working" | "ready" | "local";

type EditorStatusFooterProps = {
  isGenerating: boolean;
  currentModel?: string;
  useLocalLLM?: boolean;
};

export function EditorStatusFooter({ 
  isGenerating, 
  currentModel, 
  useLocalLLM = false 
}: EditorStatusFooterProps): React.JSX.Element {
  // Determine status: working takes precedence, then local/ready
  const status: StatusType = useMemo(() => {
    if (isGenerating) return "working";
    return useLocalLLM ? "local" : "ready";
  }, [isGenerating, useLocalLLM]);

  return (
    <div className="flex justify-between items-center px-1 pb-[var(--space-2)]">
      <span className="text-[length:var(--text-caption)] text-muted-foreground flex items-center gap-4 font-mono">
        <span>⏎ send</span>
        <span>⇧⏎ new line</span>
      </span>
      <div className="flex items-center gap-4">
        {currentModel && (
          <span className="ui-label text-primary/70">
            {currentModel.split('/').pop()}
          </span>
        )}
        <StatusIndicator status={status} showLabel={false} />
      </div>
    </div>
  );
}
