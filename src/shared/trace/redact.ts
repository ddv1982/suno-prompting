/**
 * Secrets-only redaction utilities for persisted debug traces.
 *
 * Non-negotiable: never persist secrets unredacted.
 */

export const TRACE_REDACTION_TOKEN = '[REDACTED]' as const;

const REPLACEMENT_TEXT = TRACE_REDACTION_TOKEN;

type RedactionRule = {
  readonly name: string;
  readonly pattern: RegExp;
  readonly replace: (match: string, ...groups: readonly string[]) => string;
};

// Minimum patterns from the spec (plus a few safe variants).
const REDACTION_RULES: readonly RedactionRule[] = [
  {
    name: 'openai-key',
    pattern: /\bsk-[A-Za-z0-9]{20,}\b/g,
    replace: () => REPLACEMENT_TEXT,
  },
  {
    name: 'anthropic-key',
    pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    replace: () => REPLACEMENT_TEXT,
  },
  {
    name: 'groq-key',
    pattern: /\bgsk_[A-Za-z0-9]{20,}\b/g,
    replace: () => REPLACEMENT_TEXT,
  },
  {
    name: 'authorization-header-bearer',
    pattern: /(\bAuthorization\s*:\s*Bearer\s+)([A-Za-z0-9._~+/=-]{10,})/gi,
    replace: (_match, prefix: string) => `${prefix}${REPLACEMENT_TEXT}`,
  },
  {
    name: 'bearer-token',
    pattern: /(\bBearer\s+)([A-Za-z0-9._~+/=-]{10,})/gi,
    replace: (_match, prefix: string) => `${prefix}${REPLACEMENT_TEXT}`,
  },
  {
    name: 'json-apiKey',
    pattern: /("apiKey"\s*:\s*")([^"]+)(")/gi,
    replace: (_match, prefix: string, _secret: string, suffix: string) => `${prefix}${REPLACEMENT_TEXT}${suffix}`,
  },
  {
    name: 'json-authorization',
    pattern: /("authorization"\s*:\s*")([^"]+)(")/gi,
    replace: (_match, prefix: string, _secret: string, suffix: string) => `${prefix}${REPLACEMENT_TEXT}${suffix}`,
  },
  {
    name: 'x-api-key-header',
    pattern: /(\bx-api-key\s*:\s*)([^\s,;]+)/gi,
    replace: (_match, prefix: string) => `${prefix}${REPLACEMENT_TEXT}`,
  },
  {
    name: 'kv-apiKey',
    pattern: /(\bapiKey\b\s*[:=]\s*)([^\s,;]+)/gi,
    replace: (_match, prefix: string) => `${prefix}${REPLACEMENT_TEXT}`,
  },
] as const;

export function redactSecretsInText(input: string): string {
  let output = input;

  for (const rule of REDACTION_RULES) {
    output = output.replace(rule.pattern, (...args: unknown[]) => {
      // `String.prototype.replace` passes (match, ...groups, offset, input, groupsObj?)
      const [match, ...rest] = args;
      return rule.replace(String(match), ...rest.map((v) => String(v)));
    });
  }

  return output;
}

/**
 * Deep redaction for unknown values (useful for providerOptions). Strings are redacted.
 * Objects/arrays are cloned and traversed. Other primitives are returned as-is.
 */
export function redactSecretsDeep(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSecretsInText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecretsDeep(item));
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};

    for (const [key, inner] of Object.entries(record)) {
      next[key] = redactSecretsDeep(inner);
    }

    return next;
  }

  return value;
}
