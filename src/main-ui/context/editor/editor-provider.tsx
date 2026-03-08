import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { rpcClient } from '@/services/rpc-client';
import { type MoodCategory } from '@bun/mood';
import { fireAndForget } from '@shared/fire-and-forget';
import { buildMusicPhrase } from '@shared/music-phrase';
import {
  type EditorMode,
  type AdvancedSelection,
  type QuickVibesInput,
  type PromptMode,
  type CreativeBoostInput,
  type CreativeBoostMode,
  EMPTY_ADVANCED_SELECTION,
  EMPTY_CREATIVE_BOOST_INPUT,
} from '@shared/types';

import { EditorActionsContext } from './editor-actions-context';
import { EditorStateContext } from './editor-state-context';
import { type EditorStateContextType, type EditorActionsContextType } from './types';
const EMPTY_QUICK_VIBES_INPUT: QuickVibesInput = {
  category: null,
  customDescription: '',
  sunoStyles: [],
  moodCategory: null,
};

type NullableAdvancedField =
  | 'harmonicStyle'
  | 'harmonicCombination'
  | 'polyrhythmCombination'
  | 'timeSignature'
  | 'timeSignatureJourney';
const MUTUALLY_EXCLUSIVE_FIELDS: [NullableAdvancedField, NullableAdvancedField][] = [
  ['harmonicStyle', 'harmonicCombination'],
  ['timeSignature', 'timeSignatureJourney'],
];
const PROMPT_MODES = ['full', 'quickVibes', 'creativeBoost'] as const;
const CREATIVE_BOOST_MODES = ['simple', 'advanced'] as const;

function isPromptMode(value: string): value is PromptMode {
  return PROMPT_MODES.includes(value as PromptMode);
}

function isCreativeBoostMode(value: string): value is CreativeBoostMode {
  return CREATIVE_BOOST_MODES.includes(value as CreativeBoostMode);
}

interface EditorProviderProps {
  children: ReactNode;
}

interface PersistedModes {
  creativeBoostMode: CreativeBoostMode;
  promptMode: PromptMode;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setPromptMode: (mode: PromptMode) => void;
}

interface QuickVibesState {
  getQuickVibesInput: () => QuickVibesInput;
  quickVibesInput: QuickVibesInput;
  resetQuickVibesInput: () => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
}

interface CreativeBoostState {
  creativeBoostInput: CreativeBoostInput;
  resetCreativeBoostInput: () => void;
  setCreativeBoostInput: Dispatch<SetStateAction<CreativeBoostInput>>;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
}

interface AdvancedSelectionState {
  advancedSelection: AdvancedSelection;
  clearAdvancedSelection: () => void;
  setAdvancedSelection: Dispatch<SetStateAction<AdvancedSelection>>;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
}

interface CurrentRef<T> {
  current: T;
}

function createEditorStateValue(state: EditorStateContextType): EditorStateContextType {
  return state;
}

function createEditorActionsValue(actions: EditorActionsContextType): EditorActionsContextType {
  return actions;
}

interface EditorContextValuesInput {
  advancedSelection: AdvancedSelection;
  clearAdvancedSelection: () => void;
  computedMusicPhrase: string;
  creativeBoostInput: CreativeBoostInput;
  creativeBoostMode: CreativeBoostMode;
  editorMode: EditorMode;
  getEffectiveLockedPhrase: () => string | undefined;
  getQuickVibesInput: () => QuickVibesInput;
  lockedPhrase: string;
  lyricsTopic: string;
  moodCategory: MoodCategory | null;
  pendingInput: string;
  promptMode: PromptMode;
  quickVibesInput: QuickVibesInput;
  resetCreativeBoostInput: () => void;
  resetEditor: () => void;
  resetQuickVibesInput: () => void;
  setAdvancedSelection: Dispatch<SetStateAction<AdvancedSelection>>;
  setCreativeBoostInput: Dispatch<SetStateAction<CreativeBoostInput>>;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  setLockedPhrase: Dispatch<SetStateAction<string>>;
  setLyricsTopic: Dispatch<SetStateAction<string>>;
  setMoodCategory: Dispatch<SetStateAction<MoodCategory | null>>;
  setPendingInput: Dispatch<SetStateAction<string>>;
  setPromptMode: (mode: PromptMode) => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
}

