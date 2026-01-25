import { BookOpen, Bug, FileText, Music, Zap } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";
import { ToggleRow } from "@/components/ui/toggle-row";

import type { ReactElement } from "react";

interface FeatureTogglesProps {
  useSunoTags: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  debugMode: boolean;
  loading: boolean;
  onUseSunoTagsChange: (value: boolean) => void;
  onMaxModeChange: (value: boolean) => void;
  onLyricsModeChange: (value: boolean) => void;
  onStoryModeChange: (value: boolean) => void;
  onDebugModeChange: (value: boolean) => void;
}

export function FeatureToggles({
  useSunoTags,
  maxMode,
  lyricsMode,
  storyMode,
  debugMode,
  loading,
  onUseSunoTagsChange,
  onMaxModeChange,
  onLyricsModeChange,
  onStoryModeChange,
  onDebugModeChange,
}: FeatureTogglesProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <SectionLabel>Feature Settings</SectionLabel>
      
      <ToggleRow
        id="settings-suno-tags"
        icon={<Music className="w-3.5 h-3.5" />}
        label="Song Structure Tags"
        helperText="[VERSE], [CHORUS], etc."
        checked={useSunoTags}
        onChange={onUseSunoTagsChange}
        disabled={loading || maxMode}
        showNaBadge={maxMode}
      />
      
      <ToggleRow
        id="settings-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        helperText="Suno Max Mode tags"
        checked={maxMode}
        onChange={onMaxModeChange}
        disabled={loading}
      />
      
      <ToggleRow
        id="settings-lyrics-mode"
        icon={<FileText className="w-3.5 h-3.5" />}
        label="Lyrics Mode"
        helperText="Generate with lyrics"
        checked={lyricsMode}
        onChange={onLyricsModeChange}
        disabled={loading}
      />
      
      <ToggleRow
        id="settings-story-mode"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        label="Story Mode"
        helperText="Narrative prose format"
        checked={storyMode}
        onChange={onStoryModeChange}
        disabled={loading}
      />
      
      <ToggleRow
        id="settings-debug-mode"
        icon={<Bug className="w-3.5 h-3.5" />}
        label="Debug Mode"
        helperText="Show AI prompts"
        checked={debugMode}
        onChange={onDebugModeChange}
        disabled={loading}
      />
      
      <p className="ui-helper pl-6 pt-1">
        {maxMode 
          ? "Max Mode: Uses community-discovered prompt format. Best for acoustic, country, rock, and organic genres."
          : useSunoTags
            ? "Prompts include Suno V5 section and performance tags"
            : "Toggle settings to customize prompt generation"
        }
      </p>
    </div>
  );
}
