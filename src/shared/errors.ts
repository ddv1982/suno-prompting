/**
 * Base error class for all application errors.
 * Provides consistent error structure with code and cause properties.
 */
export class AppError extends Error {
    public readonly code: string;

    constructor(
        message: string,
        code: string,
        cause?: Error
    ) {
        super(message, { cause });
        this.name = 'AppError';
        this.code = code;
    }
}

/**
 * Error thrown when input validation fails.
 * Includes optional field name for form error display.
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly field?: string,
        cause?: Error
    ) {
        super(message, 'VALIDATION_ERROR', cause);
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when AI generation fails.
 * Used for LLM API failures, empty responses, parsing errors, etc.
 */
export class AIGenerationError extends AppError {
    constructor(message: string, cause?: Error) {
        super(message, 'AI_GENERATION_ERROR', cause);
        this.name = 'AIGenerationError';
    }
}

/**
 * Error thrown when storage operations fail.
 * Includes the specific operation that failed for debugging.
 */
export class StorageError extends AppError {
    constructor(
        message: string,
        public readonly operation: 'read' | 'write' | 'decrypt' | 'encrypt',
        cause?: Error
    ) {
        super(message, 'STORAGE_ERROR', cause);
        this.name = 'StorageError';
    }
}

/**
 * Extracts error message from unknown error type.
 * Use this instead of repeating `error instanceof Error ? error.message : fallback` pattern.
 */
export function getErrorMessage(error: unknown, fallback: string = 'Unknown error'): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return fallback;
}
