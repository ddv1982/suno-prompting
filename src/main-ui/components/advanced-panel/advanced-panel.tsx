import { X } from "lucide-react";

import { GenreMultiSelect } from "@/components/genre-multi-select";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
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

import { AdvancedOption } from "./advanced-option";
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
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-5)]">
        <AdvancedOption
          label="Harmonic Style"
          options={HARMONIC_OPTIONS}
          value={selection.harmonicStyle}
          onValueChange={(val) => { onUpdate({ harmonicStyle: val }); }}
          disabledByMutualExclusion={!!selection.harmonicCombination}
          placeholder="Select mode..."
          searchPlaceholder="Search modes..."
          emptyText="No mode found."
        />

        <AdvancedOption
          label="Harmonic Combination"
          options={HARMONIC_COMBINATION_OPTIONS}
          value={selection.harmonicCombination}
          onValueChange={(val) => { onUpdate({ harmonicCombination: val }); }}
          disabledByMutualExclusion={!!selection.harmonicStyle}
          placeholder="Select combination..."
          searchPlaceholder="Search combinations..."
          emptyText="No combination found."
        />

        <AdvancedOption
          label="Polyrhythm"
          options={POLYRHYTHM_OPTIONS}
          value={selection.polyrhythmCombination}
          onValueChange={(val) => { onUpdate({ polyrhythmCombination: val }); }}
          placeholder="Select polyrhythm..."
          searchPlaceholder="Search polyrhythms..."
          emptyText="No polyrhythm found."
        />

        <AdvancedOption
          label="Time Signature"
          options={TIME_SIGNATURE_OPTIONS}
          value={selection.timeSignature}
          onValueChange={(val) => { onUpdate({ timeSignature: val }); }}
          disabledByMutualExclusion={!!selection.timeSignatureJourney}
          placeholder="Select time signature..."
          searchPlaceholder="Search signatures..."
          emptyText="No signature found."
        />

        <AdvancedOption
          label="Time Signature Journey"
          options={TIME_JOURNEY_OPTIONS}
          value={selection.timeSignatureJourney}
          onValueChange={(val) => { onUpdate({ timeSignatureJourney: val }); }}
          disabledByMutualExclusion={!!selection.timeSignature}
          placeholder="Select journey..."
          searchPlaceholder="Search journeys..."
          emptyText="No journey found."
          className="md:col-span-2"
        />
      </div>

      <PhrasePreview phrase={computedPhrase} />
    </div>
  );
}
