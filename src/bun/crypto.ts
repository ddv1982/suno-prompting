import { hostname, userInfo } from 'os';
import { StorageError } from '@shared/errors';

async function getSecret(): Promise<string> {
    const user = userInfo();
    return `${hostname()}-${user.username}`;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    
    // Hash the secret to get exactly 256 bits for AES
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(text: string): Promise<string> {
    try {
        const secret = await getSecret();
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
    } catch (error) {
        throw new StorageError('Failed to encrypt sensitive data', 'encrypt');
    }
}

export async function decrypt(encryptedBase64: string): Promise<string> {
    try {
        const secret = await getSecret();
        const key = await deriveKey(secret);
        const combined = Buffer.from(encryptedBase64, 'base64');
        
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new StorageError('Failed to decrypt sensitive data. The key might have been encrypted on a different machine.', 'decrypt');
    }
}
