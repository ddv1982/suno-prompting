import { BookOpen, FileText, Mic, Zap } from "lucide-react";

import { LLMUnavailableNotice } from "@/components/shared";
import { ToggleRow } from "@/components/ui/toggle-row";
import { getMaxModeHelperText, getStoryModeHelperText } from "@shared/constants";

import type { ReactElement } from "react";

interface TogglesSectionProps {
  withWordlessVocals: boolean;
  maxMode: boolean;
  storyMode: boolean;
  lyricsMode: boolean;
  isLLMAvailable: boolean;
  isDirectMode: boolean;
  onWordlessVocalsChange: (checked: boolean) => void;
  onMaxModeChange: (checked: boolean) => void;
  onStoryModeChange: (checked: boolean) => void;
  onLyricsModeChange: (checked: boolean) => void;
}

export function TogglesSection({
  withWordlessVocals,
  maxMode,
  storyMode,
  lyricsMode,
  isLLMAvailable,
  isDirectMode,
  onWordlessVocalsChange,
  onMaxModeChange,
  onStoryModeChange,
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
        disabled={lyricsMode}
        autoDisable
      />
      <ToggleRow
        id="cb-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={maxMode}
        onChange={onMaxModeChange}
        autoDisable
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(maxMode)}</p>
      <div className="flex items-center gap-2">
        <ToggleRow
          id="cb-story-mode"
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Story Mode"
          checked={storyMode}
          onChange={onStoryModeChange}
          disabled={!isLLMAvailable}
          autoDisable
          showNaBadge={!isLLMAvailable}
        />
        {!isLLMAvailable && <LLMUnavailableNotice />}
      </div>
      <p className="ui-helper pl-6">{getStoryModeHelperText(storyMode, maxMode)}</p>
      <ToggleRow
        id="cb-lyrics"
        icon={<FileText className="w-3.5 h-3.5" />}
        label="Lyrics"
        checked={lyricsMode}
        onChange={onLyricsModeChange}
        disabled={withWordlessVocals}
        autoDisable
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
