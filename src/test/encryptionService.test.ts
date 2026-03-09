import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock client crypto so we can verify delegation
vi.mock('../utils/crypto', () => ({
  encryptData: vi.fn().mockResolvedValue('client-encrypted'),
  decryptData: vi.fn().mockResolvedValue('client-decrypted'),
}));

// Mock supabase Edge Functions invoke
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { result: 'edge-result' }, error: null }),
    },
  },
}));

describe('encryptionService', () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure edge crypto flag is off by default
    vi.stubEnv('VITE_USE_EDGE_CRYPTO', '');
  });

  it('delegates to client crypto when VITE_USE_EDGE_CRYPTO is not set', async () => {
    const { encryptPII } = await import('../services/encryptionService');
    const result = await encryptPII('123-45-6789');
    expect(result).toBe('client-encrypted');
  });

  it('delegates to client crypto for decryption when VITE_USE_EDGE_CRYPTO is not set', async () => {
    const { decryptPII } = await import('../services/encryptionService');
    const result = await decryptPII('encrypted-blob');
    expect(result).toBe('client-decrypted');
  });

  it('returns empty string for empty plaintext', async () => {
    const { encryptPII } = await import('../services/encryptionService');
    const result = await encryptPII('');
    expect(result).toBe('');
  });

  it('returns empty string for empty ciphertext', async () => {
    const { decryptPII } = await import('../services/encryptionService');
    const result = await decryptPII('');
    expect(result).toBe('');
  });
});
