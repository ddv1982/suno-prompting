import { BookOpen, Music2, Settings2, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/ui/toggle-row';

import type { EditorMode } from '@shared/types';
import type { ReactElement } from 'react';

interface ModeToggleProps {
  editorMode: EditorMode;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  onEditorModeChange: (mode: EditorMode) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onStoryModeChange: (mode: boolean) => void;
}

export function ModeToggle({
  editorMode,
  maxMode,
  lyricsMode,
  storyMode,
  onEditorModeChange,
  onMaxModeChange,
  onLyricsModeChange,
  onStoryModeChange,
}: ModeToggleProps): ReactElement {
  const iconClass = 'w-3.5 h-3.5 text-muted-foreground';

  const handleStoryModeChange = (checked: boolean): void => {
    onStoryModeChange(checked);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant={editorMode === 'simple' ? 'default' : 'outline'}
          size="xs"
          onClick={(): void => {
            onEditorModeChange('simple');
          }}
          autoDisable
          className="font-semibold"
        >
          Simple
        </Button>
        <Button
          variant={editorMode === 'advanced' ? 'default' : 'outline'}
          size="xs"
          onClick={(): void => {
            onEditorModeChange('advanced');
          }}
          autoDisable
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
      <div className="flex items-center gap-4 shrink-0">
        <ToggleRow
          id="mode-lyrics"
          icon={<Music2 className={iconClass} />}
          label="Lyrics"
          checked={lyricsMode}
          onChange={onLyricsModeChange}
        />
        <ToggleRow
          id="mode-max"
          icon={<Zap className={iconClass} />}
          label="Max"
          checked={maxMode}
          onChange={onMaxModeChange}
        />
        <ToggleRow
          id="mode-story"
          icon={<BookOpen className={iconClass} />}
          label="Story"
          checked={storyMode}
          onChange={handleStoryModeChange}
        />
      </div>
    </div>
  );
}
