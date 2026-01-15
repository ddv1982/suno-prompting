import * as React from "react"

import { useAutoDisable } from "@/hooks/use-auto-disable"
import { cn } from "@/lib/utils"

import type { ReactElement } from "react";

interface InputProps extends React.ComponentProps<"input"> {
  /**
   * When true, the input will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * Explicit `disabled` prop takes precedence over context.
   * @default false
   */
  autoDisable?: boolean;
}

function Input({ className, type, disabled, autoDisable = false, ...props }: InputProps): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);

  return (
    <input
      type={type}
      data-slot="input"
      disabled={isDisabled}
      className={cn(
        "border-border file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-[var(--height-control-md)] w-full min-w-0 rounded-md border bg-input/30 px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-body)] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[length:var(--text-footnote)] file:font-medium focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