function useEditorContextValues(input: EditorContextValuesInput): {
  actionsValue: EditorActionsContextType;
  stateValue: EditorStateContextType;
} {
  const stateValue = useMemo<EditorStateContextType>(
    () =>
      createEditorStateValue({
        editorMode: input.editorMode,
        promptMode: input.promptMode,
        creativeBoostMode: input.creativeBoostMode,
        advancedSelection: input.advancedSelection,
        lockedPhrase: input.lockedPhrase,
        pendingInput: input.pendingInput,
        lyricsTopic: input.lyricsTopic,
        moodCategory: input.moodCategory,
        computedMusicPhrase: input.computedMusicPhrase,
        quickVibesInput: input.quickVibesInput,
        creativeBoostInput: input.creativeBoostInput,
      }),
    [
      input.advancedSelection,
      input.computedMusicPhrase,
      input.creativeBoostInput,
      input.creativeBoostMode,
      input.editorMode,
      input.lockedPhrase,
      input.lyricsTopic,
      input.moodCategory,
      input.pendingInput,
      input.promptMode,
      input.quickVibesInput,
    ]
  );

  const actionsValue = useMemo<EditorActionsContextType>(
    () =>
      createEditorActionsValue({
        setEditorMode: input.setEditorMode,
        setPromptMode: input.setPromptMode,
        setCreativeBoostMode: input.setCreativeBoostMode,
        setAdvancedSelection: input.setAdvancedSelection,
        updateAdvancedSelection: input.updateAdvancedSelection,
        clearAdvancedSelection: input.clearAdvancedSelection,
        setLockedPhrase: input.setLockedPhrase,
        setPendingInput: input.setPendingInput,
        setLyricsTopic: input.setLyricsTopic,
        setMoodCategory: input.setMoodCategory,
        setQuickVibesInput: input.setQuickVibesInput,
        setCreativeBoostInput: input.setCreativeBoostInput,
        updateCreativeBoostInput: input.updateCreativeBoostInput,
        resetCreativeBoostInput: input.resetCreativeBoostInput,
        getEffectiveLockedPhrase: input.getEffectiveLockedPhrase,
        resetEditor: input.resetEditor,
        resetQuickVibesInput: input.resetQuickVibesInput,
        getQuickVibesInput: input.getQuickVibesInput,
      }),
    [
      input.clearAdvancedSelection,
      input.getEffectiveLockedPhrase,
      input.getQuickVibesInput,
      input.resetCreativeBoostInput,
      input.resetEditor,
      input.resetQuickVibesInput,
      input.setAdvancedSelection,
      input.setCreativeBoostInput,
      input.setCreativeBoostMode,
      input.setEditorMode,
      input.setLockedPhrase,
      input.setLyricsTopic,
      input.setMoodCategory,
      input.setPendingInput,
      input.setPromptMode,
      input.setQuickVibesInput,
      input.updateAdvancedSelection,
      input.updateCreativeBoostInput,
    ]
  );

  return { stateValue, actionsValue };
}

function persistModeChange<TMode extends string>(
  mode: TMode,
  saveMode: Promise<
    { ok: true; value: { success: boolean } } | { ok: false; error: { message: string } }
  >,
  modeRef: CurrentRef<TMode>,
  requestIdRef: CurrentRef<number>,
  setModeState: (mode: TMode) => void,
  context: string
): void {
  const previousMode = modeRef.current;
  requestIdRef.current += 1;
  const requestId = requestIdRef.current;

  setModeState(mode);
  modeRef.current = mode;

  fireAndForget(
    saveMode.then((result) => {
      if (!result.ok && requestIdRef.current === requestId) {
        setModeState(previousMode);
        modeRef.current = previousMode;
        throw new Error(result.error.message);
      }
    }),
    context
  );
}

