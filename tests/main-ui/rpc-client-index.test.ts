import { afterEach, describe, expect, mock, test } from 'bun:test';

import { installGlobalModuleMocks } from '../setup';

const requestMock = mock(async (_method: string, _params: unknown) => ({ ok: true, value: {} }));

interface RpcClientMethodCase {
  clientMethod: string;
  rpcMethod: string;
  params: Record<string, unknown>;
}

const methodCases: RpcClientMethodCase[] = [
  { clientMethod: 'getHistory', rpcMethod: 'getHistory', params: { case: 'getHistory' } },
  { clientMethod: 'saveSession', rpcMethod: 'saveSession', params: { case: 'saveSession' } },
  { clientMethod: 'deleteSession', rpcMethod: 'deleteSession', params: { case: 'deleteSession' } },
  {
    clientMethod: 'generateInitial',
    rpcMethod: 'generateInitial',
    params: { case: 'generateInitial' },
  },
  { clientMethod: 'refinePrompt', rpcMethod: 'refinePrompt', params: { case: 'refinePrompt' } },
  {
    clientMethod: 'remixInstruments',
    rpcMethod: 'remixInstruments',
    params: { case: 'remixInstruments' },
  },
  { clientMethod: 'remixGenre', rpcMethod: 'remixGenre', params: { case: 'remixGenre' } },
  { clientMethod: 'remixMood', rpcMethod: 'remixMood', params: { case: 'remixMood' } },
  {
    clientMethod: 'remixStyleTags',
    rpcMethod: 'remixStyleTags',
    params: { case: 'remixStyleTags' },
  },
  {
    clientMethod: 'remixRecording',
    rpcMethod: 'remixRecording',
    params: { case: 'remixRecording' },
  },
  { clientMethod: 'remixTitle', rpcMethod: 'remixTitle', params: { case: 'remixTitle' } },
  { clientMethod: 'remixLyrics', rpcMethod: 'remixLyrics', params: { case: 'remixLyrics' } },
  { clientMethod: 'getApiKey', rpcMethod: 'getApiKey', params: { case: 'getApiKey' } },
  { clientMethod: 'setApiKey', rpcMethod: 'setApiKey', params: { case: 'setApiKey' } },
  { clientMethod: 'getModel', rpcMethod: 'getModel', params: { case: 'getModel' } },
  { clientMethod: 'setModel', rpcMethod: 'setModel', params: { case: 'setModel' } },
  { clientMethod: 'getSunoTags', rpcMethod: 'getSunoTags', params: { case: 'getSunoTags' } },
  { clientMethod: 'setSunoTags', rpcMethod: 'setSunoTags', params: { case: 'setSunoTags' } },
  { clientMethod: 'getDebugMode', rpcMethod: 'getDebugMode', params: { case: 'getDebugMode' } },
  { clientMethod: 'setDebugMode', rpcMethod: 'setDebugMode', params: { case: 'setDebugMode' } },
  {
    clientMethod: 'getAllSettings',
    rpcMethod: 'getAllSettings',
    params: { case: 'getAllSettings' },
  },
  {
    clientMethod: 'saveAllSettings',
    rpcMethod: 'saveAllSettings',
    params: { case: 'saveAllSettings' },
  },
  { clientMethod: 'getMaxMode', rpcMethod: 'getMaxMode', params: { case: 'getMaxMode' } },
  { clientMethod: 'setMaxMode', rpcMethod: 'setMaxMode', params: { case: 'setMaxMode' } },
  { clientMethod: 'getLyricsMode', rpcMethod: 'getLyricsMode', params: { case: 'getLyricsMode' } },
  { clientMethod: 'setLyricsMode', rpcMethod: 'setLyricsMode', params: { case: 'setLyricsMode' } },
  { clientMethod: 'getStoryMode', rpcMethod: 'getStoryMode', params: { case: 'getStoryMode' } },
  { clientMethod: 'setStoryMode', rpcMethod: 'setStoryMode', params: { case: 'setStoryMode' } },
  {
    clientMethod: 'getUseLocalLLM',
    rpcMethod: 'getUseLocalLLM',
    params: { case: 'getUseLocalLLM' },
  },
  {
    clientMethod: 'setUseLocalLLM',
    rpcMethod: 'setUseLocalLLM',
    params: { case: 'setUseLocalLLM' },
  },
  { clientMethod: 'getPromptMode', rpcMethod: 'getPromptMode', params: { case: 'getPromptMode' } },
  { clientMethod: 'setPromptMode', rpcMethod: 'setPromptMode', params: { case: 'setPromptMode' } },
  {
    clientMethod: 'getCreativeBoostMode',
    rpcMethod: 'getCreativeBoostMode',
    params: { case: 'getCreativeBoostMode' },
  },
  {
    clientMethod: 'setCreativeBoostMode',
    rpcMethod: 'setCreativeBoostMode',
    params: { case: 'setCreativeBoostMode' },
  },
  {
    clientMethod: 'generateQuickVibes',
    rpcMethod: 'generateQuickVibes',
    params: { case: 'generateQuickVibes' },
  },
  {
    clientMethod: 'refineQuickVibes',
    rpcMethod: 'refineQuickVibes',
    params: { case: 'refineQuickVibes' },
  },
  {
    clientMethod: 'convertToMaxFormat',
    rpcMethod: 'convertToMaxFormat',
    params: { case: 'convertToMaxFormat' },
  },
  {
    clientMethod: 'generateCreativeBoost',
    rpcMethod: 'generateCreativeBoost',
    params: { case: 'generateCreativeBoost' },
  },
  {
    clientMethod: 'refineCreativeBoost',
    rpcMethod: 'refineCreativeBoost',
    params: { case: 'refineCreativeBoost' },
  },
  {
    clientMethod: 'checkOllamaStatus',
    rpcMethod: 'checkOllamaStatus',
    params: { case: 'checkOllamaStatus' },
  },
  {
    clientMethod: 'getOllamaSettings',
    rpcMethod: 'getOllamaSettings',
    params: { case: 'getOllamaSettings' },
  },
  {
    clientMethod: 'setOllamaSettings',
    rpcMethod: 'setOllamaSettings',
    params: { case: 'setOllamaSettings' },
  },
];

async function loadRpcClientModule() {
  const clientSpecifier = new URL(
    '../../src/main-ui/services/rpc-client/client.ts',
    import.meta.url
  ).href;
  const factory = () => ({ request: requestMock });

  await mock.module(clientSpecifier, factory);

  const moduleUrl = new URL('../../src/main-ui/services/rpc-client/index.ts', import.meta.url).href;
  return import(`${moduleUrl}?rpc=${Date.now()}-${Math.random()}`);
}

describe('rpc-client/index wrappers', () => {
  afterEach(async () => {
    requestMock.mockReset();
    mock.restore();
    await installGlobalModuleMocks();
  });

  test('each wrapper forwards to request with the expected method and params', async () => {
    requestMock.mockReset();
    const { rpcClient } = await loadRpcClientModule();
    const rpcClientRecord = rpcClient as unknown as Record<
      string,
      (params: Record<string, unknown>) => Promise<unknown>
    >;

    for (const testCase of methodCases) {
      await rpcClientRecord[testCase.clientMethod]?.(testCase.params);
    }

    expect(requestMock).toHaveBeenCalledTimes(methodCases.length);

    for (const [index, testCase] of methodCases.entries()) {
      expect(requestMock.mock.calls[index]).toEqual([testCase.rpcMethod, testCase.params]);
    }
  });
});
