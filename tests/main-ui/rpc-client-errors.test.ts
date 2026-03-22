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

  test('mapToRpcError preserves nested Zod issue paths in fieldErrors', () => {
    const schema = z.object({
      ollamaConfig: z.object({
        endpoint: z.string().min(1, 'Endpoint is required'),
      }),
    });
    const parsed = schema.safeParse({ ollamaConfig: { endpoint: '' } });
    expect(parsed.success).toBe(false);

    const err = mapToRpcError(parsed.error, { method: 'saveAllSettings' });
    expect(err.code).toBe('RPC_VALIDATION');
    expect(err.details).toEqual({
      method: 'saveAllSettings',
      fieldErrors: {
        'ollamaConfig.endpoint': ['Endpoint is required'],
      },
    });
  });

  test('mapToRpcError maps explicit validation code to RPC_VALIDATION', () => {
    const err = mapToRpcError(
      { code: 'RPC_VALIDATION', message: 'bad', fieldErrors: { name: ['Required'] } },
      { method: 'm' }
    );
    expect(err.code).toBe('RPC_VALIDATION');
  });

  test('mapToRpcError sanitizes Error fieldErrors metadata', () => {
    const error = new Error('Too small') as Error & {
      fieldErrors?: Record<string, string[]>;
    };
    error.fieldErrors = {
      email: ['contact me at test@example.com ' + 'x'.repeat(500)],
    };

    const err = mapToRpcError(error, { method: 'm' });
    expect(err.code).toBe('RPC_VALIDATION');
    expect(err.details).toBeDefined();

    const details = err.details as { fieldErrors?: Record<string, string[]> };
    const message = details.fieldErrors?.email?.[0];

    expect(message).toBeDefined();
    expect(message).toContain('[redacted-email]');
    expect(message).not.toContain('test@example.com');
    expect(message!.length).toBeLessThanOrEqual(201);
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
