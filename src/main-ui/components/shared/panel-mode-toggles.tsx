import { BookOpen, Zap } from 'lucide-react';

import { ToggleRow } from '@/components/ui/toggle-row';
import { getMaxModeHelperText, getStoryModeHelperText } from '@shared/constants';

import { LLMUnavailableNotice } from './llm-unavailable-notice';

import type { ReactElement } from 'react';

export interface PanelModeTogglesProps {
  idPrefix: string;
  maxMode: boolean;
  storyMode: boolean;
  isLLMAvailable: boolean;
  onMaxModeChange: (checked: boolean) => void;
  onStoryModeChange: (checked: boolean) => void;
}

export function PanelModeToggles({
  idPrefix,
  maxMode,
  storyMode,
  isLLMAvailable,
  onMaxModeChange,
  onStoryModeChange,
}: PanelModeTogglesProps): ReactElement {
  return (
    <>
      <ToggleRow
        id={`${idPrefix}-max-mode`}
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={maxMode}
        onChange={onMaxModeChange}
        autoDisable
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(maxMode)}</p>
      <ToggleRow
        id={`${idPrefix}-story-mode`}
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
    </>
  );
}
