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
import { Loader2, Send, AlertCircle, Bug, Settings2, Lock, MessageSquare, Music2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/lib/chat-utils";
import { type ValidationResult, validateLockedPhrase } from "@shared/validation";
import { type DebugInfo, type EditorMode, type AdvancedSelection } from "@shared/types";
import { type GeneratingAction } from "@/context/AppContext";
import { APP_CONSTANTS } from "@shared/constants";
import { AdvancedPanel } from "@/components/advanced-panel";
import { RemixButtonGroup } from "@/components/remix-button-group";
import { ChatHistorySection } from "@/components/chat-history-section";
import { PromptOutput } from "@/components/prompt-output";
import { ValidationMessages } from "@/components/prompt-editor/ValidationMessages";
import { OutputSection } from "@/components/prompt-editor/OutputSection";
import { DebugDrawerBody } from "@/components/prompt-editor/DebugDrawer";

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
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onGenerate: (input: string) => void;
  onCopy: () => void;
  onRemix: () => void;
  onRemixInstruments: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
  maxMode: boolean;
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
  onPendingInputChange,
  onLockedPhraseChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onGenerate,
  onCopy,
  onRemix,
  onRemixInstruments,
  onRemixGenre,
  onRemixMood,
  onRemixStyleTags,
  onRemixRecording,
  onRemixTitle,
  onRemixLyrics,
  maxMode,
  lyricsMode,
  onLyricsModeChange,
  maxChars = 1000,
  currentModel = "",
  debugInfo,
}: PromptEditorProps) {
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const { charCount, promptOverLimit, inputOverLimit, lockedPhraseValidation } = useMemo(() => ({
    charCount: currentPrompt.length,
    promptOverLimit: currentPrompt.length > maxChars,
    inputOverLimit: pendingInput.trim().length > maxChars,
    lockedPhraseValidation: validateLockedPhrase(lockedPhrase),
  }), [currentPrompt, pendingInput, maxChars, lockedPhrase]);

  const hasAdvancedSelection = editorMode === 'advanced' && (
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
    <section className="flex-1 flex flex-col bg-background">
      <div className="flex-1 flex flex-col p-6 gap-6 max-w-6xl mx-auto w-full overflow-auto">
        {currentPrompt && (
          <div className="space-y-4">
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
              <Card className="relative group border shadow-sm glass-panel overflow-hidden">
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

      <div className="border-t bg-muted/10 p-6 shrink-0">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={editorMode === 'simple' ? 'default' : 'outline'}
                size="xs"
                onClick={() => onEditorModeChange('simple')}
                className="font-bold"
              >
                Simple
              </Button>
              <Button
                variant={editorMode === 'advanced' ? 'default' : 'outline'}
                size="xs"
                onClick={() => onEditorModeChange('advanced')}
                className="font-bold"
              >
                <Settings2 className="w-3 h-3" />
                Advanced
              </Button>
              {editorMode === 'simple' && (
                <span className="text-micro text-muted-foreground ml-2 hidden sm:inline">
                  AI auto-selects harmonic style, rhythm, and time signature
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <Music2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-tiny text-muted-foreground">Lyrics</span>
              <Switch 
                checked={lyricsMode} 
                onCheckedChange={onLyricsModeChange}
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
                "min-h-12 max-h-24 resize-none shadow-sm text-sm p-3 rounded-lg glass-control focus-visible:ring-primary/20",
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
              {currentPrompt ? 'Refine Prompt' : 'Describe Your Song'}
            </FormLabel>
            <div className="flex gap-3 items-end">
              <Textarea
                value={pendingInput}
                onChange={(e) => onPendingInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                className={cn(
                  "min-h-20 flex-1 resize-none shadow-sm text-sm p-4 rounded-xl glass-control focus-visible:ring-primary/20",
                  isGenerating && "opacity-70"
                )}
                placeholder={lyricsMode 
                  ? "Describe your song's theme, story, and emotions for title + lyrics generation"
                  : "Describe your song, style, mood, or refine the existing prompt"
                }
              />
              <Button
                onClick={handleSend}
                disabled={
                  isGenerating ||
                  inputOverLimit ||
                  !lockedPhraseValidation.isValid ||
                  (!pendingInput.trim() && !(editorMode === 'advanced' && currentPrompt && hasAdvancedSelection))
                }
                size="sm"
                className={cn(
                  "h-9 px-4 rounded-lg gap-2 shadow-lg shadow-primary/10 shrink-0 interactive transition-all duration-300",
                  isGenerating && "w-9 px-0"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="font-bold text-tiny tracking-tight">
                      {currentPrompt ? "REFINE" : "GENERATE"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {inputOverLimit && (
            <p className="text-caption text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
            </p>
          )}

          <div className="flex justify-between items-center px-1">
            <span className="text-tiny text-muted-foreground flex items-center gap-4 font-mono">
              <span>⏎ send</span>
              <span>⇧⏎ new line</span>
            </span>
            <div className="flex items-center gap-4">
              {currentModel && (
                <span className="text-tiny font-bold uppercase tracking-tight text-primary/70">
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
