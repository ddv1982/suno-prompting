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
