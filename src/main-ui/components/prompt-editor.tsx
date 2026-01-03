import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormLabel } from "@/components/ui/form-label";
import { Loader2, Send, AlertCircle, Bug, Settings2, Lock, MessageSquare, Music2, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/lib/chat-utils";
import { type ValidationResult, validateLockedPhrase } from "@shared/validation";
import { type DebugInfo, type EditorMode, type AdvancedSelection, type PromptMode, type QuickVibesInput, type QuickVibesCategory } from "@shared/types";
import { type GeneratingAction } from "@/context/app-context";
import { APP_CONSTANTS } from "@shared/constants";
import { AdvancedPanel } from "@/components/advanced-panel";
import { RemixButtonGroup } from "@/components/remix-button-group";
import { ChatHistorySection } from "@/components/chat-history-section";
import { PromptOutput } from "@/components/prompt-output";
import { ValidationMessages } from "@/components/prompt-editor/validation-messages";
import { OutputSection } from "@/components/prompt-editor/output-section";
import { DebugDrawerBody } from "@/components/prompt-editor/debug-drawer";
import { ModeSelector } from "@/components/mode-selector";
import { QuickVibesPanel } from "@/components/quick-vibes-panel";
import { QuickVibesOutput } from "@/components/quick-vibes-output";

type PromptEditorProps = {
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  validation: ValidationResult;
  chatMessages: ChatMessage[];
  lockedPhrase: string;
  editorMode: EditorMode;
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  pendingInput: string;
  lyricsTopic: string;
  promptMode: PromptMode;
  quickVibesInput: QuickVibesInput;
  withWordlessVocals: boolean;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onPromptModeChange: (mode: PromptMode) => void;
  onQuickVibesInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onGenerate: (input: string) => void;
  onGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean) => void;
  onCopy: () => void;
  onRemix: () => void;
  onRemixQuickVibes: () => void;
  onRemixInstruments: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
  maxMode: boolean;
  onMaxModeChange: (mode: boolean) => void;
  lyricsMode: boolean;
  onLyricsModeChange: (mode: boolean) => void;
  maxChars?: number;
  currentModel?: string;
  debugInfo?: DebugInfo;
};

