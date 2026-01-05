import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

type ToggleRowProps = {
  id: string;
  icon: ReactNode;
  label: string;
  helperText?: string;
  checked: boolean;
  disabled?: boolean;
  showNaBadge?: boolean;
  onChange: (checked: boolean) => void;
};

export function ToggleRow({
  id,
  icon,
  label,
  helperText,
  checked,
  disabled = false,
  showNaBadge = false,
  onChange,
}: ToggleRowProps): React.JSX.Element {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 py-2",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        size="sm"
        className="ml-auto"
      />
    </label>
  );
}
