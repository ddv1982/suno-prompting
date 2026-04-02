import { z } from 'zod';

import {
  statusCodeToRpcErrorCode,
  statusFromUnknown,
  detectTimeout,
  detectUnavailable,
} from './error-classification';
import { sanitizeDetails } from './error-details';
import { fieldErrorsFromUnknown, fieldErrorsFromZodError } from './error-field-errors';
import { redactAndTruncateText } from './error-text';
export { redactAndTruncateText } from './error-text';

/** Renderer-stable error codes for RPC responses. */
export type RpcErrorCode =
  /** Validation failed (Zod parse error or field-level errors). */
  | 'RPC_VALIDATION'
  /** Request exceeded the configured timeout. */
  | 'RPC_TIMEOUT'
  /** Transport/connection unavailable (e.g., disconnected, failed to fetch). */
  | 'RPC_UNAVAILABLE'
  /** Authentication required or invalid (HTTP 401). */
  | 'RPC_UNAUTHORIZED'
  /** Access denied (HTTP 403). */
  | 'RPC_FORBIDDEN'
  /** Resource not found (HTTP 404). */
  | 'RPC_NOT_FOUND'
  /** Request conflicted with current state (HTTP 409). */
  | 'RPC_CONFLICT'
  /** Too many requests (HTTP 429). */
  | 'RPC_RATE_LIMITED'
  /** Fallback for unrecognized errors. */
  | 'UNKNOWN';

export interface RpcError {
  readonly code: RpcErrorCode;
  /** Safe, renderer-friendly summary (never raw provider / stack). */
  readonly message: string;
  /** Optional, allowlisted metadata for debugging/UI decisions (size-bounded). */
  readonly details?: Record<string, unknown>;
}

export function mapToRpcError(error: unknown, context?: { method?: string }): RpcError {
  const mapped =
    tryMapKnownRpcShape(error, context) ??
    tryMapZodError(error, context) ??
    tryMapInferredFieldErrors(error, context) ??
    tryMapTimeout(error, context) ??
    tryMapUnavailable(error, context) ??
    tryMapStatus(error, context);

  return mapped ?? fallbackUnknown(error, context);
}

function tryMapKnownRpcShape(error: unknown, context?: { method?: string }): RpcError | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const unknownBag = error as Record<string, unknown>;
  const code = unknownBag.code;
  const message = unknownBag.message;
  if (typeof code !== 'string' || typeof message !== 'string') return undefined;

  const normalizedCode = code.toUpperCase();
  const known: RpcErrorCode[] = [
    'RPC_VALIDATION',
    'RPC_TIMEOUT',
    'RPC_UNAVAILABLE',
    'RPC_UNAUTHORIZED',
    'RPC_FORBIDDEN',
    'RPC_NOT_FOUND',
    'RPC_CONFLICT',
    'RPC_RATE_LIMITED',
    'UNKNOWN',
  ];
  if (!(known as readonly string[]).includes(normalizedCode)) return undefined;

  const rpcCode = normalizedCode as RpcErrorCode;
  const fieldErrors = fieldErrorsFromUnknown(error);
  return {
    code: rpcCode,
    message: safeRpcMessage(rpcCode),
    details: sanitizeDetails({
      method: context?.method,
      status: statusFromUnknown(error),
      fieldErrors,
      hint: redactAndTruncateText(message),
    }),
  };
}

function tryMapZodError(error: unknown, context?: { method?: string }): RpcError | undefined {
  if (!(error instanceof z.ZodError)) return undefined;

  const fieldErrors = fieldErrorsFromZodError(error);

  return {
    code: 'RPC_VALIDATION',
    message: safeRpcMessage('RPC_VALIDATION'),
    details: sanitizeDetails({ method: context?.method, fieldErrors }),
  };
}

function tryMapInferredFieldErrors(
  error: unknown,
  context?: { method?: string }
): RpcError | undefined {
  const inferredFieldErrors = fieldErrorsFromUnknown(error);
  if (!inferredFieldErrors) return undefined;
  return {
    code: 'RPC_VALIDATION',
    message: safeRpcMessage('RPC_VALIDATION'),
    details: sanitizeDetails({ method: context?.method, fieldErrors: inferredFieldErrors }),
  };
}

function tryMapTimeout(error: unknown, context?: { method?: string }): RpcError | undefined {
  if (!detectTimeout(error)) return undefined;
  return {
    code: 'RPC_TIMEOUT',
    message: safeRpcMessage('RPC_TIMEOUT'),
    details: sanitizeDetails({ method: context?.method }),
  };
}

function tryMapUnavailable(error: unknown, context?: { method?: string }): RpcError | undefined {
  if (!detectUnavailable(error)) return undefined;
  return {
    code: 'RPC_UNAVAILABLE',
    message: safeRpcMessage('RPC_UNAVAILABLE'),
    details: sanitizeDetails({ method: context?.method }),
  };
}

function tryMapStatus(error: unknown, context?: { method?: string }): RpcError | undefined {
  const status = statusFromUnknown(error);
  if (status === undefined) return undefined;

  const code = statusCodeToRpcErrorCode(status);
  if (!code) return undefined;

  return {
    code,
    message: safeRpcMessage(code),
    details: sanitizeDetails({ method: context?.method, status }),
  };
}

function fallbackUnknown(error: unknown, context?: { method?: string }): RpcError {
  const status = statusFromUnknown(error);
  return {
    code: 'UNKNOWN',
    message: safeRpcMessage('UNKNOWN'),
    details: sanitizeDetails({
      method: context?.method,
      status,
      hint: redactAndTruncateText(error),
    }),
  };
}

function safeRpcMessage(code: RpcErrorCode): string {
  switch (code) {
    case 'RPC_VALIDATION':
      return 'Some inputs are invalid. Please review and try again.';
    case 'RPC_TIMEOUT':
      return 'That took too long. Please try again.';
    case 'RPC_UNAVAILABLE':
      return 'Service is unavailable. Please try again.';
    case 'RPC_UNAUTHORIZED':
      return 'Not authorized. Please check your settings.';
    case 'RPC_FORBIDDEN':
      return 'Access denied.';
    case 'RPC_NOT_FOUND':
      return 'Request could not be completed.';
    case 'RPC_CONFLICT':
      return 'Request conflicted with current state. Please try again.';
    case 'RPC_RATE_LIMITED':
      return 'Too many requests. Please wait and try again.';
    case 'UNKNOWN':
    default:
      return 'Something went wrong. Please try again.';
  }
}
