import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAutoDisable } from "@/hooks/use-auto-disable";
import { cn } from "@/lib/utils";

import type { ReactNode, ReactElement } from "react";

interface ToggleRowProps {
  id: string;
  icon: ReactNode;
  label: string;
  helperText?: string;
  checked: boolean;
  disabled?: boolean;
  /**
   * When true, the toggle will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * Explicit `disabled` prop takes precedence over context.
   * @default false
   */
  autoDisable?: boolean;
  showNaBadge?: boolean;
  /** Optional element to render before the switch (e.g., LLMUnavailableNotice) */
  rightElement?: ReactNode;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  id,
  icon,
  label,
  helperText,
  checked,
  disabled,
  autoDisable = false,
  showNaBadge = false,
  rightElement,
  onChange,
}: ToggleRowProps): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 py-2",
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span className="w-3.5 h-3.5 text-muted-foreground flex items-center justify-center">
        {icon}
      </span>
      <span className="text-[length:var(--text-footnote)]">{label}</span>
      {helperText && <span className="ui-helper">{helperText}</span>}
      {showNaBadge && (
        <Badge variant="secondary" className="ui-badge h-4 text-[10px]">
          N/A
        </Badge>
      )}
      {rightElement}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={isDisabled}
        size="sm"
        className="ml-auto"
      />
    </label>
  );
}
