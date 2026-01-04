import { expect, test, describe } from "bun:test";

import { encrypt, decrypt } from "@bun/crypto";

describe("Crypto module", () => {
    test("encrypt and decrypt round-trip preserves original text", async () => {
        const original = "gsk_test_api_key_12345";
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);
        
        expect(decrypted).toBe(original);
    });

    test("encrypted text is different from original", async () => {
        const original = "secret_value";
        const encrypted = await encrypt(original);
        
        expect(encrypted).not.toBe(original);
        expect(encrypted.length).toBeGreaterThan(original.length);
    });

    test("encrypting same text twice produces different ciphertext (IV randomness)", async () => {
        const original = "same_text";
        const encrypted1 = await encrypt(original);
        const encrypted2 = await encrypt(original);
        
        expect(encrypted1).not.toBe(encrypted2);
    });

    test("both encryptions decrypt to same original", async () => {
        const original = "test_value";
        const encrypted1 = await encrypt(original);
        const encrypted2 = await encrypt(original);
        
        expect(await decrypt(encrypted1)).toBe(original);
        expect(await decrypt(encrypted2)).toBe(original);
    });

    test("handles empty string", async () => {
        const original = "";
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);
        
        expect(decrypted).toBe(original);
    });

    test("handles special characters", async () => {
        const original = "key!@#$%^&*()_+-=[]{}|;':\",./<>?";
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);
        
        expect(decrypted).toBe(original);
    });

    test("handles unicode characters", async () => {
        const original = "密钥🔐тест";
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);
        
        expect(decrypted).toBe(original);
    });

    test("decrypting tampered data throws error", async () => {
        const original = "test_key";
        const encrypted = await encrypt(original);
        
        // Tamper with the ciphertext by modifying a byte
        const tamperedBuffer = Buffer.from(encrypted, 'base64');
        const index = tamperedBuffer.length - 5;
        if (index >= 0) {
            tamperedBuffer[index] = (tamperedBuffer[index] ?? 0) ^ 0xFF;
        }
        const tampered = tamperedBuffer.toString('base64');
        
        await expect(decrypt(tampered)).rejects.toThrow();
    });

    test("decrypting invalid base64 throws error", async () => {
        await expect(decrypt("not_valid_base64!!!")).rejects.toThrow();
    });
});
