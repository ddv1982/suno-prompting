import { X, Music } from "lucide-react";
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
import { GENRE_DISPLAY_NAMES, GENRE_COMBINATION_DISPLAY_NAMES } from "@shared/labels";

type GenreMultiSelectProps = {
  selected: string[]; onChange: (genres: string[]) => void; maxSelections?: number;
  disabled?: boolean; helperText?: string; badgeText?: "optional" | "disabled";
};

type GenreOption = { value: string; label: string; type: "single" | "multi" };

export function GenreMultiSelect({
  selected, onChange, maxSelections = 2, disabled = false, helperText, badgeText = "optional",
}: GenreMultiSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const allGenres = useMemo<GenreOption[]>(() => {
    const single = Object.entries(GENRE_DISPLAY_NAMES).map(([key, label]) => ({ value: key, label, type: "single" as const }));
    const multi = Object.entries(GENRE_COMBINATION_DISPLAY_NAMES).map(([key, label]) => ({ value: key, label, type: "multi" as const }));
    return [...single, ...multi].sort((a, b) => a.label.localeCompare(b.label));
  }, []);
  const availableOptions = useMemo(() => allGenres.filter((g) => !selected.includes(g.value)), [allGenres, selected]);

  const handleSelect = (genreValue: string): void => {
    if (selected.includes(genreValue)) onChange(selected.filter((g) => g !== genreValue));
    else if (selected.length < maxSelections) onChange([...selected, genreValue]);
    setOpen(false);
  };
  const handleRemove = (genreValue: string): void => { onChange(selected.filter((g) => g !== genreValue)); };
  const getDisplayLabel = (value: string): string => GENRE_DISPLAY_NAMES[value] ?? GENRE_COMBINATION_DISPLAY_NAMES[value] ?? value;
  const isMaxed = selected.length >= maxSelections;

  return (
    <div className="space-y-2">
      <FormLabel icon={<Music className="w-3 h-3" />} badge={badgeText}>
        Seed Genres
      </FormLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select seed genres"
            disabled={disabled || isMaxed}
            className={cn(
              "h-[var(--height-control-sm)] w-full justify-between text-[length:var(--text-footnote)] font-normal",
              "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {isMaxed ? "Maximum genres selected" : "Search genres..."}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No genre found.</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => { handleSelect(option.value); }}
                    className="cursor-pointer"
                  >
                    <span>{option.label}</span>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="ml-auto opacity-60"
                    >
                      {option.type === "single" ? "genre" : "combo"}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected genres as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((genreValue) => (
            <Badge
              key={genreValue}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1"
            >
              {getDisplayLabel(genreValue)}
              <button
                type="button"
                onClick={() => { handleRemove(genreValue); }}
                disabled={disabled}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 disabled:opacity-50"
                aria-label={`Remove ${getDisplayLabel(genreValue)}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="ui-helper">
        {helperText ?? `${selected.length}/${maxSelections} selected (optional)`}
      </p>
    </div>
  );
}
