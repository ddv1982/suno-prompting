import { describe, expect, test } from 'bun:test';

import { RpcClientError, unwrapOrThrowResult } from '../../src/main-ui/services/rpc-shim-error';

describe('rpc shim error', () => {
  test('RpcClientError preserves safe code and message', () => {
    const error = new RpcClientError({
      code: 'RPC_TIMEOUT',
      message: 'That took too long. Please try again.',
      details: { method: 'generateInitial', status: 408, hint: 'timeout' },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RpcClientError');
    expect(error.code).toBe('RPC_TIMEOUT');
    expect(error.message).toBe('That took too long. Please try again.');
    expect(error.details).toEqual({ method: 'generateInitial', status: 408, hint: 'timeout' });
  });

  test('unwrapOrThrowResult throws RpcClientError for Err', () => {
    expect(() =>
      unwrapOrThrowResult({
        ok: false,
        error: { code: 'RPC_UNAVAILABLE', message: 'Service is unavailable. Please try again.' },
      })
    ).toThrow(RpcClientError);
  });
});
