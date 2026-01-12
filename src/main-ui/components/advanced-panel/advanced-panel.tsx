import { X } from "lucide-react";

import { GenreMultiSelect } from "@/components/genre-multi-select";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import {
  HARMONIC_DISPLAY_NAMES,
  COMBINATION_DISPLAY_NAMES,
  POLYRHYTHM_DISPLAY_NAMES,
  TIME_SIGNATURE_DISPLAY_NAMES,
  TIME_JOURNEY_DISPLAY_NAMES,
} from "@shared/labels";
import { hasAdvancedSelection } from "@shared/music-phrase";

import { AdvancedOptionsGrid } from "./advanced-options-grid";
import { PhrasePreview } from "./phrase-preview";

import type { MoodCategory } from "@bun/mood";
import type { AdvancedSelection } from "@shared/types";
import type { ReactElement } from "react";

type AdvancedPanelProps = {
  selection: AdvancedSelection;
  onUpdate: (updates: Partial<AdvancedSelection>) => void;
  onClear: () => void;
  computedPhrase: string;
  /** Current mood category selection (null if none selected) */
  moodCategory?: MoodCategory | null;
  /** Callback when mood category changes */
  onMoodCategoryChange: (category: MoodCategory | null) => void;
  /** Whether generation is in progress (disables mood selector) */
  isGenerating: boolean;
};

// All options for Combobox (sorted alphabetically by label)
const HARMONIC_OPTIONS = Object.entries(HARMONIC_DISPLAY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const HARMONIC_COMBINATION_OPTIONS = Object.entries(COMBINATION_DISPLAY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const POLYRHYTHM_OPTIONS = Object.entries(POLYRHYTHM_DISPLAY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const TIME_SIGNATURE_OPTIONS = Object.entries(TIME_SIGNATURE_DISPLAY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const TIME_JOURNEY_OPTIONS = Object.entries(TIME_JOURNEY_DISPLAY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function AdvancedPanel({ 
  selection, 
  onUpdate, 
  onClear, 
  computedPhrase,
  moodCategory,
  onMoodCategoryChange,
  isGenerating,
}: AdvancedPanelProps): ReactElement {
  const hasAnySelection = hasAdvancedSelection(selection);
  const isDirectMode = selection.sunoStyles.length > 0;
  const hasGenres = selection.seedGenres.length > 0;
  
  // Pre-calculate helper text and badge text for cleaner JSX
  const genresDisabled = isDirectMode;
  const genresHelperText = genresDisabled ? "Disabled when Suno styles are selected" : undefined;
  const genresBadgeText = genresDisabled ? "disabled" : "optional";
  
  const stylesDisabled = hasGenres;
  const stylesHelperText = stylesDisabled 
    ? "Disabled when Seed Genres are selected" 
    : isDirectMode 
      ? "Selected styles will be used exactly as-is" 
      : undefined;
  const stylesBadgeText = stylesDisabled ? "disabled" : "optional";

  return (
    <div className="space-y-[var(--space-5)] p-[var(--space-panel)] panel">
      <div className="flex items-center justify-between">
        <SectionLabel>Advanced Mode</SectionLabel>
        {hasAnySelection && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* Direct Mode Indicator */}
      {isDirectMode && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-primary font-medium">
            Direct Mode: Styles will be used exactly as selected
          </p>
        </div>
      )}

      {/* Mood Category - First item in advanced panel */}
      <MoodCategoryCombobox
        value={moodCategory ?? null}
        onChange={onMoodCategoryChange}
        disabled={isGenerating}
        helperText="Influences the emotional tone of enrichment"
        badgeText="optional"
      />

      {/* Genre Multi-Select - spans full width */}
      <GenreMultiSelect
        selected={selection.seedGenres}
        onChange={(genres) => { onUpdate({ seedGenres: genres }); }}
        maxSelections={4}
        disabled={isGenerating || genresDisabled}
        helperText={genresHelperText}
        badgeText={genresBadgeText}
      />

      {/* Suno V5 Styles Multi-Select - spans full width */}
      <SunoStylesMultiSelect
        selected={selection.sunoStyles}
        onChange={(styles) => { onUpdate({ sunoStyles: styles }); }}
        maxSelections={4}
        disabled={isGenerating || stylesDisabled}
        helperText={stylesHelperText}
        badgeText={stylesBadgeText}
      />

      <AdvancedOptionsGrid
        selection={selection}
        onUpdate={onUpdate}
        harmonicOptions={HARMONIC_OPTIONS}
        harmonicCombinationOptions={HARMONIC_COMBINATION_OPTIONS}
        polyrhythmOptions={POLYRHYTHM_OPTIONS}
        timeSignatureOptions={TIME_SIGNATURE_OPTIONS}
        timeJourneyOptions={TIME_JOURNEY_OPTIONS}
      />

      <PhrasePreview phrase={computedPhrase} />
    </div>
  );
}