function loadPersistedModes(
  setPromptModeState: (mode: PromptMode) => void,
  setCreativeBoostModeState: (mode: CreativeBoostMode) => void
): void {
  fireAndForget(
    rpcClient.getPromptMode({}).then((result) => {
      const promptMode =
        result.ok && isPromptMode(result.value.promptMode) ? result.value.promptMode : 'full';
      setPromptModeState(promptMode);
    }),
    'loadPromptMode'
  );

  fireAndForget(
    rpcClient.getCreativeBoostMode({}).then((result) => {
      const creativeBoostMode =
        result.ok && isCreativeBoostMode(result.value.creativeBoostMode)
          ? result.value.creativeBoostMode
          : 'simple';
      setCreativeBoostModeState(creativeBoostMode);
    }),
    'loadCreativeBoostMode'
  );
}

function usePersistedModes(): PersistedModes {
  const [promptMode, setPromptModeState] = useState<PromptMode>('full');
  const [creativeBoostMode, setCreativeBoostModeState] = useState<CreativeBoostMode>('simple');
  const promptModeRef = useRef(promptMode);
  promptModeRef.current = promptMode;
  const creativeBoostModeRef = useRef(creativeBoostMode);
  creativeBoostModeRef.current = creativeBoostMode;
  const promptModeRequestIdRef = useRef(0);
  const creativeBoostModeRequestIdRef = useRef(0);

  useEffect(() => {
    loadPersistedModes(setPromptModeState, setCreativeBoostModeState);
  }, []);

  const setPromptMode = useCallback((mode: PromptMode) => {
    persistModeChange(
      mode,
      rpcClient.setPromptMode({ promptMode: mode }),
      promptModeRef,
      promptModeRequestIdRef,
      setPromptModeState,
      'setPromptMode'
    );
  }, []);

  const setCreativeBoostMode = useCallback((mode: CreativeBoostMode) => {
    persistModeChange(
      mode,
      rpcClient.setCreativeBoostMode({ creativeBoostMode: mode }),
      creativeBoostModeRef,
      creativeBoostModeRequestIdRef,
      setCreativeBoostModeState,
      'setCreativeBoostMode'
    );
  }, []);

  return {
    promptMode,
    creativeBoostMode,
    setPromptMode,
    setCreativeBoostMode,
  };
}

function useQuickVibesState(): QuickVibesState {
  const [quickVibesInput, setQuickVibesInputState] =
    useState<QuickVibesInput>(EMPTY_QUICK_VIBES_INPUT);
  const quickVibesInputRef = useRef<QuickVibesInput>(EMPTY_QUICK_VIBES_INPUT);

  const setQuickVibesInput = useCallback((input: QuickVibesInput) => {
    quickVibesInputRef.current = input;
    setQuickVibesInputState(input);
  }, []);

  const getQuickVibesInput = useCallback((): QuickVibesInput => quickVibesInputRef.current, []);
  const resetQuickVibesInput = useCallback(() => {
    setQuickVibesInput(EMPTY_QUICK_VIBES_INPUT);
  }, [setQuickVibesInput]);

  return {
    quickVibesInput,
    setQuickVibesInput,
    getQuickVibesInput,
    resetQuickVibesInput,
  };
}

