import * as React from "react"

import { useAutoDisable } from "@/hooks/use-auto-disable"
import { cn } from "@/lib/utils"

import type { ReactElement } from "react";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * When true, the textarea will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * Explicit `disabled` prop takes precedence over context.
   * @default false
   */
  autoDisable?: boolean;
}

function Textarea({ className, disabled, autoDisable = false, ...props }: TextareaProps): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);

  return (
    <textarea
      data-slot="textarea"
      disabled={isDisabled}
      className={cn(
        "border-border placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-input/30 px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-footnote)] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
