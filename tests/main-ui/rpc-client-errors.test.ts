import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { mapToRpcError, redactAndTruncateText } from '@/services/rpc-client/errors';

describe('rpc-client/errors', () => {
  test('redactAndTruncateText redacts and truncates', () => {
    const text = 'email test@example.com apiKey sk-1234567890abcdef and ' + 'x'.repeat(1000);
    const out = redactAndTruncateText(text, 80);
    expect(out.length).toBeLessThanOrEqual(81);
    expect(out).not.toContain('test@example.com');
    expect(out).not.toContain('sk-1234567890abcdef');
    expect(out).toContain('[redacted-email]');
    expect(out).toContain('[redacted]');
  });

  test('mapToRpcError maps ZodError to RPC_VALIDATION with fieldErrors', () => {
    const schema = z.object({ name: z.string().min(2) });
    const parsed = schema.safeParse({ name: '' });
    expect(parsed.success).toBe(false);

    const err = mapToRpcError(parsed.error, { method: 'testMethod' });
    expect(err.code).toBe('RPC_VALIDATION');
    expect(err.details).toBeDefined();
    // @ts-expect-error - details shape
    expect(err.details.fieldErrors).toBeDefined();
  });

  test('mapToRpcError maps explicit validation code to RPC_VALIDATION', () => {
    const err = mapToRpcError({ code: 'RPC_VALIDATION', message: 'bad', fieldErrors: { name: ['Required'] } }, { method: 'm' });
    expect(err.code).toBe('RPC_VALIDATION');
  });

  test('mapToRpcError maps timeout-like error to RPC_TIMEOUT', () => {
    const err = mapToRpcError(new Error('Request timed out'), { method: 'm' });
    expect(err.code).toBe('RPC_TIMEOUT');
  });

  test('mapToRpcError maps status=429 to RPC_RATE_LIMITED', () => {
    const err = mapToRpcError({ status: 429, message: 'rate limited' }, { method: 'm' });
    expect(err.code).toBe('RPC_RATE_LIMITED');
  });
});
