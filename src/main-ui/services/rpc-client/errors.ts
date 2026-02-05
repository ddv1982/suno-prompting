import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';

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

// Use centralized constants from APP_CONSTANTS.RPC
const { MAX_TEXT_LEN, MAX_DETAILS_TEXT_LEN, MAX_FIELD_ERRORS, MAX_FIELD_ERROR_TEXT } =
  APP_CONSTANTS.RPC;

export function redactAndTruncateText(input: unknown, maxLen: number = MAX_TEXT_LEN): string {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof Error
        ? input.message
        : input === null
          ? 'null'
          : input === undefined
            ? 'undefined'
            : typeof input === 'number' || typeof input === 'boolean' || typeof input === 'bigint'
              ? String(input)
              : typeof input === 'object'
                ? safeJsonStringify(input)
                : '[unknown]';

  const redacted = raw
    // crude redactions: keys/tokens
    .replace(/\b(sk|rk|pk|api|token|key)[_-]?[a-z0-9]{8,}\b/gi, '[redacted]')
    // emails
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    // very long base64-ish blobs
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, '[redacted-blob]');

  if (redacted.length <= maxLen) return redacted;
  return redacted.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
}

function safeJsonStringify(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    if (json === '{}' || json === '[]') return '[object]';
    return json;
  } catch {
    return '[unserializable]';
  }
}

const zFieldErrors = z.record(z.string(), z.array(z.string()));
const zFieldErrorsContainer = z.object({ fieldErrors: zFieldErrors });

function fieldErrorsFromUnknown(error: unknown): Record<string, string[]> | undefined {
  if (error && typeof error === 'object') {
    // common shapes: { fieldErrors }, { errors: { fieldErrors } }, etc.
    const unknownBag = error as Record<string, unknown>;
    const topLevel = unknownBag.fieldErrors;
    const nested =
      (unknownBag.errors && typeof unknownBag.errors === 'object'
        ? (unknownBag.errors as Record<string, unknown>).fieldErrors
        : undefined) ??
      (unknownBag.details && typeof unknownBag.details === 'object'
        ? (unknownBag.details as Record<string, unknown>).fieldErrors
        : undefined);

    // Accept either a record itself or a container like { fieldErrors: record }
    const candidate: unknown = topLevel ?? nested;

    const containerParsed = zFieldErrorsContainer.safeParse(candidate);
    const recordParsed = zFieldErrors.safeParse(candidate);

    const fieldErrors = containerParsed.success
      ? containerParsed.data.fieldErrors
      : recordParsed.success
        ? recordParsed.data
        : undefined;

    if (!fieldErrors) return undefined;

    const entries = Object.entries(fieldErrors).slice(0, MAX_FIELD_ERRORS);
    const normalized: Record<string, string[]> = {};
    for (const [field, messages] of entries) {
      normalized[field] = messages
        .slice(0, 10)
        .map((m) => redactAndTruncateText(m, MAX_FIELD_ERROR_TEXT));
    }
    return normalized;
  }
  return undefined;
}

function detectTimeout(error: unknown): boolean {
  const text = redactAndTruncateText(error).toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('time out') ||
    text.includes('etimedout')
  );
}

function detectUnavailable(error: unknown): boolean {
  const text = redactAndTruncateText(error).toLowerCase();
  return (
    text.includes('unavailable') ||
    text.includes('connection') ||
    text.includes('disconnected') ||
    text.includes('not connected') ||
    text.includes('failed to fetch')
  );
}

function statusFromUnknown(error: unknown): number | undefined {
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

function sanitizeDetails(
  details: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  const allowlist = ['method', 'requestId', 'status', 'fieldErrors', 'hint'];
  const out: Record<string, unknown> = {};
  for (const key of allowlist) {
    if (key in details) out[key] = details[key];
  }
  if ('hint' in out) out.hint = redactAndTruncateText(out.hint, MAX_DETAILS_TEXT_LEN);
  return Object.keys(out).length ? out : undefined;
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

  const tree = z.treeifyError(error);
  const fieldErrors: Record<string, unknown> =
    tree &&
    typeof tree === 'object' &&
    'properties' in tree &&
    typeof tree.properties === 'object' &&
    tree.properties !== null
      ? (tree.properties as Record<string, unknown>)
      : {};

  const normalized: Record<string, string[]> = {};
  for (const [field, node] of Object.entries(fieldErrors).slice(0, MAX_FIELD_ERRORS)) {
    const issues = (node as { errors?: unknown })?.errors;
    const messages = Array.isArray(issues) ? issues : [];
    normalized[field] = messages.map((m) => redactAndTruncateText(m, MAX_FIELD_ERROR_TEXT));
  }

  return {
    code: 'RPC_VALIDATION',
    message: safeRpcMessage('RPC_VALIDATION'),
    details: sanitizeDetails({ method: context?.method, fieldErrors: normalized }),
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
  if (status === 401) {
    return {
      code: 'RPC_UNAUTHORIZED',
      message: safeRpcMessage('RPC_UNAUTHORIZED'),
      details: sanitizeDetails({ method: context?.method, status }),
    };
  }
  if (status === 403) {
    return {
      code: 'RPC_FORBIDDEN',
      message: safeRpcMessage('RPC_FORBIDDEN'),
      details: sanitizeDetails({ method: context?.method, status }),
    };
  }
  if (status === 404) {
    return {
      code: 'RPC_NOT_FOUND',
      message: safeRpcMessage('RPC_NOT_FOUND'),
      details: sanitizeDetails({ method: context?.method, status }),
    };
  }
  if (status === 409) {
    return {
      code: 'RPC_CONFLICT',
      message: safeRpcMessage('RPC_CONFLICT'),
      details: sanitizeDetails({ method: context?.method, status }),
    };
  }
  if (status === 429) {
    return {
      code: 'RPC_RATE_LIMITED',
      message: safeRpcMessage('RPC_RATE_LIMITED'),
      details: sanitizeDetails({ method: context?.method, status }),
    };
  }
  return undefined;
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
