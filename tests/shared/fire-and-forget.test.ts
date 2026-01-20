import { describe, test, expect, spyOn } from 'bun:test';

import { fireAndForget } from '@shared/fire-and-forget';

describe('fireAndForget', () => {
  test('executes the promise without blocking', async () => {
    let executed = false;
    const promise = Promise.resolve().then(() => {
      executed = true;
    });

    fireAndForget(promise, 'test');

    // Give the promise time to resolve
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(executed).toBe(true);
  });

  test('logs errors from rejected promises', async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Test error');
    const promise = Promise.reject(error);

    fireAndForget(promise, 'testOperation');

    // Give the promise time to reject and log
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0] as string;
    expect(logCall).toContain('testOperation:failed');
    expect(logCall).toContain('Test error');

    consoleSpy.mockRestore();
  });

  test('does not throw when promise rejects', () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    // This should not throw
    expect(() => {
      fireAndForget(Promise.reject(new Error('Should not throw')), 'test');
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  test('handles different error types', async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    const customError = new Error('custom error message');
    fireAndForget(Promise.reject(customError), 'testCustomError');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0] as string;
    expect(logCall).toContain('custom error message');

    consoleSpy.mockRestore();
  });
});
