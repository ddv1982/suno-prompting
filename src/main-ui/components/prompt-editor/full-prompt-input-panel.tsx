import { Loader2, Send, AlertCircle, Settings2, Lock, MessageSquare, Music2, Zap } from "lucide-react";
import { useCallback } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form-label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createLogger } from "@/lib/logger";
import { isMaxFormat } from "@/lib/max-format";
import { cn } from "@/lib/utils";
import { api } from "@/services/rpc";
import { APP_CONSTANTS } from "@shared/constants";
import { type EditorMode, type AdvancedSelection } from "@shared/types";

import type { DebugInfo } from "@shared/types";

const log = createLogger('FullPromptInputPanel');

type FullPromptInputPanelProps = {
  currentPrompt: string;
  pendingInput: string;
  lockedPhrase: string;
  lyricsTopic: string;
  editorMode: EditorMode;
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  maxChars: number;
  lockedPhraseValidation: { isValid: boolean; error: string | null };
  inputOverLimit: boolean;
  lyricsTopicOverLimit: boolean;
  hasAdvancedSelection: boolean;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: (input: string) => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

export function FullPromptInputPanel({
  currentPrompt,
  pendingInput,
  lockedPhrase,
  lyricsTopic,
  editorMode,
  advancedSelection,
  computedMusicPhrase,
  maxMode,
  lyricsMode,
  isGenerating,
  maxChars,
  lockedPhraseValidation,
  inputOverLimit,
  lyricsTopicOverLimit,
  hasAdvancedSelection,
  onPendingInputChange,
  onLockedPhraseChange,
  onLyricsTopicChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onMaxModeChange,
  onLyricsModeChange,
  onGenerate,
  onConversionComplete,
}: FullPromptInputPanelProps) {
  const { showToast } = useToast();

  const handleSend = () => {
    const trimmed = pendingInput.trim();
    // Allow generation without description when: advanced mode + selection + (refine OR lyrics topic)
    const canGenerateWithAdvancedSelection = editorMode === 'advanced' && hasAdvancedSelection &&
      (currentPrompt || (lyricsMode && lyricsTopic.trim()));
    
    if (!trimmed && !canGenerateWithAdvancedSelection) return;
    if (isGenerating) return;
    if (trimmed.length > maxChars) return;
    if (!lockedPhraseValidation.isValid) return;
    if (lyricsTopicOverLimit) return;
    onGenerate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <>
      {/* Mode Toggle (Simple/Advanced) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={editorMode === 'simple' ? 'default' : 'outline'}
            size="xs"
            onClick={() => { onEditorModeChange('simple'); }}
            className="font-semibold"
          >
            Simple
          </Button>
          <Button
            variant={editorMode === 'advanced' ? 'default' : 'outline'}
            size="xs"
            onClick={() => { onEditorModeChange('advanced'); }}
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

      {/* Advanced Panel */}
      {editorMode === 'advanced' && (
        <AdvancedPanel
          selection={advancedSelection}
          onUpdate={onAdvancedSelectionUpdate}
          onClear={onAdvancedSelectionClear}
          computedPhrase={computedMusicPhrase}
        />
      )}

      {/* Locked Phrase */}
      <div className="space-y-1">
        <FormLabel
          icon={<Lock className="w-3 h-3" />}
          badge="optional"
          charCount={lockedPhrase ? lockedPhrase.length : undefined}
          maxChars={lockedPhrase ? APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS : undefined}
          error={!lockedPhraseValidation.isValid}
        >
          {editorMode === 'advanced' ? 'Additional Locked Text' : 'Locked Phrase'}
        </FormLabel>
        <Textarea
          value={lockedPhrase}
          onChange={(e) => { onLockedPhraseChange(e.target.value); }}
          disabled={isGenerating}
          className={cn(
            "min-h-12 max-h-24 resize-none text-[length:var(--text-footnote)] p-3 rounded-lg bg-surface",
            !lockedPhraseValidation.isValid && "border-destructive focus-visible:ring-destructive/20",
            isGenerating && "opacity-70"
          )}
          placeholder={editorMode === 'advanced' 
            ? "Additional text to lock (combined with music phrase above)"
            : "Text that will appear exactly as written in the output"}
        />
        {lockedPhraseValidation.error && (
          <p className="text-micro text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {lockedPhraseValidation.error}
          </p>
        )}
      </div>

      {/* Main Input */}
      <div className="space-y-1">
        <FormLabel icon={<MessageSquare className="w-3 h-3" />}>
          {currentPrompt ? 'Refine Prompt' : (lyricsMode ? 'Musical Style' : 'Describe Your Song')}
        </FormLabel>
        <div className="flex gap-3 items-end">
          <Textarea
            value={pendingInput}
            onChange={(e) => { onPendingInputChange(e.target.value); }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isGenerating}
            className={cn(
              "min-h-20 flex-1 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
              isGenerating && "opacity-70"
            )}
            placeholder={currentPrompt 
              ? (lyricsMode 
                ? "How should the style change? (e.g., 'more epic', 'add orchestra')"
                : "How should the prompt change? (e.g., 'more energy', 'darker mood')")
              : (lyricsMode 
                ? "Describe the musical style, genre, mood, and instrumentation"
                : "Describe your song, style, mood, or refine the existing prompt")
            }
          />
          <Button
            onClick={handleSend}
            disabled={
              isGenerating ||
              inputOverLimit ||
              lyricsTopicOverLimit ||
              !lockedPhraseValidation.isValid ||
              (!pendingInput.trim() && !(editorMode === 'advanced' && hasAdvancedSelection && (currentPrompt || (lyricsMode && lyricsTopic.trim()))))
            }
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
      </div>

      {/* Song Topic */}
      {lyricsMode && (
        <div className="space-y-1">
          <FormLabel
            icon={<Music2 className="w-3 h-3" />}
            badge="optional"
            charCount={lyricsTopic ? lyricsTopic.length : undefined}
            maxChars={lyricsTopic ? APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS : undefined}
            error={lyricsTopicOverLimit}
          >
            {currentPrompt ? 'Song Topic' : 'Song Topic (for lyrics)'}
          </FormLabel>
          <Textarea
            value={lyricsTopic}
            onChange={(e) => { onLyricsTopicChange(e.target.value); }}
            disabled={isGenerating}
            className={cn(
              "min-h-16 max-h-32 resize-none text-[length:var(--text-footnote)] p-3 rounded-lg bg-surface",
              lyricsTopicOverLimit && "border-destructive focus-visible:ring-destructive/20",
              isGenerating && "opacity-70"
            )}
            placeholder="What is the song about? (e.g., 'the meaning of life', 'lost love', 'summer road trip')"
          />
          {lyricsTopicOverLimit ? (
            <p className="text-micro text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Song topic exceeds {APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS} characters.
            </p>
          ) : (
            <p className="ui-helper">
              If provided, lyrics will focus on this topic instead of the musical style description above.
            </p>
          )}
        </div>
      )}

      {inputOverLimit && (
        <p className="text-caption text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
        </p>
      )}
    </>
  );
}
