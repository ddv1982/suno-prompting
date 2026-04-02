import { PanelModeToggles } from '@/components/shared';

import type { ReactElement } from 'react';

interface TogglesSectionProps {
  maxMode: boolean;
  storyMode: boolean;
  isLLMAvailable: boolean;
  onMaxModeChange: (checked: boolean) => void;
  onStoryModeChange: (checked: boolean) => void;
}

export function TogglesSection({
  maxMode,
  storyMode,
  isLLMAvailable,
  onMaxModeChange,
  onStoryModeChange,
}: TogglesSectionProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <PanelModeToggles
        idPrefix="qv"
        maxMode={maxMode}
        storyMode={storyMode}
        isLLMAvailable={isLLMAvailable}
        onMaxModeChange={onMaxModeChange}
        onStoryModeChange={onStoryModeChange}
      />
    </div>
  );
}
