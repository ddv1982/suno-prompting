import { Shuffle, RefreshCw, Check, Copy, Bug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type GeneratingAction } from "@/context/app-context";
import { cn } from "@/lib/utils";

type RemixButtonGroupProps = {
  isGenerating: boolean; generatingAction: GeneratingAction; maxMode: boolean;
  copied: boolean; promptOverLimit: boolean; hasDebugInfo: boolean;
  onDebugOpen: () => void; onRemixGenre: () => void; onRemixMood: () => void;
  onRemixInstruments: () => void; onRemixStyleTags: () => void; onRemixRecording: () => void;
  onRemix: () => void; onCopy: () => void;
};

function ShuffleBtn({ label, action, current, disabled, onClick }: {
  label: string; action: GeneratingAction; current: GeneratingAction; disabled: boolean; onClick: () => void;
}): React.ReactElement {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled} className="font-bold">
      <Shuffle className={cn("w-3.5 h-3.5", current === action && "animate-spin")} />{label}
    </Button>
  );
}

export function RemixButtonGroup({
  isGenerating, generatingAction, maxMode, copied, promptOverLimit, hasDebugInfo,
  onDebugOpen, onRemixGenre, onRemixMood, onRemixInstruments, onRemixStyleTags, onRemixRecording, onRemix, onCopy,
}: RemixButtonGroupProps): React.ReactElement {
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {hasDebugInfo && (
        <Button variant="outline" size="sm" onClick={onDebugOpen} className="font-bold">
          <Bug className="w-3.5 h-3.5" />DEBUG
        </Button>
      )}
      <ShuffleBtn label="GENRE" action="remixGenre" current={generatingAction} disabled={isGenerating} onClick={onRemixGenre} />
      {!maxMode && <ShuffleBtn label="MOOD" action="remixMood" current={generatingAction} disabled={isGenerating} onClick={onRemixMood} />}
      <ShuffleBtn label="INSTRUMENTS" action="remixInstruments" current={generatingAction} disabled={isGenerating} onClick={onRemixInstruments} />
      {maxMode && <ShuffleBtn label="STYLE" action="remixStyleTags" current={generatingAction} disabled={isGenerating} onClick={onRemixStyleTags} />}
      {maxMode && <ShuffleBtn label="RECORDING" action="remixRecording" current={generatingAction} disabled={isGenerating} onClick={onRemixRecording} />}
      <Button variant="outline" size="sm" onClick={onRemix} disabled={isGenerating} className="font-bold">
        <RefreshCw className={cn("w-3.5 h-3.5", generatingAction === 'remix' && "animate-spin")} />
        {generatingAction === 'remix' ? "REMIXING" : "REMIX"}
      </Button>
      <Button variant="outline" size="sm" onClick={onCopy} disabled={promptOverLimit}
        className={cn("font-bold", copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400")}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "COPIED" : "COPY"}
      </Button>
    </div>
  );
}
