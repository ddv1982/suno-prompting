export const APP_CONSTANTS = {
    MAX_PROMPT_CHARS: 1000,
    MIN_PROMPT_CHARS: 20,
    MAX_LOCKED_PHRASE_CHARS: 300,
    STORAGE_DIR: '.suno-prompting-app',
    AI: {
        MAX_RETRIES: 10,
        MAX_LENGTH_RETRIES: 10,
        TIMEOUT_MS: 30000,
        DEFAULT_MODEL: 'openai/gpt-oss-120b',
        DEFAULT_USE_SUNO_TAGS: true,
        DEFAULT_DEBUG_MODE: false,
        DEFAULT_MAX_MODE: false,
        AVAILABLE_MODELS: [
            { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
            { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 Instruct' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
        ],
    }
} as const;
