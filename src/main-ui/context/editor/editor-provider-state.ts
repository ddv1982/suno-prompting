import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { rpcClient } from '@/services/rpc-client';
import { fireAndForget } from '@shared/fire-and-forget';
import {
  type AdvancedSelection,
  type CreativeBoostInput,
  type CreativeBoostMode,
  EMPTY_ADVANCED_SELECTION,
  EMPTY_CREATIVE_BOOST_INPUT,
  type PromptMode,
  type QuickVibesInput,
} from '@shared/types';

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

export interface PersistedModes {
  creativeBoostMode: CreativeBoostMode;
  promptMode: PromptMode;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setPromptMode: (mode: PromptMode) => void;
}

export interface QuickVibesState {
  getQuickVibesInput: () => QuickVibesInput;
  quickVibesInput: QuickVibesInput;
  resetQuickVibesInput: () => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
}

export interface CreativeBoostState {
  creativeBoostInput: CreativeBoostInput;
  resetCreativeBoostInput: () => void;
  setCreativeBoostInput: Dispatch<SetStateAction<CreativeBoostInput>>;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
}

export interface AdvancedSelectionState {
  advancedSelection: AdvancedSelection;
  clearAdvancedSelection: () => void;
  setAdvancedSelection: Dispatch<SetStateAction<AdvancedSelection>>;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
}

interface CurrentRef<T> {
  current: T;
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

export function usePersistedModes(): PersistedModes {
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

export function useQuickVibesState(): QuickVibesState {
  const [quickVibesInput, setQuickVibesInputState] = useState(EMPTY_QUICK_VIBES_INPUT);
  const quickVibesInputRef = useRef(EMPTY_QUICK_VIBES_INPUT);

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

export function useCreativeBoostState(): CreativeBoostState {
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

export function useAdvancedSelectionState(): AdvancedSelectionState {
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
