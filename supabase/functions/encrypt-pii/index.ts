/**
 * Supabase Edge Function: encrypt-pii
 *
 * Provides server-side AES-GCM encryption/decryption for PII fields (SSN).
 * The encryption key never leaves the server environment.
 *
 * Deploy: supabase functions deploy encrypt-pii
 * Requires: SUPABASE_ENCRYPT_SECRET set in Supabase Dashboard → Settings → Edge Functions.
 *
 * Usage:
 *   POST /functions/v1/encrypt-pii
 *   Body: { action: "encrypt" | "decrypt", payload: string }
 *   Returns: { result: string }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { action, payload } = await req.json() as { action: string; payload: string };

    if (!payload) {
      return new Response(JSON.stringify({ result: '' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const secret = Deno.env.get('SUPABASE_ENCRYPT_SECRET');
    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_ENCRYPT_SECRET is not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('safety-suite-edge-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    if (action === 'encrypt') {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(payload));
      const buffer = new Uint8Array(iv.length + encrypted.byteLength);
      buffer.set(iv);
      buffer.set(new Uint8Array(encrypted), iv.length);
      const result = btoa(String.fromCharCode(...buffer));
      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'decrypt') {
      const binary = atob(payload);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
      const iv = buffer.slice(0, 12);
      const data = buffer.slice(12);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      const result = new TextDecoder().decode(decrypted);
      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
