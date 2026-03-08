import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act } from 'react-test-renderer';

import { EMPTY_CREATIVE_BOOST_INPUT, type PromptSession } from '@shared/types';

import { flushMicrotasks, renderWithAct } from '../helpers/react-test-renderer';
import { installGlobalModuleMocks } from '../setup';

import type { EditorContextType } from '@/context/editor-context';
import type { SessionOperationsContextValue } from '@/context/generation/types';
import type { ReactNode } from 'react';

const baseVersion = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc010',
  content: 'prompt',
  timestamp: '2026-01-01T00:00:00Z',
};

const creativeBoostSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc011',
  originalInput: 'creative boost session',
  currentPrompt: 'prompt',
  versionHistory: [baseVersion],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  promptMode: 'creativeBoost',
  creativeBoostInput: {
    creativityLevel: 75,
    seedGenres: ['rock'],
    sunoStyles: [],
    description: 'desc',
    lyricsTopic: 'topic',
    moodCategory: null,
  },
};

const fullSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc012',
  originalInput: 'full session',
  currentPrompt: 'prompt',
  versionHistory: [baseVersion],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  promptMode: 'full',
};

const EMPTY_QUICK_VIBES_INPUT = {
  category: null,
  customDescription: '',
  sunoStyles: [],
  moodCategory: null,
};

type RpcResult<T> = { ok: true; value: T } | { ok: false; error: { message: string } };

interface RpcClientShape {
  getHistory: (params: Record<string, never>) => Promise<RpcResult<{ sessions: PromptSession[] }>>;
  saveSession: (params: { session: PromptSession }) => Promise<RpcResult<{ success: boolean }>>;
  deleteSession: (params: { id: string }) => Promise<RpcResult<{ success: boolean }>>;
  getPromptMode: (params: Record<string, never>) => Promise<RpcResult<{ promptMode: string }>>;
  setPromptMode: (params: { promptMode: string }) => Promise<RpcResult<{ success: boolean }>>;
  getCreativeBoostMode: (
    params: Record<string, never>
  ) => Promise<RpcResult<{ creativeBoostMode: string }>>;
  setCreativeBoostMode: (params: {
    creativeBoostMode: string;
  }) => Promise<RpcResult<{ success: boolean }>>;
}

let patchedRpcClient: RpcClientShape | null = null;
let originalGetHistory: RpcClientShape['getHistory'] | null = null;
let originalSaveSession: RpcClientShape['saveSession'] | null = null;
let originalDeleteSession: RpcClientShape['deleteSession'] | null = null;
let originalGetPromptMode: RpcClientShape['getPromptMode'] | null = null;
let originalSetPromptMode: RpcClientShape['setPromptMode'] | null = null;
let originalGetCreativeBoostMode: RpcClientShape['getCreativeBoostMode'] | null = null;
let originalSetCreativeBoostMode: RpcClientShape['setCreativeBoostMode'] | null = null;

async function mockElectrobunView(): Promise<void> {
  await mock.module('electrobun/view', () => ({
    Electroview: Object.assign(
      function ElectroviewMock(_config: unknown) {
        void _config;
      },
      {
        defineRPC() {
          return {
            request: async () => ({}),
            send: () => {},
          };
        },
      }
    ),
  }));
}

async function loadModules() {
  await mockElectrobunView();

  const rpcModuleUrl = new URL('../../src/main-ui/services/rpc-client/index.ts', import.meta.url)
    .href;
  const rpcModule = await import(rpcModuleUrl);
  const rpcClient = rpcModule.rpcClient as RpcClientShape;

  patchedRpcClient = rpcClient;
  originalGetHistory = rpcClient.getHistory;
  originalSaveSession = rpcClient.saveSession;
  originalDeleteSession = rpcClient.deleteSession;
  originalGetPromptMode = rpcClient.getPromptMode;
  originalSetPromptMode = rpcClient.setPromptMode;
  originalGetCreativeBoostMode = rpcClient.getCreativeBoostMode;
  originalSetCreativeBoostMode = rpcClient.setCreativeBoostMode;

  rpcClient.getHistory = async () => ({ ok: true, value: { sessions: [] } });
  rpcClient.saveSession = async () => ({ ok: true, value: { success: true } });
  rpcClient.deleteSession = async () => ({ ok: true, value: { success: true } });
  rpcClient.getPromptMode = async () => ({ ok: true, value: { promptMode: 'full' } });
  rpcClient.setPromptMode = async () => ({ ok: true, value: { success: true } });
  rpcClient.getCreativeBoostMode = async () => ({
    ok: true,
    value: { creativeBoostMode: 'simple' },
  });
  rpcClient.setCreativeBoostMode = async () => ({ ok: true, value: { success: true } });

  const editorModuleUrl = new URL('../../src/main-ui/context/editor-context.tsx', import.meta.url)
    .href;
  const sessionModuleUrl = new URL('../../src/main-ui/context/session-context.tsx', import.meta.url)
    .href;
  const generationStateModuleUrl = new URL(
    '../../src/main-ui/context/generation/generation-state-context.tsx',
    import.meta.url
  ).href;
  const sessionOperationsModuleUrl = new URL(
    '../../src/main-ui/context/generation/session-operations-context.tsx',
    import.meta.url
  ).href;

  const cacheBust = `${Date.now()}-${Math.random()}`;
  const editorModule = await import(`${editorModuleUrl}?session-operations=${cacheBust}`);
  const sessionModule = await import(`${sessionModuleUrl}?session-operations=${cacheBust}`);
  const generationStateModule = await import(
    `${generationStateModuleUrl}?session-operations=${cacheBust}`
  );
  const sessionOperationsModule = await import(
    `${sessionOperationsModuleUrl}?session-operations=${cacheBust}`
  );

  return {
    EditorProvider: editorModule.EditorProvider as ({
      children,
    }: {
      children: ReactNode;
    }) => ReactNode,
    useEditorContext: editorModule.useEditorContext as () => EditorContextType,
    SessionProvider: sessionModule.SessionProvider as ({
      children,
    }: {
      children: ReactNode;
    }) => ReactNode,
    GenerationStateProvider: generationStateModule.GenerationStateProvider as ({
      children,
    }: {
      children: ReactNode;
    }) => ReactNode,
    SessionOperationsProvider: sessionOperationsModule.SessionOperationsProvider as ({
      children,
    }: {
      children: ReactNode;
    }) => ReactNode,
    useSessionOperationsContext:
      sessionOperationsModule.useSessionOperationsContext as () => SessionOperationsContextValue,
  };
}

