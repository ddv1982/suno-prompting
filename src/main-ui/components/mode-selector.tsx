import { Zap, FileText, Dice3 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PromptMode } from "@shared/types";
import type { ReactElement } from "react";

type ModeSelectorProps = {
  promptMode: PromptMode;
  onPromptModeChange: (mode: PromptMode) => void;
  disabled?: boolean;
};

export function ModeSelector({ promptMode, onPromptModeChange, disabled }: ModeSelectorProps): ReactElement {
  const helperText = {
    full: 'Full-featured prompt generation with sections, instruments, and advanced options',
    quickVibes: 'Short, evocative prompts (≤400 chars) for ambient, lo-fi, and background music',
    creativeBoost: 'AI-driven genre exploration with creativity control',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant={promptMode === 'full' ? 'default' : 'outline'}
          size="xs"
          onClick={() => { onPromptModeChange('full'); }}
          disabled={disabled}
          className="font-semibold"
        >
          <FileText className="w-3 h-3" />
          Full Prompt
        </Button>
        <Button
          variant={promptMode === 'quickVibes' ? 'default' : 'outline'}
          size="xs"
          onClick={() => { onPromptModeChange('quickVibes'); }}
          disabled={disabled}
          className="font-semibold"
        >
          <Zap className="w-3 h-3" />
          Quick Vibes
        </Button>
        <Button
          variant={promptMode === 'creativeBoost' ? 'default' : 'outline'}
          size="xs"
          onClick={() => { onPromptModeChange('creativeBoost'); }}
          disabled={disabled}
          className="font-semibold"
        >
          <Dice3 className="w-3 h-3" />
          Creative Boost
        </Button>
      </div>
      <p className="ui-helper ml-0.5">
        {helperText[promptMode]}
      </p>
    </div>
  );
}
