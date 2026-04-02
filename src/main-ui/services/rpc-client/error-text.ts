import { APP_CONSTANTS } from '@shared/constants';

const { MAX_TEXT_LEN } = APP_CONSTANTS.RPC;

function safeJsonStringify(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    if (json === '{}' || json === '[]') return '[object]';
    return json;
  } catch {
    return '[unserializable]';
  }
}

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
    .replace(/\b(sk|rk|pk|api|token|key)[_-]?[a-z0-9]{8,}\b/gi, '[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, '[redacted-blob]');

  if (redacted.length <= maxLen) return redacted;
  return redacted.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
}
