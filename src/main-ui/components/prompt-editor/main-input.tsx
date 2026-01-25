import { AlertCircle, MessageSquare } from "lucide-react";
import { useCallback, type ReactElement } from "react";

import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useGenerationDisabled } from "@/context/generation-disabled-context";
import { createLogger } from "@/lib/logger";
import { isMaxFormat, isStructuredPrompt } from "@/lib/max-format";
import { formatRpcError } from "@/lib/rpc-utils";
import { rpcClient } from "@/services/rpc-client";

import type { TraceRun } from "@shared/types";

const log = createLogger('MainInput');

interface MainInputProps {
  value: string;
  currentPrompt: string;
  lyricsMode: boolean;
  maxMode: boolean;
  maxChars: number;
  inputOverLimit: boolean;
  hasAdvancedSelection: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugTrace?: TraceRun) => Promise<void>;
}

export function MainInput({
  value,
  currentPrompt,
  lyricsMode,
  maxMode,
  maxChars,
  inputOverLimit,
  hasAdvancedSelection,
  onChange,
  onSubmit,
  onConversionComplete,
}: MainInputProps): ReactElement {
  const { showToast } = useToast();
  const isGenerating = useGenerationDisabled();

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

    // Only convert structured prompts (with Genre:, BPM:, section tags, etc.)
    // Simple descriptions should go through normal generation flow
    if (!isStructuredPrompt(pastedText)) {
      return;
    }

    try {
      const result = await rpcClient.convertToMaxFormat({ text: pastedText });
      if (!result.ok) {
        showToast(formatRpcError(result.error), 'error');
        return;
      }

      if (result.value?.convertedPrompt && result.value.wasConverted) {
        await onConversionComplete(
          pastedText,
          result.value.convertedPrompt,
          result.value.versionId,
          result.value.debugTrace
        );
        showToast('Converted to Max Mode format', 'success');
      }
    } catch (error: unknown) {
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
        ? "Describe how the lyrics should change (optional if changing style)"
        : "Describe style changes, or modify fields above (changes auto-detected)";
    }
    return lyricsMode 
      ? "Describe the musical style, genre, mood, and instrumentation"
      : "Describe your song, style, mood, or refine the existing prompt";
  };

  const getLabel = (): string => {
    if (currentPrompt) {
      return lyricsMode ? 'Refine Lyrics (optional)' : 'Refine Style (optional)';
    }
    return lyricsMode ? 'Musical Style' : 'Describe Your Song';
  };

  return (
    <div className="space-y-1">
      <FormLabel icon={<MessageSquare className="w-3 h-3" />} badge={hasAdvancedSelection ? "optional" : undefined}>
        {getLabel()}
      </FormLabel>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        autoDisable
        className="min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface"
        placeholder={getPlaceholder()}
      />
      {inputOverLimit && (
        <p className="text-caption text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
        </p>
      )}
    </div>
  );
}
