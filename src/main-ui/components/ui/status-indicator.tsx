import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

/**
 * CVA variants for status indicator dot.
 * Uses class-variance-authority for type-safe variant styling.
 */
const statusIndicatorVariants = cva(
  // Base styles
  "rounded-full shadow-[0_0_8px]",
  {
    variants: {
      status: {
        ready: "bg-emerald-500/60 shadow-emerald-500/30",
        working: "bg-primary animate-pulse shadow-primary/40",
        error: "bg-destructive shadow-destructive/30",
        local: "bg-blue-500/60 shadow-blue-500/30",
      },
      size: {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-2.5 h-2.5",
      },
    },
    defaultVariants: {
      status: "ready",
      size: "md",
    },
  }
);

/**
 * Status labels for each status type.
 */
const statusLabels: Record<NonNullable<VariantProps<typeof statusIndicatorVariants>["status"]>, string> = {
  ready: "Ready",
  working: "Generating",
  error: "Error",
  local: "Local",
};

interface StatusIndicatorProps extends VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Status indicator component with CVA variants for status and size.
 * Displays a colored dot with optional label.
 */
export function StatusIndicator({ 
  status, 
  size, 
  label, 
  showLabel = true, 
  className 
}: StatusIndicatorProps): ReactElement {
  const effectiveStatus = status ?? "ready";
  const displayLabel = label ?? statusLabels[effectiveStatus];
  
  return (
    <div className={cn("flex items-center gap-[var(--space-2)] ui-label", className)}>
      <span className={cn(statusIndicatorVariants({ status, size }))} />
      {showLabel && displayLabel && <span>{displayLabel}</span>}
    </div>
  );
}
