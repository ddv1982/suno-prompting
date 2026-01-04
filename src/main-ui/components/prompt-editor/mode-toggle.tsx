import { Music2, Settings2, Zap } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import type { EditorMode } from "@shared/types";
import type { ReactNode } from "react";

type ModeToggleProps = {
  editorMode: EditorMode;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  onEditorModeChange: (mode: EditorMode) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
};

export function ModeToggle({
  editorMode,
  maxMode,
  lyricsMode,
  isGenerating,
  onEditorModeChange,
  onMaxModeChange,
  onLyricsModeChange,
}: ModeToggleProps): ReactNode {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant={editorMode === 'simple' ? 'default' : 'outline'}
          size="xs"
          onClick={(): void => { onEditorModeChange('simple'); }}
          className="font-semibold"
        >
          Simple
        </Button>
        <Button
          variant={editorMode === 'advanced' ? 'default' : 'outline'}
          size="xs"
          onClick={(): void => { onEditorModeChange('advanced'); }}
          className="font-semibold"
        >
          <Settings2 className="w-3 h-3" />
          Advanced
        </Button>
        {editorMode === 'simple' && (
          <span className="ui-helper ml-2 hidden sm:inline">
            AI auto-selects harmonic style, rhythm, and time signature
          </span>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <Music2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-footnote text-muted-foreground">Lyrics</span>
        <Switch 
          checked={lyricsMode} 
          onCheckedChange={onLyricsModeChange}
          disabled={isGenerating}
          size="sm"
        />
      </label>
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <Zap className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-footnote text-muted-foreground">Max</span>
        <Switch 
          checked={maxMode} 
          onCheckedChange={onMaxModeChange}
          disabled={isGenerating}
          size="sm"
        />
      </label>
    </div>
  );
}
