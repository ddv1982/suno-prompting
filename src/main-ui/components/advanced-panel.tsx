import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import type { AdvancedSelection } from "@shared/types";
import {
    HARMONIC_DISPLAY_NAMES,
    COMBINATION_DISPLAY_NAMES,
    POLYRHYTHM_DISPLAY_NAMES,
    TIME_SIGNATURE_DISPLAY_NAMES,
    TIME_JOURNEY_DISPLAY_NAMES,
    GENRE_DISPLAY_NAMES,
    GENRE_COMBINATION_DISPLAY_NAMES,
} from "@shared/labels";
import { cn } from "@/lib/utils";

type AdvancedPanelProps = {
    selection: AdvancedSelection;
    onUpdate: (updates: Partial<AdvancedSelection>) => void;
    onClear: () => void;
    computedPhrase: string;
};

// All options for Combobox (sorted alphabetically by label)
const GENRE_OPTIONS = Object.entries(GENRE_DISPLAY_NAMES)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

const GENRE_COMBINATION_OPTIONS = Object.entries(GENRE_COMBINATION_DISPLAY_NAMES)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

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

export function AdvancedPanel({ selection, onUpdate, onClear, computedPhrase }: AdvancedPanelProps) {
    const hasAnySelection = !!(
        selection.singleGenre ||
        selection.genreCombination ||
        selection.harmonicStyle ||
        selection.harmonicCombination ||
        selection.polyrhythmCombination ||
        selection.timeSignature ||
        selection.timeSignatureJourney
    );

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-5)]">
                {/* Genre (single) */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Genre
                        {selection.genreCombination && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={GENRE_OPTIONS}
                        value={selection.singleGenre}
                        onValueChange={(val) => onUpdate({ singleGenre: val })}
                        disabled={!!selection.genreCombination}
                        placeholder="Select genre..."
                        searchPlaceholder="Search genres..."
                        emptyText="No genre found."
                        className={cn(selection.genreCombination && "opacity-50")}
                    />
                </div>

                {/* Genre Combination */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Genre Combination
                        {selection.singleGenre && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={GENRE_COMBINATION_OPTIONS}
                        value={selection.genreCombination}
                        onValueChange={(val) => onUpdate({ genreCombination: val })}
                        disabled={!!selection.singleGenre}
                        placeholder="Select combination..."
                        searchPlaceholder="Search combinations..."
                        emptyText="No combination found."
                        className={cn(selection.singleGenre && "opacity-50")}
                    />
                </div>

                {/* Harmonic Style (single mode) */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Harmonic Style
                        {selection.harmonicCombination && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={HARMONIC_OPTIONS}
                        value={selection.harmonicStyle}
                        onValueChange={(val) => onUpdate({ harmonicStyle: val })}
                        disabled={!!selection.harmonicCombination}
                        placeholder="Select mode..."
                        searchPlaceholder="Search modes..."
                        emptyText="No mode found."
                        className={cn(selection.harmonicCombination && "opacity-50")}
                    />
                </div>

                {/* Harmonic Combination */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Harmonic Combination
                        {selection.harmonicStyle && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={HARMONIC_COMBINATION_OPTIONS}
                        value={selection.harmonicCombination}
                        onValueChange={(val) => onUpdate({ harmonicCombination: val })}
                        disabled={!!selection.harmonicStyle}
                        placeholder="Select combination..."
                        searchPlaceholder="Search combinations..."
                        emptyText="No combination found."
                        className={cn(selection.harmonicStyle && "opacity-50")}
                    />
                </div>

                {/* Polyrhythm Combination */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Polyrhythm
                    </label>
                    <Combobox
                        options={POLYRHYTHM_OPTIONS}
                        value={selection.polyrhythmCombination}
                        onValueChange={(val) => onUpdate({ polyrhythmCombination: val })}
                        placeholder="Select polyrhythm..."
                        searchPlaceholder="Search polyrhythms..."
                        emptyText="No polyrhythm found."
                    />
                </div>

                {/* Time Signature */}
                <div className="space-y-[var(--space-2)]">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Time Signature
                        {selection.timeSignatureJourney && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={TIME_SIGNATURE_OPTIONS}
                        value={selection.timeSignature}
                        onValueChange={(val) => onUpdate({ timeSignature: val })}
                        disabled={!!selection.timeSignatureJourney}
                        placeholder="Select time signature..."
                        searchPlaceholder="Search signatures..."
                        emptyText="No signature found."
                        className={cn(selection.timeSignatureJourney && "opacity-50")}
                    />
                </div>

                {/* Time Signature Journey */}
                <div className="space-y-[var(--space-2)] md:col-span-2">
                    <label className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
                        Time Signature Journey
                        {selection.timeSignature && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Combobox
                        options={TIME_JOURNEY_OPTIONS}
                        value={selection.timeSignatureJourney}
                        onValueChange={(val) => onUpdate({ timeSignatureJourney: val })}
                        disabled={!!selection.timeSignature}
                        placeholder="Select journey..."
                        searchPlaceholder="Search journeys..."
                        emptyText="No journey found."
                        className={cn(selection.timeSignature && "opacity-50")}
                    />
                </div>
            </div>

            {/* Generated Phrase Preview */}
            {computedPhrase && (
                <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-1">
                        <SectionLabel>Generated Music Phrase</SectionLabel>
                        <Badge variant="outline" className="text-micro">locked</Badge>
                    </div>
                    <p className="text-[length:var(--text-footnote)] font-mono bg-background/50 rounded px-3 py-2 border">
                        {computedPhrase}
                    </p>
                    <p className="ui-helper mt-1">
                        This phrase will appear verbatim in your prompt - the AI won't modify it.
                    </p>
                </div>
            )}
        </div>
    );
}
