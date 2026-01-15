import { createLogger } from '@bun/logger';
import { StorageError } from '@shared/errors';

const log = createLogger('Crypto');
const SERVICE_NAME = 'suno-prompting';
const KEY_NAME = 'crypto-master-key';

let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;

function createRandomSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString('base64');
}

async function loadOrCreateSecret(): Promise<string> {
    if (cachedSecret) return cachedSecret;

    const existing = await Bun.secrets.get({ service: SERVICE_NAME, name: KEY_NAME });
    if (existing) {
        cachedSecret = existing;
        return existing;
    }

    const secret = createRandomSecret();
    await Bun.secrets.set({
        service: SERVICE_NAME,
        name: KEY_NAME,
        value: secret,
    });
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
        const secret = await loadOrCreateSecret();
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
        throw new StorageError('Failed to encrypt sensitive data', 'encrypt', error as Error);
    }
}

export async function decrypt(encryptedBase64: string): Promise<string> {
    try {
        const secret = await loadOrCreateSecret();
        return await decryptWithSecret(encryptedBase64, secret);
    } catch (error: unknown) {
        log.error('decrypt:failed', error);
        throw new StorageError(
            'Failed to decrypt sensitive data. The key might have been encrypted on a different machine.',
            'decrypt',
            error as Error
        );
    }
}
