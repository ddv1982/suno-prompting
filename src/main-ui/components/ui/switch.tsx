import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
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

export function Switch({ checked, onCheckedChange, disabled = false, size = "default", className }: SwitchProps) {
  const styles = sizeStyles[size];
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles.button,
        checked ? "bg-primary" : "bg-input",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
          styles.thumb,
          checked ? styles.translate : "translate-x-0"
        )}
      />
    </button>
  );
}
