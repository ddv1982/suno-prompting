import {
  AIGenerationError,
  AppError,
  InvariantError,
  OllamaModelMissingError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  StorageError,
  ValidationError,
  getErrorMessage,
} from '@shared/errors';
import { redactSecretsInText, truncateTextWithMarker } from '@shared/trace';

import type { TraceCollector } from './collector';
import type { TraceErrorEvent, TraceErrorType } from '@shared/types/trace';

function extractHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as Record<string, unknown>;
  const response = record.response as Record<string, unknown> | undefined;

  const candidates = [record.status, record.statusCode, response?.status] as unknown[];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function extractProviderRequestId(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as Record<string, unknown>;
  const response = record.response as Record<string, unknown> | undefined;

  const candidates = [
    record.requestId,
    record['x-request-id'],
    record.providerRequestId,
    response?.id,
  ] as unknown[];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
}

/** Maps error codes to trace error types for AppError subclasses */
const ERROR_CODE_MAP: Record<string, TraceErrorType> = {
  VALIDATION_ERROR: 'validation',
  AI_GENERATION_ERROR: 'ai.generation',
  STORAGE_ERROR: 'storage',
  INVARIANT_VIOLATION: 'invariant',
  OLLAMA_UNAVAILABLE: 'ollama.unavailable',
  OLLAMA_MODEL_MISSING: 'ollama.model_missing',
  OLLAMA_TIMEOUT: 'ollama.timeout',
};

/** Maps error class to trace error type via instanceof checks */
function mapErrorTypeByInstance(error: unknown): TraceErrorType | undefined {
  if (error instanceof ValidationError) return 'validation';
  if (error instanceof OllamaUnavailableError) return 'ollama.unavailable';
  if (error instanceof OllamaModelMissingError) return 'ollama.model_missing';
  if (error instanceof OllamaTimeoutError) return 'ollama.timeout';
  if (error instanceof AIGenerationError) return 'ai.generation';
  if (error instanceof StorageError) return 'storage';
  if (error instanceof InvariantError) return 'invariant';
  return undefined;
}

function mapErrorType(error: unknown): TraceErrorType {
  // First try direct instanceof mapping
  const instanceType = mapErrorTypeByInstance(error);
  if (instanceType) return instanceType;

  // Fall back to code-based mapping for AppError subclasses
  if (error instanceof AppError) {
    return ERROR_CODE_MAP[error.code] ?? 'unknown';
  }

  return 'unknown';
}

export function normalizeTraceError(error: unknown): TraceErrorEvent['error'] {
  const type = mapErrorType(error);
  const status = extractHttpStatus(error);
  const providerRequestId = extractProviderRequestId(error);

  const rawMessage = getErrorMessage(error, 'Unknown error');
  const safeMessage = truncateTextWithMarker(redactSecretsInText(rawMessage), 500).text;

  return {
    type,
    message: safeMessage,
    status,
    providerRequestId,
  };
}

export function traceError(
  trace: TraceCollector | undefined,
  error: unknown
): TraceErrorEvent['error'] {
  const normalized = normalizeTraceError(error);
  trace?.addErrorEvent(normalized);
  return normalized;
}
