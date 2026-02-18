import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act, type ReactTestInstance } from 'react-test-renderer';

import { flushMicrotasks, renderWithAct } from '../helpers/react-test-renderer';
import { installGlobalModuleMocks } from '../setup';

import type { APIKeys, TraceEvent, TraceRun } from '@shared/types';
import type { ReactNode } from 'react';

type RpcResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

interface RpcClientShape {
  getAllSettings: (params: Record<string, never>) => Promise<RpcResult<unknown>>;
  saveAllSettings: (params: unknown) => Promise<RpcResult<unknown>>;
  getOllamaSettings: (params: Record<string, never>) => Promise<RpcResult<unknown>>;
  setOllamaSettings: (params: unknown) => Promise<RpcResult<unknown>>;
}

const onCloseMock = mock(() => {});
const getAllSettingsMock = mock((_params: Record<string, never>) => {});
const saveAllSettingsMock = mock((_params: unknown) => {});
const getOllamaSettingsMock = mock((_params: Record<string, never>) => {});
const setOllamaSettingsMock = mock((_params: unknown) => {});
const copyJsonMock = mock(async (_value: string) => {});
const copyTextMock = mock(async (_value: string) => {});

const apiKeys: APIKeys = {
  groq: 'groq-key',
  openai: null,
  anthropic: null,
};

let patchedRpcClient: RpcClientShape | null = null;
let originalGetAllSettings: RpcClientShape['getAllSettings'] | null = null;
let originalSaveAllSettings: RpcClientShape['saveAllSettings'] | null = null;
let originalGetOllamaSettings: RpcClientShape['getOllamaSettings'] | null = null;
let originalSetOllamaSettings: RpcClientShape['setOllamaSettings'] | null = null;

function resetAllMocks(): void {
  onCloseMock.mockReset();
  getAllSettingsMock.mockReset();
  saveAllSettingsMock.mockReset();
  getOllamaSettingsMock.mockReset();
  setOllamaSettingsMock.mockReset();
  copyJsonMock.mockReset();
  copyTextMock.mockReset();
}

async function mockDialogAndButtonPrimitives(): Promise<void> {
  const dialogSpecifier = new URL('../../src/main-ui/components/ui/dialog.tsx', import.meta.url)
    .href;
  const buttonSpecifier = new URL('../../src/main-ui/components/ui/button.tsx', import.meta.url)
    .href;

  const dialogFactory = () => ({
    Dialog: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    DialogContent: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    DialogFooter: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    DialogHeader: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    DialogTitle: ({ children }: { children: ReactNode }) => createElement('h2', null, children),
  });

  const buttonFactory = () => ({
    Button: ({
      children,
      onClick,
      disabled,
      variant,
    }: {
      children: ReactNode;
      onClick?: () => Promise<void> | void;
      disabled?: boolean;
      variant?: string;
    }) => createElement('button', { onClick, disabled, 'data-variant': variant }, children),
  });

  await mock.module('@/components/ui/dialog', dialogFactory);
  await mock.module(dialogSpecifier, dialogFactory);
  await mock.module('@/components/ui/button', buttonFactory);
  await mock.module(buttonSpecifier, buttonFactory);
}

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

function hasText(node: ReactTestInstance, text: string): boolean {
  return node.children.some((child) => typeof child === 'string' && child.includes(text));
}

function extractNodeText(node: ReactTestInstance): string {
  return node.children
    .map((child) => (typeof child === 'string' ? child : extractNodeText(child)))
    .join('');
}

function createTraceRun(overrides: Partial<TraceRun> = {}): TraceRun {
  const events: TraceEvent[] = [
    {
      id: 'event-3',
      ts: '2026-02-18T00:00:03.000Z',
      tMs: 220,
      type: 'run.end',
      summary: 'run finished',
    },
    {
      id: 'event-1',
      ts: '2026-02-18T00:00:01.000Z',
      tMs: 40,
      type: 'decision',
      domain: 'genre',
      key: 'genre-pick',
      branchTaken: 'fallback',
      why: 'selected deterministic fallback',
    },
    {
      id: 'event-2',
      ts: '2026-02-18T00:00:02.000Z',
      tMs: 120,
      type: 'error',
      error: {
        type: 'validation',
        message: 'invalid input',
      },
    },
  ];

  return {
    version: 1,
    runId: 'run-1',
    capturedAt: '2026-02-18T00:00:00.000Z',
    action: 'generate.full',
    promptMode: 'full',
    rng: {
      seed: 42,
      algorithm: 'mulberry32',
    },
    stats: {
      eventCount: events.length,
      llmCallCount: 0,
      decisionCount: 1,
      hadErrors: true,
      persistedBytes: 1200,
      truncatedForCap: true,
    },
    events,
    ...overrides,
  };
}

