import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';
import { zodIssuesToFieldErrors } from '@shared/zod-field-errors';

import { redactAndTruncateText } from './error-text';

const { MAX_FIELD_ERRORS, MAX_FIELD_ERROR_TEXT } = APP_CONSTANTS.RPC;

const zFieldErrors = z.record(z.string(), z.array(z.string()));
const zFieldErrorsContainer = z.object({ fieldErrors: zFieldErrors });

function normalizeFieldErrors(fieldErrors: Record<string, string[]>): Record<string, string[]> {
  const entries = Object.entries(fieldErrors).slice(0, MAX_FIELD_ERRORS);
  const normalized: Record<string, string[]> = {};

  for (const [field, messages] of entries) {
    normalized[field] = messages
      .slice(0, 10)
      .map((message) => redactAndTruncateText(message, MAX_FIELD_ERROR_TEXT));
  }

  return normalized;
}

export function fieldErrorsFromUnknown(error: unknown): Record<string, string[]> | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const unknownBag = error as Record<string, unknown>;
  const topLevel = unknownBag.fieldErrors;
  const nested =
    (unknownBag.errors && typeof unknownBag.errors === 'object'
      ? (unknownBag.errors as Record<string, unknown>).fieldErrors
      : undefined) ??
    (unknownBag.details && typeof unknownBag.details === 'object'
      ? (unknownBag.details as Record<string, unknown>).fieldErrors
      : undefined);

  const candidate: unknown = topLevel ?? nested;

  const containerParsed = zFieldErrorsContainer.safeParse(candidate);
  const recordParsed = zFieldErrors.safeParse(candidate);
  const fieldErrors = containerParsed.success
    ? containerParsed.data.fieldErrors
    : recordParsed.success
      ? recordParsed.data
      : undefined;

  return fieldErrors ? normalizeFieldErrors(fieldErrors) : undefined;
}

export function fieldErrorsFromZodError(error: z.ZodError): Record<string, string[]> | undefined {
  const fieldErrors = zodIssuesToFieldErrors(error.issues);
  return fieldErrors ? normalizeFieldErrors(fieldErrors) : undefined;
}
