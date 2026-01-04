import { AlertCircle, Loader2, MessageSquare, Send } from "lucide-react";
import { useCallback, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createLogger } from "@/lib/logger";
import { isMaxFormat } from "@/lib/max-format";
import { cn } from "@/lib/utils";
import { api } from "@/services/rpc";

import type { DebugInfo } from "@shared/types";

const log = createLogger('MainInput');

type MainInputProps = {
  value: string;
  currentPrompt: string;
  lyricsMode: boolean;
  maxMode: boolean;
  isGenerating: boolean;
  maxChars: number;
  inputOverLimit: boolean;
  canSubmit: boolean;
  hasAdvancedSelection: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

export function MainInput({
  value,
  currentPrompt,
  lyricsMode,
  maxMode,
  isGenerating,
  maxChars,
  inputOverLimit,
  canSubmit,
  hasAdvancedSelection,
  onChange,
  onSubmit,
  onConversionComplete,
}: MainInputProps): ReactNode {
  const { showToast } = useToast();

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>): Promise<void> => {
    if (!maxMode) return;
    if (isGenerating) return;

    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.trim()) return;

    if (isMaxFormat(pastedText)) {
      return;
    }

    try {
      const result = await api.convertToMaxFormat(pastedText);
      
      if (result?.convertedPrompt && result.wasConverted) {
        await onConversionComplete(
          pastedText,
          result.convertedPrompt,
          result.versionId,
          result.debugInfo
        );
        showToast('Converted to Max Mode format', 'success');
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        log.info('Conversion cancelled by user');
        return;
      }
      log.error('Conversion failed:', error);
      showToast('Failed to convert to Max Mode format', 'error');
    }
  }, [maxMode, isGenerating, onConversionComplete, showToast]);

  const getPlaceholder = (): string => {
    if (currentPrompt) {
      return lyricsMode 
        ? "How should the style change? (e.g., 'more epic', 'add orchestra')"
        : "How should the prompt change? (e.g., 'more energy', 'darker mood')";
    }
    return lyricsMode 
      ? "Describe the musical style, genre, mood, and instrumentation"
      : "Describe your song, style, mood, or refine the existing prompt";
  };

  const getLabel = (): string => {
    if (currentPrompt) return 'Refine Prompt';
    return lyricsMode ? 'Musical Style' : 'Describe Your Song';
  };

  return (
    <div className="space-y-1">
      <FormLabel icon={<MessageSquare className="w-3 h-3" />} badge={hasAdvancedSelection ? "optional" : undefined}>
        {getLabel()}
      </FormLabel>
      <div className="flex gap-3 items-end">
        <Textarea
          value={value}
          onChange={(e): void => { onChange(e.target.value); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isGenerating}
          className={cn(
            "min-h-20 flex-1 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
            isGenerating && "opacity-70"
          )}
          placeholder={getPlaceholder()}
        />
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="sm"
          className={cn(
            "h-9 px-4 rounded-lg gap-2 shadow-panel shrink-0 interactive",
            isGenerating && "w-9 px-0"
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="font-semibold text-tiny tracking-tight">
                {currentPrompt ? "REFINE" : "GENERATE"}
              </span>
            </>
          )}
        </Button>
      </div>
      {inputOverLimit && (
        <p className="text-caption text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
        </p>
      )}
    </div>
  );
}