async function loadSettingsModalModule() {
  await mockDialogAndButtonPrimitives();
  await mockElectrobunView();

  const rpcModuleUrl = new URL('../../src/main-ui/services/rpc-client/index.ts', import.meta.url)
    .href;
  const rpcModule = await import(rpcModuleUrl);
  const rpcClient = rpcModule.rpcClient as RpcClientShape;

  patchedRpcClient = rpcClient;
  originalGetAllSettings = rpcClient.getAllSettings;
  originalSaveAllSettings = rpcClient.saveAllSettings;
  originalGetOllamaSettings = rpcClient.getOllamaSettings;
  originalSetOllamaSettings = rpcClient.setOllamaSettings;

  rpcClient.getAllSettings = async (params: Record<string, never>) => {
    getAllSettingsMock(params);
    return {
      ok: true,
      value: {
        provider: 'groq',
        apiKeys,
        model: 'groq/llama-3.3-70b-versatile',
        useSunoTags: false,
        debugMode: false,
        maxMode: false,
        lyricsMode: true,
        storyMode: true,
        useLocalLLM: true,
      },
    };
  };

  rpcClient.saveAllSettings = async (params: unknown) => {
    saveAllSettingsMock(params);
    return { ok: true, value: { success: true } };
  };

  rpcClient.getOllamaSettings = async (params: Record<string, never>) => {
    getOllamaSettingsMock(params);
    return {
      ok: true,
      value: {
        endpoint: 'http://127.0.0.1:11434',
        temperature: 0.7,
        maxTokens: 2000,
        contextLength: 4096,
      },
    };
  };

  rpcClient.setOllamaSettings = async (params: unknown) => {
    setOllamaSettingsMock(params);
    return { ok: true, value: { success: true } };
  };

  const moduleUrl = new URL(
    '../../src/main-ui/components/settings-modal/settings-modal.tsx',
    import.meta.url
  ).href;
  return import(`${moduleUrl}?settings=${Date.now()}-${Math.random()}`);
}

async function loadDebugDrawerModule() {
  await mockDialogAndButtonPrimitives();

  const copyHookSpecifier = new URL(
    '../../src/main-ui/hooks/use-copy-to-clipboard.ts',
    import.meta.url
  ).href;
  const badgeSpecifier = new URL('../../src/main-ui/components/ui/badge.tsx', import.meta.url).href;
  const scrollAreaSpecifier = new URL(
    '../../src/main-ui/components/ui/scroll-area.tsx',
    import.meta.url
  ).href;
  const tooltipSpecifier = new URL('../../src/main-ui/components/ui/tooltip.tsx', import.meta.url)
    .href;

  let hookCalls = 0;
  const copyHookFactory = () => ({
    useCopyToClipboard: () => {
      hookCalls += 1;
      return hookCalls === 1
        ? { copied: false, copy: copyJsonMock }
        : { copied: false, copy: copyTextMock };
    },
  });

  const badgeFactory = () => ({
    Badge: ({ children }: { children: ReactNode }) => createElement('span', null, children),
  });

  const scrollAreaFactory = () => ({
    ScrollArea: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  });

  const tooltipFactory = () => ({
    Tooltip: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    TooltipTrigger: ({ children }: { children: ReactNode }) => createElement('div', null, children),
    TooltipContent: ({ children }: { children: ReactNode }) =>
      createElement('span', null, children),
  });

  await mock.module('@/hooks/use-copy-to-clipboard', copyHookFactory);
  await mock.module(copyHookSpecifier, copyHookFactory);
  await mock.module('@/components/ui/badge', badgeFactory);
  await mock.module(badgeSpecifier, badgeFactory);
  await mock.module('@/components/ui/scroll-area', scrollAreaFactory);
  await mock.module(scrollAreaSpecifier, scrollAreaFactory);
  await mock.module('@/components/ui/tooltip', tooltipFactory);
  await mock.module(tooltipSpecifier, tooltipFactory);

  const moduleUrl = new URL(
    '../../src/main-ui/components/prompt-editor/debug-drawer/debug-drawer.tsx',
    import.meta.url
  ).href;

  return import(`${moduleUrl}?debug=${Date.now()}-${Math.random()}`);
}

beforeEach(async () => {
  mock.restore();
  await installGlobalModuleMocks();
  resetAllMocks();
});

afterEach(async () => {
  if (
    patchedRpcClient &&
    originalGetAllSettings &&
    originalSaveAllSettings &&
    originalGetOllamaSettings &&
    originalSetOllamaSettings
  ) {
    patchedRpcClient.getAllSettings = originalGetAllSettings;
    patchedRpcClient.saveAllSettings = originalSaveAllSettings;
    patchedRpcClient.getOllamaSettings = originalGetOllamaSettings;
    patchedRpcClient.setOllamaSettings = originalSetOllamaSettings;
  }

  patchedRpcClient = null;
  originalGetAllSettings = null;
  originalSaveAllSettings = null;
  originalGetOllamaSettings = null;
  originalSetOllamaSettings = null;
  mock.restore();
  await installGlobalModuleMocks();
});

