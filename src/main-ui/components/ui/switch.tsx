import { useAutoDisable } from "@/hooks/use-auto-disable";
import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * When true, the switch will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * Explicit `disabled` prop takes precedence over context.
   * @default false
   */
  autoDisable?: boolean;
  size?: "default" | "sm";
  className?: string;
}

const sizeStyles = {
  default: {
    button: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "translate-x-5"
  },
  sm: {
    button: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "translate-x-4"
  }
};

export function Switch({ id, checked, onCheckedChange, disabled, autoDisable = false, size = "default", className }: SwitchProps): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);
  
  const styles = sizeStyles[size];

  const handleClick = (): void => {
    onCheckedChange(!checked);
  };
  
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles.button,
        checked 
          ? "bg-primary border border-primary" 
          : "bg-foreground/10 border border-foreground/20",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white transition-transform duration-150",
          styles.thumb,
          checked ? `${styles.translate} shadow-sm` : "translate-x-0.5 shadow-md"
        )}
      />
    </button>
  );
}
