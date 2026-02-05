import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormLabel } from '@/components/ui/form-label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAutoDisable } from '@/hooks/use-auto-disable';
import { cn } from '@/lib/utils';

import type { ReactElement, ReactNode } from 'react';

interface MultiSelectComboboxProps<T> {
  selected: string[];
  onChange: (values: string[]) => void;
  options: T[];
  getOptionValue: (opt: T) => string;
  getOptionLabel: (opt: T) => string;
  renderOptionExtra?: (opt: T) => ReactNode;
  maxSelections?: number;
  disabled?: boolean;
  /** @default true (domain component) */
  autoDisable?: boolean;
  label: string;
  icon: ReactNode;
  searchPlaceholder?: string;
  emptyText?: string;
  helperText?: string;
  badgeText?: 'optional' | 'disabled';
}

interface SelectedBadgesProps {
  selected: string[];
  getDisplayLabel: (value: string) => string;
  onRemove: (value: string) => void;
  isDisabled: boolean;
}

function SelectedBadges({
  selected,
  getDisplayLabel,
  onRemove,
  isDisabled,
}: SelectedBadgesProps): ReactElement | null {
  if (selected.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((value) => (
        <Badge key={value} variant="secondary" className="gap-1 pl-2.5 pr-1">
          {getDisplayLabel(value)}
          <button
            type="button"
            onClick={() => {
              onRemove(value);
            }}
            disabled={isDisabled}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 disabled:opacity-50"
            aria-label={`Remove ${getDisplayLabel(value)}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export function MultiSelectCombobox<T>({
  selected,
  onChange,
  options,
  getOptionValue,
  getOptionLabel,
  renderOptionExtra,
  maxSelections = 4,
  disabled,
  autoDisable = true,
  label,
  icon,
  searchPlaceholder = 'Type to search...',
  emptyText = 'No results found.',
  helperText,
  badgeText = 'optional',
}: MultiSelectComboboxProps<T>): ReactElement {
  const isDisabled = useAutoDisable(disabled, autoDisable);
  const [open, setOpen] = useState(false);
  const availableOptions = useMemo(
    () => options.filter((opt) => !selected.includes(getOptionValue(opt))),
    [options, selected, getOptionValue]
  );

  const handleSelect = (value: string): void => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else if (selected.length < maxSelections) onChange([...selected, value]);
    setOpen(false);
  };

  const getDisplayLabel = (value: string): string => {
    const opt = options.find((o) => getOptionValue(o) === value);
    return opt ? getOptionLabel(opt) : value;
  };

  const isMaxed = selected.length >= maxSelections;
  const displayHelperText = helperText ?? `${selected.length}/${maxSelections} selected`;

  return (
    <div className="space-y-2">
      <FormLabel icon={icon} badge={badgeText}>
        {label}
      </FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={`Select ${label.toLowerCase()}`}
            disabled={isDisabled || isMaxed}
            className={cn(
              'h-[var(--height-control-sm)] w-full justify-between text-[length:var(--text-footnote)] font-normal',
              'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {isMaxed ? `Maximum ${label.toLowerCase()} selected` : searchPlaceholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => {
                  const value = getOptionValue(option);
                  return (
                    <CommandItem
                      key={value}
                      value={getOptionLabel(option)}
                      onSelect={() => {
                        handleSelect(value);
                      }}
                      className="cursor-pointer"
                    >
                      <span>{getOptionLabel(option)}</span>
                      {renderOptionExtra?.(option)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <SelectedBadges
        selected={selected}
        getDisplayLabel={getDisplayLabel}
        onRemove={(v) => {
          onChange(selected.filter((s) => s !== v));
        }}
        isDisabled={isDisabled}
      />
      <p className="ui-helper">{displayHelperText}</p>
    </div>
  );
}
