import { Sparkles } from "lucide-react";
import { useMemo } from "react";

import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { SUNO_V5_STYLES, SUNO_V5_STYLE_DISPLAY_NAMES } from "@shared/suno-v5-styles";

import type { ReactElement } from "react";

type SunoStylesMultiSelectProps = {
  selected: string[];
  onChange: (styles: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  autoDisable?: boolean;
  helperText?: string;
  badgeText?: "optional" | "disabled";
};

type StyleOption = { value: string; label: string };

export function SunoStylesMultiSelect({
  selected,
  onChange,
  maxSelections = 4,
  disabled,
  autoDisable = true,
  helperText,
  badgeText = "optional",
}: SunoStylesMultiSelectProps): ReactElement {
  const allStyles = useMemo<StyleOption[]>(
    () =>
      SUNO_V5_STYLES.map((style) => ({
        value: style,
        label: SUNO_V5_STYLE_DISPLAY_NAMES[style] ?? style,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  return (
    <MultiSelectCombobox
      selected={selected}
      onChange={onChange}
      options={allStyles}
      getOptionValue={(opt) => opt.value}
      getOptionLabel={(opt) => opt.label}
      maxSelections={maxSelections}
      disabled={disabled}
      autoDisable={autoDisable}
      label="Suno V5 Styles"
      icon={<Sparkles className="w-3 h-3" />}
      searchPlaceholder="Search Suno styles..."
      emptyText="No style found."
      helperText={helperText}
      badgeText={badgeText}
    />
  );
}
