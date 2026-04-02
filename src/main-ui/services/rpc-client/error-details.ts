import { APP_CONSTANTS } from '@shared/constants';

import { redactAndTruncateText } from './error-text';

const { MAX_DETAILS_TEXT_LEN } = APP_CONSTANTS.RPC;

const DETAIL_ALLOWLIST = ['method', 'requestId', 'status', 'fieldErrors', 'hint'] as const;

export function sanitizeDetails(
  details: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const out: Record<string, unknown> = {};
  for (const key of DETAIL_ALLOWLIST) {
    if (key in details) out[key] = details[key];
  }

  if ('hint' in out) out.hint = redactAndTruncateText(out.hint, MAX_DETAILS_TEXT_LEN);
  return Object.keys(out).length > 0 ? out : undefined;
}
