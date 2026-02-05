import { Palette } from 'lucide-react';

import { Combobox } from '@/components/ui/combobox';
import { FormLabel } from '@/components/ui/form-label';
import { getMoodCategoryOptions } from '@bun/mood';

import type { MoodCategory } from '@bun/mood';
import type { ReactElement } from 'react';

interface MoodCategoryComboboxProps {
  value: MoodCategory | null;
  onChange: (value: MoodCategory | null) => void;
  disabled?: boolean;
  /**
   * When true, the combobox will automatically be disabled when inside a
   * GenerationDisabledProvider with isDisabled=true.
   * @default true
   */
  autoDisable?: boolean;
  label?: string;
  helperText?: string;
  badgeText?: string;
}

/**
 * Combobox for selecting a mood category.
 *
 * Displays "None (Auto)" when no value is selected, allowing the system
 * to automatically determine the mood. Otherwise displays the selected
 * mood category name.
 *
 * @example
 * <MoodCategoryCombobox
 *   value={moodCategory}
 *   onChange={setMoodCategory}
 *   helperText="Influences the emotional tone of your prompt"
 * />
 */
export function MoodCategoryCombobox({
  value,
  onChange,
  disabled,
  autoDisable = true,
  label = 'Mood',
  helperText,
  badgeText = 'optional',
}: MoodCategoryComboboxProps): ReactElement {
  const options = getMoodCategoryOptions();

  const handleChange = (newValue: string | null): void => {
    // Convert empty string to null for "None/Auto" selection
    onChange(newValue === '' || newValue === null ? null : (newValue as MoodCategory));
  };

  return (
    <div className="space-y-2">
      <FormLabel icon={<Palette className="w-3 h-3" />} badge={badgeText}>
        {label}
      </FormLabel>
      <Combobox
        options={options}
        value={value ?? ''}
        onValueChange={handleChange}
        placeholder="None (Auto)"
        searchPlaceholder="Search moods..."
        emptyText="No mood found."
        disabled={disabled}
        autoDisable={autoDisable}
        aria-label="Select mood category"
      />
      {helperText && <p className="ui-helper">{helperText}</p>}
    </div>
  );
}
