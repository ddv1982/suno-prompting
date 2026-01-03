import { StatusIndicator } from "@/components/ui/status-indicator";

type EditorStatusFooterProps = {
  isGenerating: boolean;
  currentModel?: string;
};

export function EditorStatusFooter({ isGenerating, currentModel }: EditorStatusFooterProps) {
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
        <StatusIndicator status={isGenerating ? "working" : "ready"} showLabel={false} />
      </div>
    </div>
  );
}
