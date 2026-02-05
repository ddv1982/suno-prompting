import type { RpcError, RpcErrorCode } from './rpc-client';

export class RpcClientError extends Error {
  public readonly code: RpcErrorCode;
  public readonly details?: RpcError['details'];

  constructor(error: RpcError, options?: { readonly cause?: unknown }) {
    super(error.message, options);
    this.name = 'RpcClientError';
    this.code = error.code;
    this.details = error.details;
  }
}

export function unwrapOrThrowResult<T>(
  result: { ok: true; value: T } | { ok: false; error: RpcError }
): T {
  if (result.ok) return result.value;
  throw new RpcClientError(result.error, { cause: result.error });
}
