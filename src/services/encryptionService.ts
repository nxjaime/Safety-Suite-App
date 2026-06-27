/**
 * PII Encryption Service — abstraction layer over client-side and server-side crypto.
 *
 * When VITE_USE_EDGE_CRYPTO=true, delegates encrypt/decrypt to a deployed Supabase
 * Edge Function (`encrypt-pii`), which holds the key server-side.
 *
 * Production requires Edge crypto. Local/test environments may use the client fallback
 * only when VITE_API_SECRET_KEY is explicitly configured.
 *
 * Migration path:
 * 1. Deploy supabase/functions/encrypt-pii (already stubbed).
 * 2. Set VITE_USE_EDGE_CRYPTO=true in the Vercel environment.
 * 3. Re-encrypt any stored SSNs that were created by the older client-side path.
 */

import { encryptData as clientEncrypt, decryptData as clientDecrypt } from '../utils/crypto';
import { supabase } from '../lib/supabase';

const useEdgeCrypto = import.meta.env.VITE_USE_EDGE_CRYPTO === 'true';
const canUseClientFallback = import.meta.env.MODE !== 'production';

const assertCryptoMode = () => {
  if (!useEdgeCrypto && !canUseClientFallback) {
    throw new Error('Server-side PII encryption is required in production');
  }
};

export async function encryptPII(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  assertCryptoMode();
  if (useEdgeCrypto) {
    const { data, error } = await supabase.functions.invoke('encrypt-pii', {
      body: { action: 'encrypt', payload: plaintext },
    });
    if (error) throw new Error(`Edge encrypt failed: ${error.message}`);
    return data.result as string;
  }
  return clientEncrypt(plaintext);
}

export async function decryptPII(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';
  assertCryptoMode();
  if (useEdgeCrypto) {
    const { data, error } = await supabase.functions.invoke('encrypt-pii', {
      body: { action: 'decrypt', payload: ciphertext },
    });
    if (error) throw new Error(`Edge decrypt failed: ${error.message}`);
    return data.result as string;
  }
  return clientDecrypt(ciphertext);
}
