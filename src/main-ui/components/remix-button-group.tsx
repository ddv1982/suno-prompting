import { Button } from "@/components/ui/button";
import { Shuffle, RefreshCw, Check, Copy, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { type GeneratingAction } from "@/context/app-context";

type RemixButtonGroupProps = {
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  maxMode: boolean;
  copied: boolean;
  promptOverLimit: boolean;
  hasDebugInfo: boolean;
  onDebugOpen: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixInstruments: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemix: () => void;
  onCopy: () => void;
};

export function RemixButtonGroup({
  isGenerating,
  generatingAction,
  maxMode,
  copied,
  promptOverLimit,
  hasDebugInfo,
  onDebugOpen,
  onRemixGenre,
  onRemixMood,
  onRemixInstruments,
  onRemixStyleTags,
  onRemixRecording,
  onRemix,
  onCopy,
}: RemixButtonGroupProps) {
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {hasDebugInfo && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDebugOpen}
          className="font-bold"
        >
          <Bug className="w-3.5 h-3.5" />
          DEBUG
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRemixGenre}
        disabled={isGenerating}
        className="font-bold"
      >
        <Shuffle className={cn("w-3.5 h-3.5", generatingAction === 'remixGenre' && "animate-spin")} />
        GENRE
      </Button>
      {!maxMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRemixMood}
          disabled={isGenerating}
          className="font-bold"
        >
          <Shuffle className={cn("w-3.5 h-3.5", generatingAction === 'remixMood' && "animate-spin")} />
          MOOD
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRemixInstruments}
        disabled={isGenerating}
        className="font-bold"
      >
        <Shuffle className={cn("w-3.5 h-3.5", generatingAction === 'remixInstruments' && "animate-spin")} />
        INSTRUMENTS
      </Button>
      {maxMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRemixStyleTags}
          disabled={isGenerating}
          className="font-bold"
        >
          <Shuffle className={cn("w-3.5 h-3.5", generatingAction === 'remixStyleTags' && "animate-spin")} />
          STYLE
        </Button>
      )}
      {maxMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRemixRecording}
          disabled={isGenerating}
          className="font-bold"
        >
          <Shuffle className={cn("w-3.5 h-3.5", generatingAction === 'remixRecording' && "animate-spin")} />
          RECORDING
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRemix}
        disabled={isGenerating}
        className="font-bold"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", generatingAction === 'remix' && "animate-spin")} />
        {generatingAction === 'remix' ? "REMIXING" : "REMIX"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={promptOverLimit}
        className={cn(
          "font-bold transition-all duration-300",
          copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
        )}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "COPIED" : "COPY"}
      </Button>
    </div>
  );
}
