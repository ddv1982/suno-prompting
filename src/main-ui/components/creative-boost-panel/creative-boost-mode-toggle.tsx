import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CreativeBoostMode } from "@shared/types";
import type { ReactNode } from "react";

type CreativeBoostModeToggleProps = {
  mode: CreativeBoostMode;
  isDirectMode: boolean;
  isGenerating: boolean;
  onModeChange: (mode: CreativeBoostMode) => void;
};

export function CreativeBoostModeToggle({
  mode,
  isDirectMode,
  isGenerating,
  onModeChange,
}: CreativeBoostModeToggleProps): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={mode === 'simple' ? 'default' : 'outline'}
        size="xs"
        onClick={() => { onModeChange('simple'); }}
        disabled={isDirectMode || isGenerating}
        className="font-semibold"
      >
        Simple
      </Button>
      <Button
        variant={mode === 'advanced' ? 'default' : 'outline'}
        size="xs"
        onClick={() => { onModeChange('advanced'); }}
        disabled={isGenerating}
        className="font-semibold"
      >
        <Settings2 className="w-3 h-3" />
        Advanced
      </Button>
      {mode === 'simple' && !isDirectMode && (
        <span className="ui-helper ml-2 hidden sm:inline">
          AI auto-selects genres and styles
        </span>
      )}
      {isDirectMode && (
        <span className="ui-helper ml-2 text-amber-600 hidden sm:inline">
          Simple mode disabled in Direct Mode
        </span>
      )}
    </div>
  );
}
