import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { useAutoDisable } from "@/hooks/use-auto-disable"
import { cn } from "@/lib/utils"

import type { ReactElement } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-md text-[length:var(--text-footnote)] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-surface hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-[var(--height-control-xs)] px-[var(--space-2)] text-[length:var(--text-caption)] gap-[var(--space-1)] rounded-md",
        sm: "h-[var(--height-control-sm)] px-[var(--space-3)] text-[length:var(--text-caption)] gap-[var(--space-1)] rounded-md",
        default: "h-[var(--height-control-md)] px-[var(--space-4)] py-[var(--space-2)] gap-[var(--space-2)] has-[>svg]:px-[var(--space-3)]",
        lg: "h-[var(--height-control-lg)] px-[var(--space-5)] gap-[var(--space-2)] rounded-md has-[>svg]:px-[var(--space-4)]",
        icon: "size-9",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * When true, the button will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * Explicit `disabled` prop takes precedence over context.
   * @default false
   */
  autoDisable?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  autoDisable = false,
  ...props
}: ButtonProps): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
