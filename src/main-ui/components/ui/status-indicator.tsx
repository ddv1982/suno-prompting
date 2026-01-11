import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

type StatusType = "ready" | "working" | "error" | "local";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  ready: "bg-emerald-500/60 shadow-emerald-500/30",
  working: "bg-primary animate-pulse shadow-primary/40",
  error: "bg-destructive shadow-destructive/30",
  local: "bg-blue-500/60 shadow-blue-500/30",
};

const statusLabels: Record<StatusType, string> = {
  ready: "Ready",
  working: "Generating",
  error: "Error",
  local: "Local",
};

export function StatusIndicator({ status, label, showLabel = true, className }: StatusIndicatorProps): ReactElement {
  const displayLabel = label ?? statusLabels[status];
  
  return (
    <div className={cn("flex items-center gap-[var(--space-2)] ui-label", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full shadow-[0_0_8px]",
          statusStyles[status]
        )}
      />
      {showLabel && displayLabel && <span>{displayLabel}</span>}
    </div>
  );
}
