import { X, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormLabel } from "@/components/ui/form-label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SUNO_V5_STYLES, SUNO_V5_STYLE_DISPLAY_NAMES } from "@shared/suno-v5-styles";

type SunoStylesMultiSelectProps = {
  selected: string[]; onChange: (styles: string[]) => void; maxSelections?: number;
  disabled?: boolean; helperText?: string; badgeText?: "optional" | "disabled";
};

type StyleOption = { value: string; label: string };

export function SunoStylesMultiSelect({
  selected, onChange, maxSelections = 4, disabled = false, helperText, badgeText = "optional",
}: SunoStylesMultiSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const allStyles = useMemo<StyleOption[]>(() => 
    SUNO_V5_STYLES.map((style) => ({ value: style, label: SUNO_V5_STYLE_DISPLAY_NAMES[style] ?? style }))
      .sort((a, b) => a.label.localeCompare(b.label)), []);
  const availableOptions = useMemo(() => allStyles.filter((s) => !selected.includes(s.value)), [allStyles, selected]);

  const handleSelect = (styleValue: string): void => {
    if (selected.includes(styleValue)) onChange(selected.filter((s) => s !== styleValue));
    else if (selected.length < maxSelections) onChange([...selected, styleValue]);
    setOpen(false);
  };
  const handleRemove = (styleValue: string): void => { onChange(selected.filter((s) => s !== styleValue)); };
  const getDisplayLabel = (value: string): string => SUNO_V5_STYLE_DISPLAY_NAMES[value] ?? value;
  const isMaxed = selected.length >= maxSelections;

  // Determine helper text to display
  const displayHelperText = helperText ?? `${selected.length}/${maxSelections} selected (optional)`;

  return (
    <div className="space-y-2">
      <FormLabel icon={<Sparkles className="w-3 h-3" />} badge={badgeText}>
        Suno V5 Styles
      </FormLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select Suno V5 styles"
            disabled={disabled || isMaxed}
            className={cn(
              "h-[var(--height-control-sm)] w-full justify-between text-[length:var(--text-footnote)] font-normal",
              "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {isMaxed ? "Maximum styles selected" : "Search Suno styles..."}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No style found.</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => { handleSelect(option.value); }}
                    className="cursor-pointer"
                  >
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected styles as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((styleValue) => (
            <Badge
              key={styleValue}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1"
            >
              {getDisplayLabel(styleValue)}
              <button
                type="button"
                onClick={() => { handleRemove(styleValue); }}
                disabled={disabled}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 disabled:opacity-50"
                aria-label={`Remove ${getDisplayLabel(styleValue)}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="ui-helper">
        {displayHelperText}
      </p>
    </div>
  );
}
