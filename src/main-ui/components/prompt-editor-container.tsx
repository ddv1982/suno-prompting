import { useMemo } from 'react';

import { PromptEditor } from '@/components/prompt-editor';
import {
  type OutputState,
  type InputState,
  type GenerationState,
  type ModeState,
  type QuickVibesState,
  type CreativeBoostState,
  type RemixHandlers,
  type EditorHandlers,
  type EditorConfig,
  type PromptEditorProps,
} from '@/components/prompt-editor/types';
import { useEditorContext } from '@/context/editor-context';
import { useGenerationContext } from '@/context/generation';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { APP_CONSTANTS } from '@shared/constants';

import type { ReactElement } from 'react';

function usePromptEditorOutputState(
  currentSession: ReturnType<typeof useSessionContext>['currentSession']
): OutputState {
  return useMemo(
    () => ({
      currentPrompt: currentSession?.currentPrompt || '',
      currentTitle: currentSession?.currentTitle,
      currentLyrics: currentSession?.currentLyrics,
    }),
    [currentSession?.currentPrompt, currentSession?.currentTitle, currentSession?.currentLyrics]
  );
}

function usePromptEditorInputState({
  pendingInput,
  lockedPhrase,
  lyricsTopic,
  advancedSelection,
  computedMusicPhrase,
  moodCategory,
}: {
  pendingInput: InputState['pendingInput'];
  lockedPhrase: InputState['lockedPhrase'];
  lyricsTopic: InputState['lyricsTopic'];
  advancedSelection: InputState['advancedSelection'];
  computedMusicPhrase: InputState['computedMusicPhrase'];
  moodCategory: InputState['moodCategory'];
}): InputState {
  return useMemo(
    () => ({
      pendingInput,
      lockedPhrase,
      lyricsTopic,
      advancedSelection,
      computedMusicPhrase,
      moodCategory,
    }),
    [pendingInput, lockedPhrase, lyricsTopic, advancedSelection, computedMusicPhrase, moodCategory]
  );
}

function usePromptEditorGenerationState(
  generationContext: ReturnType<typeof useGenerationContext>
): GenerationState {
  const {
    isGenerating,
    generatingAction,
    validation,
    debugTrace,
    chatMessages,
    isOptimistic,
    showSkeleton,
  } = generationContext;

  return useMemo(
    () => ({
      isGenerating,
      generatingAction,
      validation,
      debugTrace,
      chatMessages,
      isOptimistic,
      showSkeleton,
    }),
    [
      isGenerating,
      generatingAction,
      validation,
      debugTrace,
      chatMessages,
      isOptimistic,
      showSkeleton,
    ]
  );
}

function usePromptEditorModeState(
  settings: Pick<ModeState, 'maxMode' | 'lyricsMode' | 'storyMode'>,
  editor: Pick<ModeState, 'editorMode' | 'promptMode' | 'creativeBoostMode'>
): ModeState {
  const { maxMode, lyricsMode, storyMode } = settings;
  const { editorMode, promptMode, creativeBoostMode } = editor;

  return useMemo(
    () => ({
      maxMode,
      lyricsMode,
      storyMode,
      editorMode,
      promptMode,
      creativeBoostMode,
    }),
    [maxMode, lyricsMode, storyMode, editorMode, promptMode, creativeBoostMode]
  );
}

function usePromptEditorQuickVibesState(
  quickVibesInput: ReturnType<typeof useEditorContext>['quickVibesInput'],
  currentSession: ReturnType<typeof useSessionContext>['currentSession']
): QuickVibesState {
  return useMemo(
    () => ({
      input: quickVibesInput,
      originalInput: currentSession?.quickVibesInput,
    }),
    [quickVibesInput, currentSession?.quickVibesInput]
  );
}

function usePromptEditorCreativeBoostState(
  creativeBoostInput: ReturnType<typeof useEditorContext>['creativeBoostInput']
): CreativeBoostState {
  return useMemo(
    () => ({
      input: creativeBoostInput,
    }),
    [creativeBoostInput]
  );
}

function usePromptEditorRemixHandlers({
  handleRemix,
  handleRemixQuickVibes,
  handleRemixInstruments,
  handleRemixGenre,
  handleRemixMood,
  handleRemixStyleTags,
  handleRemixRecording,
  handleRemixTitle,
  handleRemixLyrics,
}: Pick<
  ReturnType<typeof useGenerationContext>,
  | 'handleRemix'
  | 'handleRemixQuickVibes'
  | 'handleRemixInstruments'
  | 'handleRemixGenre'
  | 'handleRemixMood'
  | 'handleRemixStyleTags'
  | 'handleRemixRecording'
  | 'handleRemixTitle'
  | 'handleRemixLyrics'
>): RemixHandlers {
  return useMemo(
    () => ({
      onRemix: handleRemix,
      onRemixQuickVibes: handleRemixQuickVibes,
      onRemixInstruments: handleRemixInstruments,
      onRemixGenre: handleRemixGenre,
      onRemixMood: handleRemixMood,
      onRemixStyleTags: handleRemixStyleTags,
      onRemixRecording: handleRemixRecording,
      onRemixTitle: handleRemixTitle,
      onRemixLyrics: handleRemixLyrics,
    }),
    [
      handleRemix,
      handleRemixQuickVibes,
      handleRemixInstruments,
      handleRemixGenre,
      handleRemixMood,
      handleRemixStyleTags,
      handleRemixRecording,
      handleRemixTitle,
      handleRemixLyrics,
    ]
  );
}

