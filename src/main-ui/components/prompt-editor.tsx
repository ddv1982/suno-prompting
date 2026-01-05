import { Bug } from "lucide-react";
import { useState, useMemo } from "react";

import { ChatHistorySection } from "@/components/chat-history-section";
import { CreativeBoostPanel } from "@/components/creative-boost-panel";
import { ModeSelector } from "@/components/mode-selector";
import { DebugDrawerBody } from "@/components/prompt-editor/debug-drawer";
import { EditorStatusFooter } from "@/components/prompt-editor/editor-status-footer";
import { FullPromptInputPanel } from "@/components/prompt-editor/full-prompt-input-panel";
import { OutputPanel } from "@/components/prompt-editor/output-panel";
import { ValidationMessages } from "@/components/prompt-editor/validation-messages";
import { QuickVibesPanel } from "@/components/quick-vibes-panel";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type GeneratingAction } from "@/context/app-context";
import { type ChatMessage } from "@/lib/chat-utils";
import { APP_CONSTANTS } from "@shared/constants";
import { hasAdvancedSelection } from "@shared/music-phrase";
import { type DebugInfo, type EditorMode, type AdvancedSelection, type PromptMode, type QuickVibesInput, type QuickVibesCategory, type CreativeBoostInput, type CreativeBoostMode } from "@shared/types";
import { type ValidationResult, validateLockedPhrase } from "@shared/validation";

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
  creativeBoostInput: CreativeBoostInput;
  creativeBoostMode: CreativeBoostMode;
  onCreativeBoostModeChange: (mode: CreativeBoostMode) => void;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onPromptModeChange: (mode: PromptMode) => void;
  onQuickVibesInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onCreativeBoostInputChange: (input: CreativeBoostInput) => void;
  onGenerate: (input: string) => void;
  onGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean, sunoStyles: string[]) => void;
  onGenerateCreativeBoost: () => void;
  onRefineCreativeBoost: (feedback: string) => void;
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
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
  maxMode: boolean;
  onMaxModeChange: (mode: boolean) => void;
  lyricsMode: boolean;
  onLyricsModeChange: (mode: boolean) => void;
  maxChars?: number;
  currentModel?: string;
  debugInfo?: Partial<DebugInfo>;
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
  creativeBoostInput,
  creativeBoostMode,
  onCreativeBoostModeChange,
  onPendingInputChange,
  onLockedPhraseChange,
  onLyricsTopicChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onPromptModeChange,
  onQuickVibesInputChange,
  onWordlessVocalsChange,
  onCreativeBoostInputChange,
  onGenerate,
  onGenerateQuickVibes,
  onGenerateCreativeBoost,
  onRefineCreativeBoost,
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
  onConversionComplete,
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

  const isAdvancedModeActive = editorMode === 'advanced' && hasAdvancedSelection(advancedSelection);

  const handleCopy = () => {
    if (promptOverLimit) return;
    onCopy();
    setCopied(true);
    setTimeout(() => { setCopied(false); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <section className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 pb-[var(--space-8)] gap-6 max-w-6xl mx-auto w-full overflow-auto">
        <OutputPanel
          promptMode={promptMode}
          currentPrompt={currentPrompt}
          currentTitle={currentTitle}
          currentLyrics={currentLyrics}
          isGenerating={isGenerating}
          generatingAction={generatingAction}
          maxMode={maxMode}
          copied={copied}
          promptOverLimit={promptOverLimit}
          charCount={charCount}
          maxChars={maxChars}
          debugInfo={debugInfo}
          onRemixQuickVibes={onRemixQuickVibes}
          onRemixTitle={onRemixTitle}
          onRemixLyrics={onRemixLyrics}
          onRemixGenre={onRemixGenre}
          onRemixMood={onRemixMood}
          onRemixInstruments={onRemixInstruments}
          onRemixStyleTags={onRemixStyleTags}
          onRemixRecording={onRemixRecording}
          onRemix={onRemix}
          onCopy={handleCopy}
          onDebugOpen={() => { setDebugOpen(true); }}
        />

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
          <ModeSelector
            promptMode={promptMode}
            onPromptModeChange={onPromptModeChange}
            disabled={isGenerating}
          />

          {promptMode === 'quickVibes' ? (
            <QuickVibesPanel
              input={quickVibesInput}
              withWordlessVocals={withWordlessVocals}
              maxMode={maxMode}
              isGenerating={isGenerating}
              hasCurrentPrompt={!!currentPrompt}
              onInputChange={onQuickVibesInputChange}
              onWordlessVocalsChange={onWordlessVocalsChange}
              onMaxModeChange={onMaxModeChange}
              onGenerate={() => { onGenerateQuickVibes(quickVibesInput.category, quickVibesInput.customDescription, withWordlessVocals, quickVibesInput.sunoStyles); }}
              onRefine={(feedback) => { onGenerate(feedback); }}
            />
          ) : promptMode === 'creativeBoost' ? (
            <CreativeBoostPanel
              input={creativeBoostInput}
              maxMode={maxMode}
              lyricsMode={lyricsMode}
              isGenerating={isGenerating}
              hasCurrentPrompt={!!currentPrompt}
              creativeBoostMode={creativeBoostMode}
              onCreativeBoostModeChange={onCreativeBoostModeChange}
              onInputChange={onCreativeBoostInputChange}
              onMaxModeChange={onMaxModeChange}
              onLyricsModeChange={onLyricsModeChange}
              onGenerate={onGenerateCreativeBoost}
              onRefine={onRefineCreativeBoost}
            />
          ) : (
            <FullPromptInputPanel
              currentPrompt={currentPrompt}
              pendingInput={pendingInput}
              lockedPhrase={lockedPhrase}
              lyricsTopic={lyricsTopic}
              editorMode={editorMode}
              advancedSelection={advancedSelection}
              computedMusicPhrase={computedMusicPhrase}
              maxMode={maxMode}
              lyricsMode={lyricsMode}
              isGenerating={isGenerating}
              maxChars={maxChars}
              lockedPhraseValidation={lockedPhraseValidation}
              inputOverLimit={inputOverLimit}
              lyricsTopicOverLimit={lyricsTopicOverLimit}
              hasAdvancedSelection={isAdvancedModeActive}
              onPendingInputChange={onPendingInputChange}
              onLockedPhraseChange={onLockedPhraseChange}
              onLyricsTopicChange={onLyricsTopicChange}
              onEditorModeChange={onEditorModeChange}
              onAdvancedSelectionUpdate={onAdvancedSelectionUpdate}
              onAdvancedSelectionClear={onAdvancedSelectionClear}
              onMaxModeChange={onMaxModeChange}
              onLyricsModeChange={onLyricsModeChange}
              onGenerate={onGenerate}
              onConversionComplete={onConversionComplete}
            />
          )}

          <EditorStatusFooter isGenerating={isGenerating} currentModel={currentModel} />
        </div>
      </div>
    </section>
  );
}
