import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const HARMONIC_STYLES = Object.entries(HARMONIC_DISPLAY_NAMES);
const COMBINATIONS = Object.entries(COMBINATION_DISPLAY_NAMES);
const POLYRHYTHMS = Object.entries(POLYRHYTHM_DISPLAY_NAMES);
const TIME_SIGNATURES = Object.entries(TIME_SIGNATURE_DISPLAY_NAMES);
const TIME_JOURNEYS = Object.entries(TIME_JOURNEY_DISPLAY_NAMES);

// Genre options for Combobox (sorted alphabetically by label)
const GENRE_OPTIONS = Object.entries(GENRE_DISPLAY_NAMES)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

const GENRE_COMBINATION_OPTIONS = Object.entries(GENRE_COMBINATION_DISPLAY_NAMES)
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
        <div className="space-y-4 p-[var(--space-panel)] glass-panel-subtle">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Genre (single) */}
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
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
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
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
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
                        Harmonic Style
                        {selection.harmonicCombination && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Select
                        value={selection.harmonicStyle || ""}
                        onValueChange={(val) => onUpdate({ harmonicStyle: val || null })}
                        disabled={!!selection.harmonicCombination}
                    >
                        <SelectTrigger className={cn(
                            "h-8 text-sm",
                            selection.harmonicCombination && "opacity-50"
                        )}>
                            <SelectValue placeholder="Select mode..." />
                        </SelectTrigger>
                        <SelectContent>
                            {HARMONIC_STYLES.map(([key, name]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Harmonic Combination */}
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
                        Harmonic Combination
                        {selection.harmonicStyle && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Select
                        value={selection.harmonicCombination || ""}
                        onValueChange={(val) => onUpdate({ harmonicCombination: val || null })}
                        disabled={!!selection.harmonicStyle}
                    >
                        <SelectTrigger className={cn(
                            "h-8 text-sm",
                            selection.harmonicStyle && "opacity-50"
                        )}>
                            <SelectValue placeholder="Select combination..." />
                        </SelectTrigger>
                        <SelectContent>
                            {COMBINATIONS.map(([key, name]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Polyrhythm Combination */}
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
                        Polyrhythm
                    </label>
                    <Select
                        value={selection.polyrhythmCombination || ""}
                        onValueChange={(val) => onUpdate({ polyrhythmCombination: val || null })}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select polyrhythm..." />
                        </SelectTrigger>
                        <SelectContent>
                            {POLYRHYTHMS.map(([key, name]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Time Signature */}
                <div className="space-y-1.5">
                    <label className="text-tiny text-muted-foreground font-medium">
                        Time Signature
                        {selection.timeSignatureJourney && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Select
                        value={selection.timeSignature || ""}
                        onValueChange={(val) => onUpdate({ timeSignature: val || null })}
                        disabled={!!selection.timeSignatureJourney}
                    >
                        <SelectTrigger className={cn(
                            "h-8 text-sm",
                            selection.timeSignatureJourney && "opacity-50"
                        )}>
                            <SelectValue placeholder="Select time signature..." />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_SIGNATURES.map(([key, name]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Time Signature Journey */}
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-tiny text-muted-foreground font-medium">
                        Time Signature Journey
                        {selection.timeSignature && (
                            <Badge variant="secondary" className="ml-2 text-micro">disabled</Badge>
                        )}
                    </label>
                    <Select
                        value={selection.timeSignatureJourney || ""}
                        onValueChange={(val) => onUpdate({ timeSignatureJourney: val || null })}
                        disabled={!!selection.timeSignature}
                    >
                        <SelectTrigger className={cn(
                            "h-8 text-sm",
                            selection.timeSignature && "opacity-50"
                        )}>
                            <SelectValue placeholder="Select journey..." />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_JOURNEYS.map(([key, name]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Generated Phrase Preview */}
            {computedPhrase && (
                <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-1">
                        <SectionLabel>Generated Music Phrase</SectionLabel>
                        <Badge variant="outline" className="text-micro">locked</Badge>
                    </div>
                    <p className="text-sm font-mono bg-background/50 rounded px-3 py-2 border">
                        {computedPhrase}
                    </p>
                    <p className="text-micro text-muted-foreground mt-1">
                        This phrase will appear verbatim in your prompt - the AI won't modify it.
                    </p>
                </div>
            )}
        </div>
    );
}
