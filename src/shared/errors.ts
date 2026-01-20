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
 * Error thrown when an invariant is violated.
 * Used for impossible states that indicate a bug in the code.
 *
 * @example
 * if (items.length === 0) {
 *   throw new InvariantError('selectRandom called with empty array');
 * }
 */
export class InvariantError extends AppError {
    constructor(message: string, cause?: Error) {
        super(message, 'INVARIANT_VIOLATION', cause);
        this.name = 'InvariantError';
    }
}

/**
 * Error thrown when Ollama server is not reachable.
 * Indicates that Ollama needs to be started.
 */
export class OllamaUnavailableError extends AppError {
    constructor(endpoint: string, cause?: Error) {
        super(
            `Ollama server not reachable at ${endpoint}. Please ensure Ollama is running.`,
            'OLLAMA_UNAVAILABLE',
            cause
        );
        this.name = 'OllamaUnavailableError';
    }
}

/**
 * Error thrown when the required Gemma model is not installed.
 * Includes installation instructions for the user.
 */
export class OllamaModelMissingError extends AppError {
    constructor(model = 'gemma3:4b') {
        super(
            `Model ${model} not found. Run 'ollama pull ${model}' to install it.`,
            'OLLAMA_MODEL_MISSING'
        );
        this.name = 'OllamaModelMissingError';
    }
}

/**
 * Error thrown when Ollama generation times out.
 * Used when local generation exceeds the configured timeout.
 */
export class OllamaTimeoutError extends AppError {
    constructor(timeoutMs: number, cause?: Error) {
        super(
            `Ollama generation timed out after ${timeoutMs / 1000} seconds.`,
            'OLLAMA_TIMEOUT',
            cause
        );
        this.name = 'OllamaTimeoutError';
    }
}

/**
 * Extracts error message from unknown error type.
 * Use this instead of repeating `error instanceof Error ? error.message : fallback` pattern.
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return fallback;
}
