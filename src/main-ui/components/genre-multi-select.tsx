import { Music } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { GENRE_DISPLAY_NAMES, GENRE_COMBINATION_DISPLAY_NAMES } from '@shared/labels';

import type { ReactElement } from 'react';

interface GenreMultiSelectProps {
  selected: string[];
  onChange: (genres: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  autoDisable?: boolean;
  helperText?: string;
  badgeText?: 'optional' | 'disabled';
}

interface GenreOption {
  value: string;
  label: string;
  type: 'single' | 'multi';
}

export function GenreMultiSelect({
  selected,
  onChange,
  maxSelections = 2,
  disabled,
  autoDisable = true,
  helperText,
  badgeText = 'optional',
}: GenreMultiSelectProps): ReactElement {
  const allGenres = useMemo<GenreOption[]>(() => {
    const single = Object.entries(GENRE_DISPLAY_NAMES).map(([key, label]) => ({
      value: key,
      label,
      type: 'single' as const,
    }));
    const multi = Object.entries(GENRE_COMBINATION_DISPLAY_NAMES).map(([key, label]) => ({
      value: key,
      label,
      type: 'multi' as const,
    }));
    return [...single, ...multi].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  return (
    <MultiSelectCombobox
      selected={selected}
      onChange={onChange}
      options={allGenres}
      getOptionValue={(opt) => opt.value}
      getOptionLabel={(opt) => opt.label}
      renderOptionExtra={(opt) => (
        <Badge variant="outline" size="sm" className="ml-auto opacity-60">
          {opt.type === 'single' ? 'genre' : 'combo'}
        </Badge>
      )}
      maxSelections={maxSelections}
      disabled={disabled}
      autoDisable={autoDisable}
      label="Seed Genres"
      icon={<Music className="w-3 h-3" />}
      searchPlaceholder="Search genres..."
      emptyText="No genre found."
      helperText={helperText}
      badgeText={badgeText}
    />
  );
}