function useCreativeBoostState(): CreativeBoostState {
  const [creativeBoostInput, setCreativeBoostInput] = useState<CreativeBoostInput>(
    EMPTY_CREATIVE_BOOST_INPUT
  );

  const updateCreativeBoostInput = useCallback((updates: Partial<CreativeBoostInput>) => {
    setCreativeBoostInput((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCreativeBoostInput = useCallback(() => {
    setCreativeBoostInput(EMPTY_CREATIVE_BOOST_INPUT);
  }, []);

  return {
    creativeBoostInput,
    setCreativeBoostInput,
    updateCreativeBoostInput,
    resetCreativeBoostInput,
  };
}

function useAdvancedSelectionState(): AdvancedSelectionState {
  const [advancedSelection, setAdvancedSelection] =
    useState<AdvancedSelection>(EMPTY_ADVANCED_SELECTION);

  const updateAdvancedSelection = useCallback((updates: Partial<AdvancedSelection>) => {
    setAdvancedSelection((prev) => {
      const next = { ...prev, ...updates };
      for (const [fieldA, fieldB] of MUTUALLY_EXCLUSIVE_FIELDS) {
        if (updates[fieldA] !== undefined && updates[fieldA] !== null) next[fieldB] = null;
        else if (updates[fieldB] !== undefined && updates[fieldB] !== null) next[fieldA] = null;
      }
      return next;
    });
  }, []);

  const clearAdvancedSelection = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION);
  }, []);

  return {
    advancedSelection,
    setAdvancedSelection,
    updateAdvancedSelection,
    clearAdvancedSelection,
  };
}

/**
 * Combined provider that wraps children with both state and actions contexts.
 * This provides backward compatibility while enabling performance optimizations.
 */
export function EditorProvider({ children }: EditorProviderProps): ReactElement {
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const { promptMode, creativeBoostMode, setPromptMode, setCreativeBoostMode } =
    usePersistedModes();
  const {
    advancedSelection,
    setAdvancedSelection,
    updateAdvancedSelection,
    clearAdvancedSelection,
  } = useAdvancedSelectionState();
  const [lockedPhrase, setLockedPhrase] = useState('');
  const [pendingInput, setPendingInput] = useState('');
  const [lyricsTopic, setLyricsTopic] = useState('');
  const [moodCategory, setMoodCategory] = useState<MoodCategory | null>(null);
  const { quickVibesInput, setQuickVibesInput, resetQuickVibesInput, getQuickVibesInput } =
    useQuickVibesState();
  const {
    creativeBoostInput,
    setCreativeBoostInput,
    updateCreativeBoostInput,
    resetCreativeBoostInput,
  } = useCreativeBoostState();

  const computedMusicPhrase = useMemo(
    () => buildMusicPhrase(advancedSelection),
    [advancedSelection]
  );

  const getEffectiveLockedPhrase = useCallback(() => {
    return editorMode === 'advanced'
      ? [computedMusicPhrase, lockedPhrase.trim()].filter(Boolean).join(', ') || undefined
      : lockedPhrase.trim() || undefined;
  }, [editorMode, computedMusicPhrase, lockedPhrase]);

  const resetEditor = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION);
    setLockedPhrase('');
    setPendingInput('');
    setLyricsTopic('');
    setMoodCategory(null);
    resetQuickVibesInput();
    resetCreativeBoostInput();
  }, [resetCreativeBoostInput, resetQuickVibesInput, setAdvancedSelection]);

  const { stateValue, actionsValue } = useEditorContextValues({
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
    setEditorMode,
    setPromptMode,
    setCreativeBoostMode,
    setAdvancedSelection,
    updateAdvancedSelection,
    clearAdvancedSelection,
    setLockedPhrase,
    setPendingInput,
    setLyricsTopic,
    setMoodCategory,
    setQuickVibesInput,
    setCreativeBoostInput,
    updateCreativeBoostInput,
    resetCreativeBoostInput,
    getEffectiveLockedPhrase,
    resetEditor,
    resetQuickVibesInput,
    getQuickVibesInput,
  });

  return (
    <EditorStateContext.Provider value={stateValue}>
      <EditorActionsContext.Provider value={actionsValue}>{children}</EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
}
