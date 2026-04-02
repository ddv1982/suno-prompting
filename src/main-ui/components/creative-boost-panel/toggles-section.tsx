import { FileText } from 'lucide-react';

import { PanelModeToggles } from '@/components/shared';
import { ToggleRow } from '@/components/ui/toggle-row';

import type { ReactElement } from 'react';

interface TogglesSectionProps {
  maxMode: boolean;
  storyMode: boolean;
  lyricsMode: boolean;
  isLLMAvailable: boolean;
  isDirectMode: boolean;
  onMaxModeChange: (checked: boolean) => void;
  onStoryModeChange: (checked: boolean) => void;
  onLyricsModeChange: (checked: boolean) => void;
}

export function TogglesSection({
  maxMode,
  storyMode,
  lyricsMode,
  isLLMAvailable,
  isDirectMode,
  onMaxModeChange,
  onStoryModeChange,
  onLyricsModeChange,
}: TogglesSectionProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <PanelModeToggles
        idPrefix="cb"
        maxMode={maxMode}
        storyMode={storyMode}
        isLLMAvailable={isLLMAvailable}
        onMaxModeChange={onMaxModeChange}
        onStoryModeChange={onStoryModeChange}
      />
      <ToggleRow
        id="cb-lyrics"
        icon={<FileText className="w-3.5 h-3.5" />}
        label="Lyrics"
        checked={lyricsMode}
        onChange={onLyricsModeChange}
        autoDisable
      />
      <p className="ui-helper pl-6">
        {lyricsMode
          ? isDirectMode
            ? 'Will generate lyrics based on selected styles (no Max Mode header).'
            : 'Will generate lyrics based on genre and topic.'
          : 'Instrumental output - no vocals.'}
      </p>
    </div>
  );
}
