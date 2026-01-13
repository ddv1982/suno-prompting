import { useMemo, useState } from "react";

import { ChatHistorySection } from "@/components/chat-history-section";
import { CreativeBoostPanel } from "@/components/creative-boost-panel";
import { ModeSelector } from "@/components/mode-selector";
import { DebugSheet } from "@/components/prompt-editor/debug-sheet";
import { EditorStatusFooter } from "@/components/prompt-editor/editor-status-footer";
import { FullPromptInputPanel } from "@/components/prompt-editor/full-prompt-input-panel";
import { OutputPanel } from "@/components/prompt-editor/output-panel";
import { type PromptEditorProps } from "@/components/prompt-editor/types";
import { ValidationMessages } from "@/components/prompt-editor/validation-messages";
import { QuickVibesPanel } from "@/components/quick-vibes-panel";
import { Separator } from "@/components/ui/separator";
import { APP_CONSTANTS } from "@shared/constants";
import { hasAdvancedSelection } from "@shared/music-phrase";
import { validateLockedPhrase } from "@shared/validation";

import type { ReactElement } from "react";

export function PromptEditor({ output, input, generation, modes, quickVibes, creativeBoost, remix, handlers, config }: PromptEditorProps): ReactElement {
  const { currentPrompt, currentTitle, currentLyrics } = output;
  const { pendingInput, lockedPhrase, lyricsTopic, advancedSelection, computedMusicPhrase } = input;
  const { isGenerating, generatingAction, validation, debugTrace, chatMessages } = generation;
  const { maxMode, lyricsMode, editorMode, promptMode, creativeBoostMode } = modes;
  const { maxChars, currentModel, useLocalLLM } = config;
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

  const handleCopy = (): void => {
    if (promptOverLimit) return;
    handlers.onCopy();
    setCopied(true);
    setTimeout(() => { setCopied(false); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <section className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 pb-[var(--space-8)] gap-6 max-w-6xl mx-auto w-full overflow-auto">
        <OutputPanel
          promptMode={promptMode} currentPrompt={currentPrompt} currentTitle={currentTitle} currentLyrics={currentLyrics}
          isGenerating={isGenerating} generatingAction={generatingAction} maxMode={maxMode} copied={copied}
          promptOverLimit={promptOverLimit} charCount={charCount} maxChars={maxChars} debugTrace={debugTrace}
          onRemixQuickVibes={remix.onRemixQuickVibes} onRemixTitle={remix.onRemixTitle} onRemixLyrics={remix.onRemixLyrics}
          onRemixGenre={remix.onRemixGenre} onRemixMood={remix.onRemixMood} onRemixInstruments={remix.onRemixInstruments}
          onRemixStyleTags={remix.onRemixStyleTags} onRemixRecording={remix.onRemixRecording} onRemix={remix.onRemix}
          onCopy={handleCopy} onDebugOpen={() => { setDebugOpen(true); }}
        />

        <ValidationMessages errors={validation.errors} warnings={validation.warnings} />
        <DebugSheet debugTrace={debugTrace} open={debugOpen} onOpenChange={setDebugOpen} />
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
            onPromptModeChange={handlers.onPromptModeChange}
            disabled={isGenerating}
          />

          {promptMode === 'quickVibes' ? (
            <QuickVibesPanel input={quickVibes.input} originalInput={quickVibes.originalInput} withWordlessVocals={quickVibes.withWordlessVocals} maxMode={maxMode}
              isGenerating={isGenerating} hasCurrentPrompt={!!currentPrompt} onInputChange={handlers.onQuickVibesInputChange}
              onWordlessVocalsChange={handlers.onWordlessVocalsChange} onMaxModeChange={handlers.onMaxModeChange}
              onGenerate={() => { handlers.onGenerateQuickVibes(quickVibes.input.category, quickVibes.input.customDescription, quickVibes.withWordlessVocals, quickVibes.input.sunoStyles, quickVibes.input.moodCategory); }}
              onRefine={handlers.onRefineQuickVibes} />
          ) : promptMode === 'creativeBoost' ? (
            <CreativeBoostPanel input={creativeBoost.input} maxMode={maxMode} lyricsMode={lyricsMode}
              isGenerating={isGenerating} hasCurrentPrompt={!!currentPrompt} creativeBoostMode={creativeBoostMode}
              onCreativeBoostModeChange={handlers.onCreativeBoostModeChange} onInputChange={handlers.onCreativeBoostInputChange}
              onMaxModeChange={handlers.onMaxModeChange} onLyricsModeChange={handlers.onLyricsModeChange}
              onGenerate={handlers.onGenerateCreativeBoost} onRefine={handlers.onRefineCreativeBoost} />
          ) : (
            <FullPromptInputPanel currentPrompt={currentPrompt} pendingInput={pendingInput} lockedPhrase={lockedPhrase}
              lyricsTopic={lyricsTopic} moodCategory={input.moodCategory} editorMode={editorMode} advancedSelection={advancedSelection}
              computedMusicPhrase={computedMusicPhrase} maxMode={maxMode} lyricsMode={lyricsMode} isGenerating={isGenerating}
              maxChars={maxChars} lockedPhraseValidation={lockedPhraseValidation} inputOverLimit={inputOverLimit}
              lyricsTopicOverLimit={lyricsTopicOverLimit} hasAdvancedSelection={isAdvancedModeActive}
              onPendingInputChange={handlers.onPendingInputChange} onLockedPhraseChange={handlers.onLockedPhraseChange}
              onLyricsTopicChange={handlers.onLyricsTopicChange} onMoodCategoryChange={handlers.onMoodCategoryChange}
              onEditorModeChange={handlers.onEditorModeChange}
              onAdvancedSelectionUpdate={handlers.onAdvancedSelectionUpdate} onAdvancedSelectionClear={handlers.onAdvancedSelectionClear}
              onMaxModeChange={handlers.onMaxModeChange} onLyricsModeChange={handlers.onLyricsModeChange}
              onGenerate={handlers.onGenerate} onConversionComplete={handlers.onConversionComplete} />
          )}

          <EditorStatusFooter isGenerating={isGenerating} currentModel={currentModel} useLocalLLM={useLocalLLM} />
        </div>
      </div>
    </section>
  );
}
