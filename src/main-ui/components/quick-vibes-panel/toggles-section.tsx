import { BookOpen, Zap } from 'lucide-react';

import { LLMUnavailableNotice } from '@/components/shared';
import { ToggleRow } from '@/components/ui/toggle-row';
import { getMaxModeHelperText, getStoryModeHelperText } from '@shared/constants';

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
      <ToggleRow
        id="qv-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={maxMode}
        onChange={onMaxModeChange}
        autoDisable
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(maxMode)}</p>
      <ToggleRow
        id="qv-story-mode"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        label="Story Mode"
        checked={storyMode}
        onChange={onStoryModeChange}
        disabled={!isLLMAvailable}
        autoDisable
        showNaBadge={!isLLMAvailable}
        rightElement={!isLLMAvailable ? <LLMUnavailableNotice /> : undefined}
      />
      <p className="ui-helper pl-6">{getStoryModeHelperText(storyMode, maxMode)}</p>
    </div>
  );
}
