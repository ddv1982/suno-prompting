// Compatibility layer - combines all split contexts into a single useAppContext hook
// This allows existing components to continue working without changes

import { type EditorContextType, useEditorContext } from '@/context/editor-context';
import { type GenerationContextType, useGenerationContext } from '@/context/generation-context';
import { type SessionContextType, useSessionContext } from '@/context/session-context';
import { type SettingsContextType, useSettingsContext } from '@/context/settings-context';

// Re-export types for backwards compatibility
export type { GeneratingAction } from '@/context/generation-context';

// Re-export the new AppProvider
export { AppProvider } from '@/context/app-provider';

// Combined context type for backwards compatibility
type AppContextType = 
  & Pick<SessionContextType, 'sessions' | 'currentSession' | 'loadHistory' | 'saveSession' | 'deleteSession'>
  & Pick<SettingsContextType, 'currentModel' | 'maxMode' | 'lyricsMode' | 'settingsOpen' | 'setSettingsOpen' | 'setMaxMode' | 'setLyricsMode'>
  & Pick<EditorContextType, 'editorMode' | 'promptMode' | 'advancedSelection' | 'lockedPhrase' | 'pendingInput' | 'lyricsTopic' | 'computedMusicPhrase' | 'setEditorMode' | 'setPromptMode' | 'setAdvancedSelection' | 'updateAdvancedSelection' | 'clearAdvancedSelection' | 'setLockedPhrase' | 'setPendingInput' | 'setLyricsTopic' | 'quickVibesInput' | 'withWordlessVocals' | 'setQuickVibesInput' | 'setWithWordlessVocals' | 'creativeBoostInput' | 'setCreativeBoostInput'>
  & Pick<GenerationContextType, 'isGenerating' | 'generatingAction' | 'chatMessages' | 'validation' | 'debugInfo' | 'setValidation' | 'selectSession' | 'newProject' | 'handleGenerate' | 'handleCopy' | 'handleRemix' | 'handleRemixInstruments' | 'handleRemixGenre' | 'handleRemixMood' | 'handleRemixStyleTags' | 'handleRemixRecording' | 'handleRemixTitle' | 'handleRemixLyrics' | 'handleGenerateQuickVibes' | 'handleRemixQuickVibes' | 'handleConversionComplete' | 'handleGenerateCreativeBoost' | 'handleRefineCreativeBoost'>;

// Backwards-compatible hook that combines all contexts
export const useAppContext = (): AppContextType => {
  const session = useSessionContext();
  const settings = useSettingsContext();
  const editor = useEditorContext();
  const generation = useGenerationContext();

  return {
    // Session
    sessions: session.sessions,
    currentSession: session.currentSession,
    loadHistory: session.loadHistory,
    saveSession: session.saveSession,
    deleteSession: session.deleteSession,
    
    // Settings
    currentModel: settings.currentModel,
    maxMode: settings.maxMode,
    lyricsMode: settings.lyricsMode,
    settingsOpen: settings.settingsOpen,
    setSettingsOpen: settings.setSettingsOpen,
    setMaxMode: settings.setMaxMode,
    setLyricsMode: settings.setLyricsMode,
    
    // Editor
    editorMode: editor.editorMode,
    promptMode: editor.promptMode,
    advancedSelection: editor.advancedSelection,
    lockedPhrase: editor.lockedPhrase,
    pendingInput: editor.pendingInput,
    lyricsTopic: editor.lyricsTopic,
    computedMusicPhrase: editor.computedMusicPhrase,
    setEditorMode: editor.setEditorMode,
    setPromptMode: editor.setPromptMode,
    setAdvancedSelection: editor.setAdvancedSelection,
    updateAdvancedSelection: editor.updateAdvancedSelection,
    clearAdvancedSelection: editor.clearAdvancedSelection,
    setLockedPhrase: editor.setLockedPhrase,
    setPendingInput: editor.setPendingInput,
    setLyricsTopic: editor.setLyricsTopic,
    quickVibesInput: editor.quickVibesInput,
    withWordlessVocals: editor.withWordlessVocals,
    setQuickVibesInput: editor.setQuickVibesInput,
    setWithWordlessVocals: editor.setWithWordlessVocals,
    creativeBoostInput: editor.creativeBoostInput,
    setCreativeBoostInput: editor.setCreativeBoostInput,
    
    // Generation
    isGenerating: generation.isGenerating,
    generatingAction: generation.generatingAction,
    chatMessages: generation.chatMessages,
    validation: generation.validation,
    debugInfo: generation.debugInfo,
    setValidation: generation.setValidation,
    selectSession: generation.selectSession,
    newProject: generation.newProject,
    handleGenerate: generation.handleGenerate,
    handleCopy: generation.handleCopy,
    handleRemix: generation.handleRemix,
    handleRemixInstruments: generation.handleRemixInstruments,
    handleRemixGenre: generation.handleRemixGenre,
    handleRemixMood: generation.handleRemixMood,
    handleRemixStyleTags: generation.handleRemixStyleTags,
    handleRemixRecording: generation.handleRemixRecording,
    handleRemixTitle: generation.handleRemixTitle,
    handleRemixLyrics: generation.handleRemixLyrics,
    handleGenerateQuickVibes: generation.handleGenerateQuickVibes,
    handleRemixQuickVibes: generation.handleRemixQuickVibes,
    handleConversionComplete: generation.handleConversionComplete,
    handleGenerateCreativeBoost: generation.handleGenerateCreativeBoost,
    handleRefineCreativeBoost: generation.handleRefineCreativeBoost,
  };
};
