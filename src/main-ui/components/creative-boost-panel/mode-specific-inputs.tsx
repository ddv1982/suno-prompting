import { GenreMultiSelect } from '@/components/genre-multi-select';
import { MoodCategoryCombobox } from '@/components/mood-category-combobox';
import { SunoStylesMultiSelect } from '@/components/suno-styles-multi-select';

import { DirectModeIndicator } from './direct-mode-indicator';

import type { MoodCategory } from '@bun/mood';
import type { CreativeBoostInput } from '@shared/types';
import type { ReactElement } from 'react';

interface ModeSpecificInputsProps {
  input: CreativeBoostInput;
  isSimpleMode: boolean;
  isDirectMode: boolean;
  storyMode?: boolean;
  onMoodCategoryChange: (category: MoodCategory | null) => void;
  onGenresChange: (genres: string[]) => void;
  onSunoStylesChange: (styles: string[]) => void;
}

export function ModeSpecificInputs({
  input,
  isSimpleMode,
  isDirectMode,
  storyMode = false,
  onMoodCategoryChange,
  onGenresChange,
  onSunoStylesChange,
}: ModeSpecificInputsProps): ReactElement {
  if (isSimpleMode) {
    return (
      <MoodCategoryCombobox
        value={input.moodCategory}
        onChange={onMoodCategoryChange}
        helperText="Influences the emotional tone of your prompt"
      />
    );
  }

  const hasGenres = input.seedGenres.length > 0;
  const hasStyles = input.sunoStyles.length > 0;

  return (
    <>
      <DirectModeIndicator isDirectMode={isDirectMode} storyMode={storyMode} />

      <MoodCategoryCombobox
        value={input.moodCategory}
        onChange={onMoodCategoryChange}
        helperText="Influences the emotional tone of enrichment"
        badgeText="optional"
      />

      <GenreMultiSelect
        selected={input.seedGenres}
        onChange={onGenresChange}
        maxSelections={4}
        disabled={hasStyles}
        helperText={hasStyles ? 'Disabled when Suno styles are selected' : undefined}
        badgeText={hasStyles ? 'disabled' : 'optional'}
      />

      <SunoStylesMultiSelect
        selected={input.sunoStyles}
        onChange={onSunoStylesChange}
        maxSelections={4}
        disabled={hasGenres}
        helperText={
          hasGenres
            ? 'Disabled when Seed Genres are selected'
            : isDirectMode
              ? 'Selected styles will be used exactly as-is'
              : undefined
        }
        badgeText={hasGenres ? 'disabled' : 'optional'}
      />
    </>
  );
}
