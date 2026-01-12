import { AdvancedOption } from "./advanced-option";

import type { AdvancedSelection } from "@shared/types";
import type { ReactElement } from "react";

type Option = { value: string; label: string };

type AdvancedOptionsGridProps = {
  selection: AdvancedSelection;
  onUpdate: (updates: Partial<AdvancedSelection>) => void;
  harmonicOptions: Option[];
  harmonicCombinationOptions: Option[];
  polyrhythmOptions: Option[];
  timeSignatureOptions: Option[];
  timeJourneyOptions: Option[];
};

export function AdvancedOptionsGrid({
  selection,
  onUpdate,
  harmonicOptions,
  harmonicCombinationOptions,
  polyrhythmOptions,
  timeSignatureOptions,
  timeJourneyOptions,
}: AdvancedOptionsGridProps): ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-5)]">
      <AdvancedOption
        label="Harmonic Style"
        options={harmonicOptions}
        value={selection.harmonicStyle}
        onValueChange={(val) => { onUpdate({ harmonicStyle: val }); }}
        disabledByMutualExclusion={!!selection.harmonicCombination}
        placeholder="Select mode..."
        searchPlaceholder="Search modes..."
        emptyText="No mode found."
      />

      <AdvancedOption
        label="Harmonic Combination"
        options={harmonicCombinationOptions}
        value={selection.harmonicCombination}
        onValueChange={(val) => { onUpdate({ harmonicCombination: val }); }}
        disabledByMutualExclusion={!!selection.harmonicStyle}
        placeholder="Select combination..."
        searchPlaceholder="Search combinations..."
        emptyText="No combination found."
      />

      <AdvancedOption
        label="Polyrhythm"
        options={polyrhythmOptions}
        value={selection.polyrhythmCombination}
        onValueChange={(val) => { onUpdate({ polyrhythmCombination: val }); }}
        placeholder="Select polyrhythm..."
        searchPlaceholder="Search polyrhythms..."
        emptyText="No polyrhythm found."
      />

      <AdvancedOption
        label="Time Signature"
        options={timeSignatureOptions}
        value={selection.timeSignature}
        onValueChange={(val) => { onUpdate({ timeSignature: val }); }}
        disabledByMutualExclusion={!!selection.timeSignatureJourney}
        placeholder="Select time signature..."
        searchPlaceholder="Search signatures..."
        emptyText="No signature found."
      />

      <AdvancedOption
        label="Time Signature Journey"
        options={timeJourneyOptions}
        value={selection.timeSignatureJourney}
        onValueChange={(val) => { onUpdate({ timeSignatureJourney: val }); }}
        disabledByMutualExclusion={!!selection.timeSignature}
        placeholder="Select journey..."
        searchPlaceholder="Search journeys..."
        emptyText="No journey found."
        className="md:col-span-2"
      />
    </div>
  );
}
