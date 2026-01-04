export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public recoverable: boolean = true
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class AIGenerationError extends AppError {
    constructor(message: string, public originalError?: Error) {
        super(message, 'AI_GENERATION_ERROR');
    }
}

export class StorageError extends AppError {
    constructor(message: string, public operation: 'read' | 'write' | 'decrypt' | 'encrypt') {
        super(message, 'STORAGE_ERROR');
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