beforeEach(async () => {
  mock.restore();
  await installGlobalModuleMocks();
});

afterEach(async () => {
  if (
    patchedRpcClient &&
    originalGetHistory &&
    originalSaveSession &&
    originalDeleteSession &&
    originalGetPromptMode &&
    originalSetPromptMode &&
    originalGetCreativeBoostMode &&
    originalSetCreativeBoostMode
  ) {
    patchedRpcClient.getHistory = originalGetHistory;
    patchedRpcClient.saveSession = originalSaveSession;
    patchedRpcClient.deleteSession = originalDeleteSession;
    patchedRpcClient.getPromptMode = originalGetPromptMode;
    patchedRpcClient.setPromptMode = originalSetPromptMode;
    patchedRpcClient.getCreativeBoostMode = originalGetCreativeBoostMode;
    patchedRpcClient.setCreativeBoostMode = originalSetCreativeBoostMode;
  }

  patchedRpcClient = null;
  originalGetHistory = null;
  originalSaveSession = null;
  originalDeleteSession = null;
  originalGetPromptMode = null;
  originalSetPromptMode = null;
  originalGetCreativeBoostMode = null;
  originalSetCreativeBoostMode = null;
  mock.restore();
  await installGlobalModuleMocks();
});

describe('SessionOperationsProvider', () => {
  test('selecting a creative boost session resets quick vibes state', async () => {
    const {
      EditorProvider,
      useEditorContext,
      SessionProvider,
      GenerationStateProvider,
      SessionOperationsProvider,
      useSessionOperationsContext,
    } = await loadModules();

    let latestContext: SessionOperationsContextValue | null = null;
    let latestEditorContext: EditorContextType | null = null;
    const getContext = (): SessionOperationsContextValue => {
      if (!latestContext) throw new Error('Session operations context not initialized');
      return latestContext;
    };
    const getEditorContext = (): EditorContextType => {
      if (!latestEditorContext) throw new Error('Editor context not initialized');
      return latestEditorContext;
    };

    function Probe(): ReactNode {
      latestContext = useSessionOperationsContext();
      latestEditorContext = useEditorContext();
      return null;
    }

    renderWithAct(
      createElement(
        EditorProvider,
        null,
        createElement(
          SessionProvider,
          null,
          createElement(
            GenerationStateProvider,
            null,
            createElement(SessionOperationsProvider, null, createElement(Probe))
          )
        )
      )
    );
    await flushMicrotasks(3);

    act(() => {
      getEditorContext().setQuickVibesInput({
        category: null,
        customDescription: 'queued quick vibes',
        sunoStyles: ['dreampop'],
        moodCategory: null,
      });
    });

    act(() => {
      getContext().selectSession(creativeBoostSession);
    });

    expect(getEditorContext().creativeBoostInput).toEqual(creativeBoostSession.creativeBoostInput!);
    expect(getEditorContext().quickVibesInput).toEqual(EMPTY_QUICK_VIBES_INPUT);
  });

  test('selecting a non-mode session resets both quick vibes and creative boost state', async () => {
    const {
      EditorProvider,
      useEditorContext,
      SessionProvider,
      GenerationStateProvider,
      SessionOperationsProvider,
      useSessionOperationsContext,
    } = await loadModules();

    let latestContext: SessionOperationsContextValue | null = null;
    let latestEditorContext: EditorContextType | null = null;
    const getContext = (): SessionOperationsContextValue => {
      if (!latestContext) throw new Error('Session operations context not initialized');
      return latestContext;
    };
    const getEditorContext = (): EditorContextType => {
      if (!latestEditorContext) throw new Error('Editor context not initialized');
      return latestEditorContext;
    };

    function Probe(): ReactNode {
      latestContext = useSessionOperationsContext();
      latestEditorContext = useEditorContext();
      return null;
    }

    renderWithAct(
      createElement(
        EditorProvider,
        null,
        createElement(
          SessionProvider,
          null,
          createElement(
            GenerationStateProvider,
            null,
            createElement(SessionOperationsProvider, null, createElement(Probe))
          )
        )
      )
    );
    await flushMicrotasks(3);

    act(() => {
      getEditorContext().setQuickVibesInput({
        category: null,
        customDescription: 'queued quick vibes',
        sunoStyles: ['dreampop'],
        moodCategory: null,
      });
      getEditorContext().setCreativeBoostInput({
        creativityLevel: 100,
        seedGenres: ['rock'],
        sunoStyles: [],
        description: 'stale creative boost state',
        lyricsTopic: 'topic',
        moodCategory: null,
      });
    });

    act(() => {
      getContext().selectSession(fullSession);
    });

    expect(getEditorContext().quickVibesInput).toEqual(EMPTY_QUICK_VIBES_INPUT);
    expect(getEditorContext().creativeBoostInput).toEqual(EMPTY_CREATIVE_BOOST_INPUT);
  });
});