function usePromptEditorHandlers(
  editorContext: Pick<
    ReturnType<typeof useEditorContext>,
    | 'setPendingInput'
    | 'setLockedPhrase'
    | 'setLyricsTopic'
    | 'setMoodCategory'
    | 'setEditorMode'
    | 'updateAdvancedSelection'
    | 'clearAdvancedSelection'
    | 'setPromptMode'
    | 'setCreativeBoostMode'
    | 'setQuickVibesInput'
    | 'setCreativeBoostInput'
  >,
  settingsContext: Pick<
    ReturnType<typeof useSettingsContext>,
    'setMaxMode' | 'setLyricsMode' | 'setStoryMode'
  >,
  generationContext: Pick<
    ReturnType<typeof useGenerationContext>,
    | 'handleGenerate'
    | 'handleGenerateQuickVibes'
    | 'handleRefineQuickVibes'
    | 'handleGenerateCreativeBoost'
    | 'handleRefineCreativeBoost'
    | 'handleConversionComplete'
  >
): EditorHandlers {
  const {
    setPendingInput,
    setLockedPhrase,
    setLyricsTopic,
    setMoodCategory,
    setEditorMode,
    updateAdvancedSelection,
    clearAdvancedSelection,
    setPromptMode,
    setCreativeBoostMode,
    setQuickVibesInput,
    setCreativeBoostInput,
  } = editorContext;
  const { setMaxMode, setLyricsMode, setStoryMode } = settingsContext;
  const {
    handleGenerate,
    handleGenerateQuickVibes,
    handleRefineQuickVibes,
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
    handleConversionComplete,
  } = generationContext;

  return useMemo(
    () => ({
      onPendingInputChange: setPendingInput,
      onLockedPhraseChange: setLockedPhrase,
      onLyricsTopicChange: setLyricsTopic,
      onMoodCategoryChange: setMoodCategory,
      onEditorModeChange: setEditorMode,
      onAdvancedSelectionUpdate: updateAdvancedSelection,
      onAdvancedSelectionClear: clearAdvancedSelection,
      onPromptModeChange: setPromptMode,
      onMaxModeChange: setMaxMode,
      onLyricsModeChange: setLyricsMode,
      onStoryModeChange: setStoryMode,
      onCreativeBoostModeChange: setCreativeBoostMode,
      onQuickVibesInputChange: setQuickVibesInput,
      onCreativeBoostInputChange: setCreativeBoostInput,
      onGenerate: handleGenerate,
      onGenerateQuickVibes: handleGenerateQuickVibes,
      onRefineQuickVibes: handleRefineQuickVibes,
      onGenerateCreativeBoost: handleGenerateCreativeBoost,
      onRefineCreativeBoost: handleRefineCreativeBoost,
      onConversionComplete: handleConversionComplete,
    }),
    [
      setPendingInput,
      setLockedPhrase,
      setLyricsTopic,
      setMoodCategory,
      setEditorMode,
      updateAdvancedSelection,
      clearAdvancedSelection,
      setPromptMode,
      setMaxMode,
      setLyricsMode,
      setStoryMode,
      setCreativeBoostMode,
      setQuickVibesInput,
      setCreativeBoostInput,
      handleGenerate,
      handleGenerateQuickVibes,
      handleRefineQuickVibes,
      handleGenerateCreativeBoost,
      handleRefineCreativeBoost,
      handleConversionComplete,
    ]
  );
}

function usePromptEditorProps(): PromptEditorProps {
  const { currentSession } = useSessionContext();
  const settings = useSettingsContext();
  const editor = useEditorContext();
  const generationContext = useGenerationContext();
  const { currentModel, maxMode, lyricsMode, storyMode, useLocalLLM } = settings;
  const {
    editorMode,
    promptMode,
    creativeBoostMode,
    advancedSelection,
    lockedPhrase,
    pendingInput,
    lyricsTopic,
    moodCategory,
    computedMusicPhrase,
    quickVibesInput,
    creativeBoostInput,
  } = editor;
  const {
    handleRemix,
    handleRemixQuickVibes,
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
    handleGenerate,
    handleGenerateQuickVibes,
    handleRefineQuickVibes,
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
    handleConversionComplete,
  } = generationContext;

  const output = usePromptEditorOutputState(currentSession);
  const input = usePromptEditorInputState({
    pendingInput,
    lockedPhrase,
    lyricsTopic,
    advancedSelection,
    computedMusicPhrase,
    moodCategory,
  });
  const generation = usePromptEditorGenerationState(generationContext);
  const modes = usePromptEditorModeState(
    { maxMode, lyricsMode, storyMode },
    { editorMode, promptMode, creativeBoostMode }
  );
  const quickVibes = usePromptEditorQuickVibesState(quickVibesInput, currentSession);
  const creativeBoost = usePromptEditorCreativeBoostState(creativeBoostInput);
  const remix = usePromptEditorRemixHandlers({
    handleRemix,
    handleRemixQuickVibes,
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
  });
  const handlers = usePromptEditorHandlers(editor, settings, {
    handleGenerate,
    handleGenerateQuickVibes,
    handleRefineQuickVibes,
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
    handleConversionComplete,
  });
  const config: EditorConfig = useMemo(
    () => ({
      maxChars: APP_CONSTANTS.MAX_PROMPT_CHARS,
      currentModel,
      useLocalLLM,
    }),
    [currentModel, useLocalLLM]
  );

  return {
    output,
    input,
    generation,
    modes,
    quickVibes,
    creativeBoost,
    remix,
    handlers,
    config,
  };
}

export function PromptEditorContainer(): ReactElement {
  const { output, input, generation, modes, quickVibes, creativeBoost, remix, handlers, config } =
    usePromptEditorProps();

  return (
    <PromptEditor
      output={output}
      input={input}
      generation={generation}
      modes={modes}
      quickVibes={quickVibes}
      creativeBoost={creativeBoost}
      remix={remix}
      handlers={handlers}
      config={config}
    />
  );
}
