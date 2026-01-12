import { FileText, Mic, Zap } from "lucide-react";


import { ToggleRow } from "@/components/ui/toggle-row";
import { getMaxModeHelperText } from "@shared/constants";

import type { ReactElement } from "react";

type TogglesSectionProps = {
  withWordlessVocals: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  isDirectMode: boolean;
  isGenerating: boolean;
  onWordlessVocalsChange: (checked: boolean) => void;
  onMaxModeChange: (checked: boolean) => void;
  onLyricsModeChange: (checked: boolean) => void;
};

export function TogglesSection({
  withWordlessVocals,
  maxMode,
  lyricsMode,
  isDirectMode,
  isGenerating,
  onWordlessVocalsChange,
  onMaxModeChange,
  onLyricsModeChange,
}: TogglesSectionProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <ToggleRow
        id="cb-wordless-vocals"
        icon={<Mic className="w-3.5 h-3.5" />}
        label="Wordless vocals"
        helperText="(humming, oohs)"
        checked={withWordlessVocals}
        onChange={onWordlessVocalsChange}
        disabled={isGenerating || lyricsMode}
      />
      <ToggleRow
        id="cb-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={maxMode}
        onChange={onMaxModeChange}
        disabled={isGenerating}
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(maxMode)}</p>
      <ToggleRow
        id="cb-lyrics"
        icon={<FileText className="w-3.5 h-3.5" />}
        label="Lyrics"
        checked={lyricsMode}
        onChange={onLyricsModeChange}
        disabled={isGenerating || withWordlessVocals}
      />
      <p className="ui-helper pl-6">
        {lyricsMode
          ? isDirectMode
            ? "Will generate lyrics based on selected styles (no Max Mode header)."
            : "Will generate lyrics based on genre and topic."
          : withWordlessVocals
            ? "Wordless vocals enabled - no lyrics will be generated."
            : "Instrumental output - no vocals."
        }
      </p>
    </div>
  );
}
