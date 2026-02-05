/**
 * Tests for error.ts refactored helper functions
 *
 * Tests the ERROR_CODE_MAP lookup and mapErrorTypeByInstance helper
 */

import { describe, expect, test } from 'bun:test';

import { normalizeTraceError } from '@bun/trace';
import {
  AIGenerationError,
  AppError,
  InvariantError,
  OllamaModelMissingError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  StorageError,
  ValidationError,
} from '@shared/errors';

describe('mapErrorType via normalizeTraceError', () => {
  describe('instanceof-based mapping', () => {
    test('maps ValidationError to validation', () => {
      const error = new ValidationError('test');
      expect(normalizeTraceError(error).type).toBe('validation');
    });

    test('maps OllamaUnavailableError to ollama.unavailable', () => {
      const error = new OllamaUnavailableError('http://localhost:11434');
      expect(normalizeTraceError(error).type).toBe('ollama.unavailable');
    });

    test('maps OllamaModelMissingError to ollama.model_missing', () => {
      const error = new OllamaModelMissingError('gemma3:4b');
      expect(normalizeTraceError(error).type).toBe('ollama.model_missing');
    });

    test('maps OllamaTimeoutError to ollama.timeout', () => {
      const error = new OllamaTimeoutError(30000);
      expect(normalizeTraceError(error).type).toBe('ollama.timeout');
    });

    test('maps AIGenerationError to ai.generation', () => {
      const error = new AIGenerationError('test');
      expect(normalizeTraceError(error).type).toBe('ai.generation');
    });

    test('maps StorageError to storage', () => {
      const error = new StorageError('test', 'read');
      expect(normalizeTraceError(error).type).toBe('storage');
    });

    test('maps InvariantError to invariant', () => {
      const error = new InvariantError('test');
      expect(normalizeTraceError(error).type).toBe('invariant');
    });
  });

  describe('code-based mapping via ERROR_CODE_MAP', () => {
    test('maps VALIDATION_ERROR code to validation', () => {
      const error = new AppError('test', 'VALIDATION_ERROR');
      expect(normalizeTraceError(error).type).toBe('validation');
    });

    test('maps AI_GENERATION_ERROR code to ai.generation', () => {
      const error = new AppError('test', 'AI_GENERATION_ERROR');
      expect(normalizeTraceError(error).type).toBe('ai.generation');
    });

    test('maps STORAGE_ERROR code to storage', () => {
      const error = new AppError('test', 'STORAGE_ERROR');
      expect(normalizeTraceError(error).type).toBe('storage');
    });

    test('maps INVARIANT_VIOLATION code to invariant', () => {
      const error = new AppError('test', 'INVARIANT_VIOLATION');
      expect(normalizeTraceError(error).type).toBe('invariant');
    });

    test('maps OLLAMA_UNAVAILABLE code to ollama.unavailable', () => {
      const error = new AppError('test', 'OLLAMA_UNAVAILABLE');
      expect(normalizeTraceError(error).type).toBe('ollama.unavailable');
    });

    test('maps OLLAMA_MODEL_MISSING code to ollama.model_missing', () => {
      const error = new AppError('test', 'OLLAMA_MODEL_MISSING');
      expect(normalizeTraceError(error).type).toBe('ollama.model_missing');
    });

    test('maps OLLAMA_TIMEOUT code to ollama.timeout', () => {
      const error = new AppError('test', 'OLLAMA_TIMEOUT');
      expect(normalizeTraceError(error).type).toBe('ollama.timeout');
    });

    test('maps unknown AppError code to unknown', () => {
      const error = new AppError('test', 'SOME_NEW_CODE');
      expect(normalizeTraceError(error).type).toBe('unknown');
    });
  });

  describe('fallback to unknown', () => {
    test('maps plain Error to unknown', () => {
      const error = new Error('test');
      expect(normalizeTraceError(error).type).toBe('unknown');
    });

    test('maps string error to unknown', () => {
      expect(normalizeTraceError('string error').type).toBe('unknown');
    });

    test('maps null to unknown', () => {
      expect(normalizeTraceError(null).type).toBe('unknown');
    });

    test('maps undefined to unknown', () => {
      expect(normalizeTraceError(undefined).type).toBe('unknown');
    });
  });
});
