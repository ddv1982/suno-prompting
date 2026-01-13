import { describe, test, expect } from 'bun:test';

import {
  Ok,
  Err,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  tryCatch,
  tryCatchAsync,
  type Result,
} from '@shared/types/result';

describe('Result type constructors', () => {
  describe('Ok', () => {
    test('creates successful result with value', () => {
      const result = Ok('test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('test');
      }
    });

    test('creates successful result with object value', () => {
      const value = { id: 1, name: 'test' };
      const result = Ok(value);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(value);
      }
    });

    test('creates successful result with undefined value', () => {
      const result = Ok(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    test('creates successful result with null value', () => {
      const result = Ok(null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('Err', () => {
    test('creates error result with error', () => {
      const error = new Error('test error');
      const result: Result<never> = Err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    test('creates error result with string error', () => {
      const result: Result<never, string> = Err('string error');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('string error');
      }
    });

    test('creates error result with fallback value', () => {
      const result: Result<string, string> = Err('error', 'fallback');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('error');
        expect(result.fallback).toBe('fallback');
      }
    });

    test('creates error result without fallback when not provided', () => {
      const result: Result<never, string> = Err('error');
      expect(result.ok).toBe(false);
      expect('fallback' in result).toBe(false);
    });
  });

  describe('lowercase aliases', () => {
    test('ok is alias for Ok', () => {
      expect(ok).toBe(Ok);
    });

    test('err is alias for Err', () => {
      expect(err).toBe(Err);
    });
  });
});

describe('Type guards', () => {
  describe('isOk', () => {
    test('returns true for Ok result', () => {
      const result = Ok('value');
      expect(isOk(result)).toBe(true);
    });

    test('returns false for Err result', () => {
      const result = Err('error');
      expect(isOk(result)).toBe(false);
    });

    test('narrows type correctly', () => {
      const result: Result<string> = Ok('test');
      if (isOk(result)) {
        // TypeScript should know result.value is string
        expect(result.value).toBe('test');
      }
    });
  });

  describe('isErr', () => {
    test('returns true for Err result', () => {
      const result = Err('error');
      expect(isErr(result)).toBe(true);
    });

    test('returns false for Ok result', () => {
      const result = Ok('value');
      expect(isErr(result)).toBe(false);
    });

    test('narrows type correctly', () => {
      const result: Result<string, string> = Err('error message');
      if (isErr(result)) {
        // TypeScript should know result.error is string
        expect(result.error).toBe('error message');
      }
    });
  });
});

describe('Unwrap functions', () => {
  describe('unwrap', () => {
    test('returns value for Ok result', () => {
      const result = Ok('test value');
      expect(unwrap(result)).toBe('test value');
    });

    test('throws error for Err result', () => {
      const error = new Error('test error');
      const result: Result<string> = Err(error);
      expect(() => unwrap(result)).toThrow('test error');
    });

    test('throws the exact error from Err', () => {
      const error = new Error('specific error');
      const result: Result<string> = Err(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    test('returns value for Ok result', () => {
      const result = Ok('actual');
      expect(unwrapOr(result, 'default')).toBe('actual');
    });

    test('returns default for Err result', () => {
      const result: Result<string, string> = Err('error');
      expect(unwrapOr(result, 'default')).toBe('default');
    });

    test('works with different types', () => {
      const result: Result<number> = Err(new Error('error'));
      expect(unwrapOr(result, 42)).toBe(42);
    });
  });
});

describe('Transformation functions', () => {
  describe('map', () => {
    test('transforms value for Ok result', () => {
      const result = Ok(5);
      const mapped = map(result, (n) => n * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    test('passes through Err result unchanged', () => {
      const result: Result<number, string> = Err('error');
      const mapped = map(result, (n) => n * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe('error');
      }
    });

    test('allows type transformation', () => {
      const result = Ok('hello');
      const mapped = map(result, (s) => s.length);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(5);
      }
    });
  });

  describe('mapErr', () => {
    test('passes through Ok result unchanged', () => {
      const result: Result<string, string> = Ok('value');
      const mapped = mapErr(result, (e) => `Wrapped: ${e}`);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe('value');
      }
    });

    test('transforms error for Err result', () => {
      const result: Result<string, string> = Err('original');
      const mapped = mapErr(result, (e) => `Wrapped: ${e}`);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe('Wrapped: original');
      }
    });

    test('allows error type transformation', () => {
      const result: Result<string, string> = Err('error message');
      const mapped = mapErr(result, (e) => new Error(e));
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBeInstanceOf(Error);
        expect(mapped.error.message).toBe('error message');
      }
    });
  });
});

describe('Try-catch wrappers', () => {
  describe('tryCatch', () => {
    test('returns Ok for successful function', () => {
      const result = tryCatch(() => 'success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    test('returns Err for throwing function', () => {
      const result = tryCatch(() => {
        throw new Error('test error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error).message).toBe('test error');
      }
    });

    test('uses mapError when provided', () => {
      const result = tryCatch(
        () => {
          throw new Error('original');
        },
        (e) => `Mapped: ${(e as Error).message}`
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Mapped: original');
      }
    });

    test('works with non-Error throws', () => {
      const result = tryCatch<never, unknown>(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- Testing non-Error throw handling
        throw 'string error';
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('string error');
      }
    });
  });

  describe('tryCatchAsync', () => {
    test('returns Ok for successful async function', async () => {
      const result = await tryCatchAsync(async () => 'success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    test('returns Err for rejecting async function', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('async error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error).message).toBe('async error');
      }
    });

    test('uses mapError when provided', async () => {
      const result = await tryCatchAsync(
        async () => {
          throw new Error('original');
        },
        (e) => `Mapped: ${(e as Error).message}`
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Mapped: original');
      }
    });

    test('waits for promise resolution', async () => {
      const result = await tryCatchAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'delayed';
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('delayed');
      }
    });
  });
});

describe('Result usage patterns', () => {
  test('chaining with fallback', () => {
    const convert = (text: string): Result<number, string> => {
      const num = parseInt(text, 10);
      if (isNaN(num)) {
        return Err('Not a number', 0);
      }
      return Ok(num);
    };

    const result = convert('invalid');
    const value = result.ok ? result.value : (result.fallback ?? -1);
    expect(value).toBe(0);
  });

  test('pattern matching style', () => {
    const result: Result<string> = Ok('test');

    let output: string;
    if (result.ok) {
      output = `Success: ${result.value}`;
    } else {
      output = `Error: ${result.error.message}`;
    }

    expect(output).toBe('Success: test');
  });

  test('combining multiple results', () => {
    const a = Ok(1);
    const b = Ok(2);
    const c = Ok(3);

    const results = [a, b, c];
    const allOk = results.every(isOk);
    expect(allOk).toBe(true);

    if (allOk) {
      const sum = results.reduce((acc, r) => acc + (r as { value: number }).value, 0);
      expect(sum).toBe(6);
    }
  });
});
