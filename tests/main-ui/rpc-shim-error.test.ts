import { describe, expect, test } from 'bun:test';

import { mapToRpcError } from '../../src/main-ui/services/rpc-client/errors';
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

  test('mapToRpcError preserves ValidationError fieldErrors metadata', () => {
    const error = new Error('Too small') as Error & {
      fieldErrors?: Record<string, string[]>;
    };
    error.fieldErrors = { model: ['Too small: expected string to have >=1 characters'] };

    expect(mapToRpcError(error, { method: 'setModel' })).toEqual({
      code: 'RPC_VALIDATION',
      message: 'Some inputs are invalid. Please review and try again.',
      details: {
        method: 'setModel',
        fieldErrors: { model: ['Too small: expected string to have >=1 characters'] },
      },
    });
  });
});