export function PromptEditor({
  currentPrompt,
  currentTitle,
  currentLyrics,
  isGenerating,
  generatingAction,
  validation,
  chatMessages,
  lockedPhrase,
  editorMode,
  advancedSelection,
  computedMusicPhrase,
  pendingInput,
  lyricsTopic,
  promptMode,
  quickVibesInput,
  withWordlessVocals,
  onPendingInputChange,
  onLockedPhraseChange,
  onLyricsTopicChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onPromptModeChange,
  onQuickVibesInputChange,
  onWordlessVocalsChange,
  onGenerate,
  onGenerateQuickVibes,
  onCopy,
  onRemix,
  onRemixQuickVibes,
  onRemixInstruments,
  onRemixGenre,
  onRemixMood,
  onRemixStyleTags,
  onRemixRecording,
  onRemixTitle,
  onRemixLyrics,
  maxMode,
  onMaxModeChange,
  lyricsMode,
  onLyricsModeChange,
  maxChars = 1000,
  currentModel = "",
  debugInfo,
}: PromptEditorProps) {
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const { charCount, promptOverLimit, inputOverLimit, lockedPhraseValidation, lyricsTopicOverLimit } = useMemo(() => ({
    charCount: currentPrompt.length,
    promptOverLimit: currentPrompt.length > maxChars,
    inputOverLimit: pendingInput.trim().length > maxChars,
    lockedPhraseValidation: validateLockedPhrase(lockedPhrase),
    lyricsTopicOverLimit: lyricsTopic.length > APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS,
  }), [currentPrompt, pendingInput, maxChars, lockedPhrase, lyricsTopic]);

  const hasAdvancedSelection = editorMode === 'advanced' && (
    advancedSelection.singleGenre ||
    advancedSelection.genreCombination ||
    advancedSelection.harmonicStyle ||
    advancedSelection.harmonicCombination ||
    advancedSelection.polyrhythmCombination ||
    advancedSelection.timeSignature ||
    advancedSelection.timeSignatureJourney
  );

  const handleSend = () => {
    const trimmed = pendingInput.trim();
    const canRefineWithoutInput = editorMode === 'advanced' && currentPrompt && hasAdvancedSelection;
    
    if (!trimmed && !canRefineWithoutInput) return;
    if (isGenerating) return;
    if (trimmed.length > maxChars) return;
    if (!lockedPhraseValidation.isValid) return;
    if (lyricsTopicOverLimit) return;
    onGenerate(trimmed);
    // Input will be cleared by context after successful generation
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = () => {
    if (promptOverLimit) {
      return;
    }
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 pb-[var(--space-8)] gap-6 max-w-6xl mx-auto w-full overflow-auto">
        {currentPrompt && (
          <div className="space-y-[var(--space-5)]">
            {promptMode === 'quickVibes' ? (
              /* Quick Vibes Output */
              <QuickVibesOutput
                prompt={currentPrompt}
                isGenerating={isGenerating}
                hasDebugInfo={!!debugInfo}
                onRemix={onRemixQuickVibes}
                onCopy={handleCopy}
                onDebugOpen={() => setDebugOpen(true)}
              />
            ) : (
              <>
                {/* Title Section - always shown when available */}
                {currentTitle && (
                  <OutputSection
                    label="Title"
                    content={currentTitle}
                    onCopy={() => navigator.clipboard.writeText(currentTitle)}
                    onRemix={onRemixTitle}
                    isGenerating={isGenerating}
                    isRemixing={generatingAction === 'remixTitle'}
                  />
                )}

                {/* Style Prompt Section - always shown */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <SectionLabel>Style Prompt</SectionLabel>
                    <Badge
                      variant={promptOverLimit ? "destructive" : "secondary"}
                      className="text-tiny font-mono tabular-nums h-5"
                    >
                      {charCount} / {maxChars}
                    </Badge>
                  </div>
                  <Card className="relative group border bg-surface overflow-hidden">
                    <CardContent className="p-6">
                      <PromptOutput text={currentPrompt} />
                    </CardContent>
                    <RemixButtonGroup
                      isGenerating={isGenerating}
                      generatingAction={generatingAction}
                      maxMode={maxMode}
                      copied={copied}
                      promptOverLimit={promptOverLimit}
                      hasDebugInfo={!!debugInfo}
                      onDebugOpen={() => setDebugOpen(true)}
                      onRemixGenre={onRemixGenre}
                      onRemixMood={onRemixMood}
                      onRemixInstruments={onRemixInstruments}
                      onRemixStyleTags={onRemixStyleTags}
                      onRemixRecording={onRemixRecording}
                      onRemix={onRemix}
                      onCopy={handleCopy}
                    />
                  </Card>
                </div>

                {/* Lyrics Section - only shown when lyrics mode is enabled */}
                {lyricsMode && currentLyrics && (
                  <OutputSection
                    label="Lyrics"
                    content={currentLyrics}
                    onCopy={() => navigator.clipboard.writeText(currentLyrics)}
                    onRemix={onRemixLyrics}
                    isGenerating={isGenerating}
                    isRemixing={generatingAction === 'remixLyrics'}
                    scrollable
                  />
                )}
              </>
            )}
          </div>
        )}

        <ValidationMessages errors={validation.errors} warnings={validation.warnings} />

        {debugInfo && (
          <Sheet open={debugOpen} onOpenChange={setDebugOpen}>
            <SheetContent side="right" className="w-[min(640px,95vw)] sm:max-w-none">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Info
                </SheetTitle>
              </SheetHeader>
              <DebugDrawerBody debugInfo={debugInfo} />
            </SheetContent>
          </Sheet>
        )}

        <Separator className="opacity-50" />

        <ChatHistorySection
          chatMessages={chatMessages}
          isGenerating={isGenerating}
          expanded={chatExpanded}
          onExpandedChange={setChatExpanded}
        />
      </div>

      <div className="border-t bg-surface p-6 shrink-0">
        <div className="max-w-6xl mx-auto w-full space-y-[var(--space-5)]">
          {/* Prompt Mode Selector - Full Prompt vs Quick Vibes */}
          <ModeSelector
            promptMode={promptMode}
            onPromptModeChange={onPromptModeChange}
            disabled={isGenerating}
          />

          {promptMode === 'quickVibes' ? (
            /* Quick Vibes Input Panel */
            <QuickVibesPanel
              input={quickVibesInput}
              withWordlessVocals={withWordlessVocals}
              maxMode={maxMode}
              isGenerating={isGenerating}
              hasCurrentPrompt={!!currentPrompt}
              onInputChange={onQuickVibesInputChange}
              onWordlessVocalsChange={onWordlessVocalsChange}
              onMaxModeChange={onMaxModeChange}
              onGenerate={() => onGenerateQuickVibes(quickVibesInput.category, quickVibesInput.customDescription, withWordlessVocals)}
              onRefine={(feedback) => onGenerate(feedback)}
            />
          ) : (
            /* Full Prompt Input Panel */
            <>
              {/* Mode Toggle (Simple/Advanced) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={editorMode === 'simple' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => onEditorModeChange('simple')}
                    className="font-semibold"
                  >
                    Simple
                  </Button>
                  <Button
                    variant={editorMode === 'advanced' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => onEditorModeChange('advanced')}
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

              {/* Locked Phrase - available in both modes */}
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
                  onChange={(e) => onLockedPhraseChange(e.target.value)}
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
              <div className="space-y-1">
                <FormLabel icon={<MessageSquare className="w-3 h-3" />}>
                  {currentPrompt ? 'Refine Prompt' : (lyricsMode ? 'Musical Style' : 'Describe Your Song')}
                </FormLabel>
                <div className="flex gap-3 items-end">
                  <Textarea
                    value={pendingInput}
                    onChange={(e) => onPendingInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
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
                      (!pendingInput.trim() && !(editorMode === 'advanced' && currentPrompt && hasAdvancedSelection))
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

              {/* Song Topic - shown when lyrics mode is enabled */}
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
                    onChange={(e) => onLyricsTopicChange(e.target.value)}
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
          )}

          <div className="flex justify-between items-center px-1 pb-[var(--space-2)]">
            <span className="text-[length:var(--text-caption)] text-muted-foreground flex items-center gap-4 font-mono">
              <span>⏎ send</span>
              <span>⇧⏎ new line</span>
            </span>
            <div className="flex items-center gap-4">
              {currentModel && (
                <span className="ui-label text-primary/70">
                  {currentModel.split('/').pop()}
                </span>
              )}
              <StatusIndicator status={isGenerating ? "working" : "ready"} showLabel={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
