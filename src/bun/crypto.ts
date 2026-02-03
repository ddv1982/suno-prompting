import { createLogger } from '@bun/logger';
import { StorageError } from '@shared/errors';

const log = createLogger('Crypto');
const SERVICE_NAME = 'suno-prompting';
const KEY_NAME = 'crypto-master-key';

let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;
let secretsStoreUnavailable = false;

function isTruthyEnv(value: string | undefined): boolean {
    if (!value) return false;
    const normalized = value.toLowerCase();
    return normalized !== 'false' && normalized !== '0';
}

function isTestOrCI(): boolean {
    const nodeEnv = process.env.NODE_ENV ?? Bun.env.NODE_ENV;
    if (nodeEnv === 'test') return true;

    if (isTruthyEnv(process.env.CI ?? Bun.env.CI)) return true;
    if (isTruthyEnv(process.env.BUN_TEST ?? Bun.env.BUN_TEST)) return true;

    if (Array.isArray(Bun.argv) && Bun.argv[1] === 'test') return true;

    return false;
}

function isSecretsPlatformError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: unknown }).code;
    return code === 'ERR_SECRETS_PLATFORM_ERROR';
}

function createRandomSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString('base64');
}

async function loadOrCreateSecret(operation: 'encrypt' | 'decrypt'): Promise<string> {
    if (cachedSecret) return cachedSecret;
    const allowInsecureFallback = isTestOrCI();
    if (secretsStoreUnavailable) {
        if (!allowInsecureFallback) {
            throw new StorageError(
                'Secure key store unavailable. Cannot encrypt/decrypt in this environment.',
                operation
            );
        }
        const secret = createRandomSecret();
        cachedSecret = secret;
        return secret;
    }

    try {
        const existing = await Bun.secrets.get({ service: SERVICE_NAME, name: KEY_NAME });
        if (existing) {
            cachedSecret = existing;
            return existing;
        }
    } catch (error: unknown) {
        if (isSecretsPlatformError(error)) {
            secretsStoreUnavailable = true;
            log.warn('secrets:unavailable', { reason: 'platform' });
            if (!allowInsecureFallback) {
                throw new StorageError(
                    'Secure key store unavailable. Cannot encrypt/decrypt in this environment.',
                    operation,
                    error as Error
                );
            }
            const secret = createRandomSecret();
            cachedSecret = secret;
            return secret;
        }
        throw error;
    }

    const secret = createRandomSecret();
    try {
        await Bun.secrets.set({
            service: SERVICE_NAME,
            name: KEY_NAME,
            value: secret,
        });
    } catch (error: unknown) {
        if (isSecretsPlatformError(error)) {
            secretsStoreUnavailable = true;
            log.warn('secrets:unavailable', { reason: 'platform' });
            if (!allowInsecureFallback) {
                throw new StorageError(
                    'Secure key store unavailable. Cannot encrypt/decrypt in this environment.',
                    operation,
                    error as Error
                );
            }
        } else {
            throw error;
        }
    }
    cachedSecret = secret;
    return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
    if (cachedKey) return cachedKey;

    const encoder = new TextEncoder();
    const data = encoder.encode(secret);

    const hash = await crypto.subtle.digest('SHA-256', data);

    const key = await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    cachedKey = key;
    return key;
}

async function decryptWithSecret(encryptedBase64: string, secret: string): Promise<string> {
    const key = await deriveKey(secret);
    const combined = Buffer.from(encryptedBase64, 'base64');

    const iv = combined.subarray(0, 12);
    const ciphertext = combined.subarray(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

export async function encrypt(text: string): Promise<string> {
    try {
        const secret = await loadOrCreateSecret('encrypt');
        const key = await deriveKey(secret);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return Buffer.from(combined).toString('base64');
    } catch (error: unknown) {
        log.error('encrypt:failed', error);
        if (error instanceof StorageError) throw error;
        throw new StorageError('Failed to encrypt sensitive data', 'encrypt', error as Error);
    }
}

export async function decrypt(encryptedBase64: string): Promise<string> {
    try {
        const secret = await loadOrCreateSecret('decrypt');
        return await decryptWithSecret(encryptedBase64, secret);
    } catch (error: unknown) {
        log.error('decrypt:failed', error);
        if (error instanceof StorageError) throw error;
        throw new StorageError(
            'Failed to decrypt sensitive data. The key might have been encrypted on a different machine.',
            'decrypt',
            error as Error
        );
    }
}
