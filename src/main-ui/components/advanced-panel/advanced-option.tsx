import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

interface AdvancedOptionProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  disabledByMutualExclusion?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function AdvancedOption({
  label,
  options,
  value,
  onValueChange,
  disabled,
  disabledByMutualExclusion = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
}: AdvancedOptionProps): ReactElement {
  const isDisabledByExclusion = disabledByMutualExclusion;

  return (
    <div className={cn("space-y-[var(--space-2)]", className)}>
      <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
        {label}
        {disabledByMutualExclusion && (
          <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
        )}
      </label>
      <Combobox
        options={options}
        value={value}
        onValueChange={onValueChange}
        disabled={(disabled ?? false) || isDisabledByExclusion}
        autoDisable
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        className={cn(isDisabledByExclusion && "opacity-50")}
      />
    </div>
  );
}
