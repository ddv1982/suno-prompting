import { describe, expect, test } from 'bun:test';

describe('RPC wiring', () => {
  test('bun RPC request map includes Story Mode endpoints', async () => {
    const indexSource = await Bun.file(new URL('../src/bun/index.ts', import.meta.url)).text();

    expect(indexSource).toContain('getStoryMode: handlers.getStoryMode');
    expect(indexSource).toContain('setStoryMode: handlers.setStoryMode');
  });
});
