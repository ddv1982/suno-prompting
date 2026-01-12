export const CREATIVITY_LEVEL_HELPER_TEXT = {
    low: 'Single genres only - predictable, genre-pure results',
    safe: 'Safe multi-genre combinations from existing styles',
    normal: 'Balanced creativity - sensible combinations',
    adventurous: 'More adventurous combinations and surprises',
    high: 'Experimental - may invent new genre fusions!',
} as const;

export const MAX_MODE_HELPER_TEXT = {
    enabled: 'Creates a slightly different flavour with real instruments and subtle realism tags. Can be really nice!',
    disabled: 'Keeps genres more pure and focused.',
} as const;

export function getMaxModeHelperText(maxMode: boolean): string {
    return maxMode ? MAX_MODE_HELPER_TEXT.enabled : MAX_MODE_HELPER_TEXT.disabled;
}

export const CREATIVITY_LEVEL_DISPLAY_NAMES = {
    low: 'Low',
    safe: 'Safe',
    normal: 'Normal',
    adventurous: 'Adventurous',
    high: 'High',
} as const;

// Valid discrete slider positions for creativity level
export const VALID_CREATIVITY_LEVELS = [0, 25, 50, 75, 100] as const;

/**
 * Default genre fallback used across the application.
 * Pop is chosen because it's the most versatile/neutral genre
 * that works well with any style or lyrics topic.
 */
export const DEFAULT_GENRE = 'pop' as const;

export const APP_CONSTANTS = {
    MAX_PROMPT_CHARS: 1000,
    MIN_PROMPT_CHARS: 20,
    MAX_LOCKED_PHRASE_CHARS: 300,
    MAX_LYRICS_TOPIC_CHARS: 500,
    QUICK_VIBES_MAX_CHARS: 600,
    CREATIVE_BOOST_MAX_DESCRIPTION_CHARS: 400,
    CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS: 400,
    QUICK_VIBES_GENERATION_LIMIT: 60,
    MAX_VERSION_HISTORY: 50,
    ARTICULATION_CHANCE: 0.4,
    MAX_MODE_HEADER: `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)`,
    STORAGE_DIR: '.suno-prompting-app',
    UI: {
        TOAST_DURATION_MS: 3000,
        COPY_FEEDBACK_DURATION_MS: 2000,
    },
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
    },
    OLLAMA: {
        DEFAULT_ENDPOINT: 'http://127.0.0.1:11434',
        DEFAULT_MODEL: 'gemma3:4b',
        DEFAULT_TEMPERATURE: 0.7,
        DEFAULT_MAX_TOKENS: 2000,
        DEFAULT_CONTEXT_LENGTH: 4096,
        AVAILABILITY_CACHE_TTL_MS: 30_000,
        AVAILABILITY_TIMEOUT_MS: 5_000,
        GENERATION_TIMEOUT_MS: 90_000,
    },
} as const;
