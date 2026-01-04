import { describe, expect, test } from 'bun:test';

import { AppError, ValidationError, AIGenerationError, StorageError, getErrorMessage } from '@shared/errors';

describe('Error classes', () => {
  describe('AppError', () => {
    test('creates error with message and code', () => {
      const error = new AppError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AppError');
    });

    test('supports error cause chaining', () => {
      const cause = new Error('Original cause');
      const error = new AppError('Wrapped error', 'WRAPPED', cause);
      expect(error.message).toBe('Wrapped error');
      expect(error.cause).toBe(cause);
    });

    test('is instanceof Error', () => {
      const error = new AppError('Test', 'CODE');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ValidationError', () => {
    test('creates error with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBeUndefined();
    });

    test('creates error with field name', () => {
      const error = new ValidationError('Email is required', 'email');
      expect(error.message).toBe('Email is required');
      expect(error.field).toBe('email');
    });

    test('supports error cause chaining', () => {
      const cause = new Error('Parse failed');
      const error = new ValidationError('Invalid format', 'data', cause);
      expect(error.cause).toBe(cause);
    });

    test('is instanceof AppError', () => {
      const error = new ValidationError('Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe('AIGenerationError', () => {
    test('creates error with message', () => {
      const error = new AIGenerationError('Generation failed');
      expect(error.message).toBe('Generation failed');
      expect(error.code).toBe('AI_GENERATION_ERROR');
      expect(error.name).toBe('AIGenerationError');
    });

    test('supports error cause chaining', () => {
      const cause = new Error('API timeout');
      const error = new AIGenerationError('AI request failed', cause);
      expect(error.cause).toBe(cause);
    });

    test('is instanceof AppError', () => {
      const error = new AIGenerationError('Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof AIGenerationError).toBe(true);
    });
  });

  describe('StorageError', () => {
    test('creates error with message and operation', () => {
      const error = new StorageError('File not found', 'read');
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.name).toBe('StorageError');
      expect(error.operation).toBe('read');
    });

    test('supports all operation types', () => {
      const operations: Array<'read' | 'write' | 'decrypt' | 'encrypt'> = ['read', 'write', 'decrypt', 'encrypt'];
      for (const op of operations) {
        const error = new StorageError(`${op} failed`, op);
        expect(error.operation).toBe(op);
      }
    });

    test('supports error cause chaining', () => {
      const cause = new Error('ENOENT');
      const error = new StorageError('Cannot read config', 'read', cause);
      expect(error.cause).toBe(cause);
    });

    test('is instanceof AppError', () => {
      const error = new StorageError('Test', 'write');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof StorageError).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    test('extracts message from Error instance', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    test('returns string as-is', () => {
      expect(getErrorMessage('Direct string error')).toBe('Direct string error');
    });

    test('returns fallback for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('Unknown error');
      expect(getErrorMessage(undefined)).toBe('Unknown error');
    });

    test('returns fallback for other types', () => {
      expect(getErrorMessage(42)).toBe('Unknown error');
      expect(getErrorMessage({ foo: 'bar' })).toBe('Unknown error');
    });

    test('uses custom fallback when provided', () => {
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });

    test('extracts message from AppError subclasses', () => {
      const validation = new ValidationError('Invalid email', 'email');
      expect(getErrorMessage(validation)).toBe('Invalid email');

      const ai = new AIGenerationError('Model not available');
      expect(getErrorMessage(ai)).toBe('Model not available');

      const storage = new StorageError('Disk full', 'write');
      expect(getErrorMessage(storage)).toBe('Disk full');
    });
  });
});
