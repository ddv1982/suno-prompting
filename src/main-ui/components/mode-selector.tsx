import { Button } from "@/components/ui/button";
import { Zap, FileText } from "lucide-react";
import type { PromptMode } from "@shared/types";

type ModeSelectorProps = {
  promptMode: PromptMode;
  onPromptModeChange: (mode: PromptMode) => void;
  disabled?: boolean;
};

export function ModeSelector({ promptMode, onPromptModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant={promptMode === 'full' ? 'default' : 'outline'}
          size="xs"
          onClick={() => onPromptModeChange('full')}
          disabled={disabled}
          className="font-bold"
        >
          <FileText className="w-3 h-3" />
          Full Prompt
        </Button>
        <Button
          variant={promptMode === 'quickVibes' ? 'default' : 'outline'}
          size="xs"
          onClick={() => onPromptModeChange('quickVibes')}
          disabled={disabled}
          className="font-bold"
        >
          <Zap className="w-3 h-3" />
          Quick Vibes
        </Button>
      </div>
      <p className="text-micro text-muted-foreground ml-0.5">
        {promptMode === 'full' 
          ? 'Full-featured prompt generation with sections, instruments, and advanced options'
          : 'Short, evocative prompts (≤400 chars) for ambient, lo-fi, and background music'
        }
      </p>
    </div>
  );
}