describe('settings modal behavior wiring', () => {
  test('loads settings, wires controls to state actions, and saves updated values', async () => {
    const { SettingsModal } = await loadSettingsModalModule();
    const renderer = renderWithAct(
      createElement(SettingsModal, { isOpen: true, onClose: onCloseMock })
    );

    await flushMicrotasks(3);

    const selects = renderer.root.findAllByType('select');
    expect(selects).toHaveLength(2);

    await act(async () => {
      selects[0]!.props.onChange({ target: { value: 'openai' } });
      selects[1]!.props.onChange({ target: { value: 'openai/gpt-4.1-mini' } });
    });

    const apiInput = renderer.root.find(
      (node) =>
        node.type === 'input' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('pr-10')
    );

    await act(async () => {
      apiInput.props.onChange({ target: { value: 'new-openai-key' } });
    });

    const switchIds = [
      'use-local-llm',
      'settings-suno-tags',
      'settings-max-mode',
      'settings-lyrics-mode',
      'settings-story-mode',
      'settings-debug-mode',
    ];

    for (const switchId of switchIds) {
      const switchButton = renderer.root.find(
        (node) => node.type === 'button' && node.props.id === switchId
      );
      await act(async () => {
        switchButton.props.onClick();
      });
    }

    const saveButton = renderer.root.find(
      (node) => node.type === 'button' && hasText(node, 'Save Changes')
    );

    await act(async () => {
      await saveButton.props.onClick();
    });

    expect(getAllSettingsMock).toHaveBeenCalledTimes(1);
    expect(getOllamaSettingsMock).toHaveBeenCalledTimes(1);
    expect(saveAllSettingsMock).toHaveBeenCalledTimes(1);
    expect(saveAllSettingsMock).toHaveBeenCalledWith({
      provider: 'openai',
      model: 'openai/gpt-4.1-mini',
      useSunoTags: true,
      debugMode: true,
      maxMode: true,
      lyricsMode: false,
      storyMode: false,
      useLocalLLM: false,
      apiKeys: {
        groq: 'groq-key',
        openai: 'new-openai-key',
        anthropic: null,
      },
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe('debug drawer behavior', () => {
  test('sorts timeline events and routes copy actions', async () => {
    const { DebugDrawerBody } = await loadDebugDrawerModule();
    const debugTrace = createTraceRun();

    const renderer = renderWithAct(createElement(DebugDrawerBody, { debugTrace }));

    const timestampNodes = renderer.root.findAll(
      (node) =>
        node.type === 'div' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('font-mono mb-1')
    );

    const timestampLabels = timestampNodes.map((node) => extractNodeText(node));
    expect(timestampLabels).toEqual(['+40ms', '+120ms', '+220ms']);

    expect(
      renderer.root.findAll((node) => node.type === 'span' && hasText(node, 'Trace was compacted'))
        .length
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll(
        (node) => node.type === 'span' && hasText(node, 'This run encountered errors')
      ).length
    ).toBeGreaterThan(0);

    const jsonButton = renderer.root.find(
      (node) => node.type === 'button' && node.children.some((child) => child === 'JSON')
    );
    const summaryButton = renderer.root.find(
      (node) => node.type === 'button' && node.children.some((child) => child === 'Summary')
    );

    await act(async () => {
      await jsonButton.props.onClick();
      await summaryButton.props.onClick();
    });

    expect(copyJsonMock).toHaveBeenCalledWith(JSON.stringify(debugTrace, null, 2));
    expect(copyTextMock).toHaveBeenCalledTimes(1);
    const summaryOutput = copyTextMock.mock.calls[0]?.[0];
    expect(typeof summaryOutput).toBe('string');
    if (typeof summaryOutput === 'string') {
      expect(summaryOutput).toContain('Run: Generate (Full)');
    }
  });

  test('renders empty-state branch when no events are present', async () => {
    const { DebugDrawerBody } = await loadDebugDrawerModule();
    const debugTrace = createTraceRun({
      stats: {
        eventCount: 0,
        llmCallCount: 0,
        decisionCount: 0,
        hadErrors: false,
        persistedBytes: 64,
        truncatedForCap: false,
      },
      events: [],
    });

    const renderer = renderWithAct(createElement(DebugDrawerBody, { debugTrace }));

    expect(
      renderer.root.findAll((node) => node.type === 'div' && hasText(node, 'No events recorded'))
        .length
    ).toBe(1);
    expect(
      renderer.root.findAll((node) => node.type === 'span' && hasText(node, 'Trace was compacted'))
        .length
    ).toBe(0);
    expect(
      renderer.root.findAll(
        (node) => node.type === 'span' && hasText(node, 'This run encountered errors')
      ).length
    ).toBe(0);
  });
});
