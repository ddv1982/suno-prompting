import { Shuffle, RefreshCw, Check, Copy, Bug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type GeneratingAction } from "@/context/app-context";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { detectRemixableFields, isStoryModeFormat, type DetectedFields } from "@shared/prompt-utils";

interface RemixButtonGroupProps {
  generatingAction: GeneratingAction; storyMode: boolean; currentPrompt: string;
  promptOverLimit: boolean; hasDebugInfo: boolean;
  onDebugOpen: () => void; onRemixGenre: () => void; onRemixMood: () => void;
  onRemixInstruments: () => void; onRemixStyleTags: () => void; onRemixRecording: () => void;
  onRemix: () => void;
}

function ShuffleBtn({ label, action, current, onClick }: {
  label: string; action: GeneratingAction; current: GeneratingAction; onClick: () => void;
}): React.ReactElement {
  return (
    <Button variant="outline" size="sm" onClick={onClick} autoDisable className="font-bold">
      <Shuffle className={cn("w-3.5 h-3.5", current === action && "animate-spin")} />{label}
    </Button>
  );
}

interface FieldButtonsProps {
  generatingAction: GeneratingAction;
  fields: DetectedFields;
  onRemixGenre: () => void; onRemixMood: () => void; onRemixInstruments: () => void;
  onRemixStyleTags: () => void; onRemixRecording: () => void;
}

function FieldButtons({ generatingAction, fields, onRemixGenre, onRemixMood, onRemixInstruments, onRemixStyleTags, onRemixRecording }: FieldButtonsProps): React.ReactElement {
  return (
    <>
      {fields.hasGenre && <ShuffleBtn label="GENRE" action="remixGenre" current={generatingAction} onClick={onRemixGenre} />}
      {fields.hasMood && <ShuffleBtn label="MOOD" action="remixMood" current={generatingAction} onClick={onRemixMood} />}
      {fields.hasInstruments && <ShuffleBtn label="INSTRUMENTS" action="remixInstruments" current={generatingAction} onClick={onRemixInstruments} />}
      {fields.hasStyleTags && <ShuffleBtn label="STYLE" action="remixStyleTags" current={generatingAction} onClick={onRemixStyleTags} />}
      {fields.hasRecording && <ShuffleBtn label="RECORDING" action="remixRecording" current={generatingAction} onClick={onRemixRecording} />}
    </>
  );
}

export function RemixButtonGroup({
  generatingAction, storyMode, currentPrompt, promptOverLimit, hasDebugInfo,
  onDebugOpen, onRemixGenre, onRemixMood, onRemixInstruments, onRemixStyleTags, onRemixRecording, onRemix,
}: RemixButtonGroupProps): React.ReactElement {
  const { copy, copied } = useCopyToClipboard();
  
  // Hybrid: hide field buttons if storyMode UI toggle is ON, OR if content is narrative prose
  const hideFieldButtons = storyMode || isStoryModeFormat(currentPrompt);
  
  // Content-aware: detect which fields actually exist in the prompt
  const fields = detectRemixableFields(currentPrompt);

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {hasDebugInfo && (
        <Button variant="outline" size="sm" onClick={onDebugOpen} className="font-bold">
          <Bug className="w-3.5 h-3.5" />DEBUG
        </Button>
      )}
      {!hideFieldButtons && (
        <FieldButtons generatingAction={generatingAction} fields={fields}
          onRemixGenre={onRemixGenre} onRemixMood={onRemixMood} onRemixInstruments={onRemixInstruments}
          onRemixStyleTags={onRemixStyleTags} onRemixRecording={onRemixRecording} />
      )}
      <Button variant="outline" size="sm" onClick={onRemix} autoDisable className="font-bold">
        <RefreshCw className={cn("w-3.5 h-3.5", generatingAction === 'remix' && "animate-spin")} />
        {generatingAction === 'remix' ? "REMIXING" : "REMIX"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => copy(currentPrompt)} disabled={promptOverLimit}
        className={cn("font-bold", copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400")}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "COPIED" : "COPY"}
      </Button>
    </div>
  );
}
