/**
 * PII Encryption Service — abstraction layer over client-side and server-side crypto.
 *
 * When VITE_USE_EDGE_CRYPTO=true, delegates encrypt/decrypt to a deployed Supabase
 * Edge Function (`encrypt-pii`), which holds the key server-side.
 *
 * When VITE_USE_EDGE_CRYPTO is unset or false (RC1 default), falls back to client-side
 * AES-GCM via crypto.ts. This is acceptable at RC1 provided RLS is the primary access
 * barrier (see docs/sprint-30/README.md — Known Risk #1).
 *
 * Migration path:
 * 1. Deploy supabase/functions/encrypt-pii (already stubbed).
 * 2. Set VITE_USE_EDGE_CRYPTO=true in the Vercel environment.
 * 3. Rotate VITE_API_SECRET_KEY; re-encrypt any stored SSNs.
 */

import { encryptData as clientEncrypt, decryptData as clientDecrypt } from '../utils/crypto';
import { supabase } from '../lib/supabase';

const useEdgeCrypto = import.meta.env.VITE_USE_EDGE_CRYPTO === 'true';

export async function encryptPII(plaintext: string): Promise<string> {
  if (!plaintext) return '';
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
  if (useEdgeCrypto) {
    const { data, error } = await supabase.functions.invoke('encrypt-pii', {
      body: { action: 'decrypt', payload: ciphertext },
    });
    if (error) throw new Error(`Edge decrypt failed: ${error.message}`);
    return data.result as string;
  }
  return clientDecrypt(ciphertext);
}
