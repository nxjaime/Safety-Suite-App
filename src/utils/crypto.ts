/**
 * AES-GCM encryption using Web Crypto API.
 * 
 * ⚠️ PRODUCTION SECURITY WARNING ⚠️
 * Client-side crypto using environment variables is inherently exposed to users 
 * holding the source payload. For true data-at-rest security against compromised clients:
 * 1. Sensitive data encryption/decryption keys must eventually move to Supabase Edge Functions.
 * 2. VITE_API_SECRET_KEY serves only as a temporary symmetric key for obfuscation at this phase.
 * 
 * For RC1/Launch: This is considered an acceptable "known risk" provided PII is minimized
 * and strict Role-Level Security (RLS) is maintained as the primary access barrier.
 */

const getKey = async () => {
    const secret = import.meta.env.VITE_API_SECRET_KEY || 'default-secret-do-not-use-in-prod';
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('safety-suite-salt'), // Static salt for deterministic key derivation
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptData = async (text: string): Promise<string> => {
    if (!text) return '';
    const key = await getKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(text)
    );

    // Combine IV and data
    const buffer = new Uint8Array(iv.length + encrypted.byteLength);
    buffer.set(iv);
    buffer.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...buffer));
};

export const decryptData = async (cipherText: string): Promise<string> => {
    if (!cipherText) return '';
    try {
        const key = await getKey();
        const binary = atob(cipherText);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);

        const iv = buffer.slice(0, 12);
        const data = buffer.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error('Decryption failed', e);
        return '***'; // Return masked value on error
    }
};
