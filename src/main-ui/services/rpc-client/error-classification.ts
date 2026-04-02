import type { RpcErrorCode } from './errors';

import { redactAndTruncateText } from './error-text';

export function detectTimeout(error: unknown): boolean {
  const text = redactAndTruncateText(error).toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('time out') ||
    text.includes('etimedout')
  );
}

export function detectUnavailable(error: unknown): boolean {
  const text = redactAndTruncateText(error).toLowerCase();
  return (
    text.includes('unavailable') ||
    text.includes('connection') ||
    text.includes('disconnected') ||
    text.includes('not connected') ||
    text.includes('failed to fetch')
  );
}

export function statusFromUnknown(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const unknownBag = error as Record<string, unknown>;
  const status = unknownBag.status ?? unknownBag.statusCode ?? unknownBag.code;
  if (typeof status === 'number') return status;
  if (typeof status === 'string') {
    const parsed = Number(status);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function statusCodeToRpcErrorCode(status: number): RpcErrorCode | undefined {
  switch (status) {
    case 401:
      return 'RPC_UNAUTHORIZED';
    case 403:
      return 'RPC_FORBIDDEN';
    case 404:
      return 'RPC_NOT_FOUND';
    case 409:
      return 'RPC_CONFLICT';
    case 429:
      return 'RPC_RATE_LIMITED';
    default:
      return undefined;
  }
}
