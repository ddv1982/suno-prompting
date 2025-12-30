export const APP_CONSTANTS = {
    MAX_PROMPT_CHARS: 1000,
    MIN_PROMPT_CHARS: 20,
    MAX_LOCKED_PHRASE_CHARS: 300,
    MAX_LYRICS_TOPIC_CHARS: 500,
    QUICK_VIBES_MAX_CHARS: 400,
    MAX_MODE_HEADER: `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)`,
    STORAGE_DIR: '.suno-prompting-app',
    AI: {
        MAX_RETRIES: 10,
        MAX_LENGTH_RETRIES: 10,
        TIMEOUT_MS: 90000,
        DEFAULT_PROVIDER: 'groq' as const,
        DEFAULT_MODEL: 'openai/gpt-oss-120b',
        DEFAULT_USE_SUNO_TAGS: true,
        DEFAULT_DEBUG_MODE: false,
        DEFAULT_MAX_MODE: false,
        DEFAULT_LYRICS_MODE: false,
        DEFAULT_PROMPT_MODE: 'full' as const,
        PROVIDER_IDS: ['groq', 'openai', 'anthropic'] as const,
        PROVIDERS: [
            { id: 'groq' as const, name: 'Groq', keyPlaceholder: 'gsk_...', keyUrl: 'https://console.groq.com/keys' },
            { id: 'openai' as const, name: 'OpenAI', keyPlaceholder: 'sk-...', keyUrl: 'https://platform.openai.com/api-keys' },
            { id: 'anthropic' as const, name: 'Anthropic', keyPlaceholder: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
        ],
        MODELS_BY_PROVIDER: {
            groq: [
                { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
            ],
            openai: [
                { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
                { id: 'gpt-5', name: 'GPT-5' },
            ],
            anthropic: [
                { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
                { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
            ],
        },
    }
} as const;
