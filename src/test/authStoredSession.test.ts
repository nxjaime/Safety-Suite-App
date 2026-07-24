import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from '../contexts/AuthContext';

const AUTH_KEY = 'sb-test-project-auth-token';

describe('auth stored session recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('rejects and clears expired stored Supabase sessions', () => {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify({
      access_token: 'expired-access-token',
      refresh_token: 'expired-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) - 60,
      user: { id: 'user-1', email: 'admin@safetyhubconnect.test' },
    }));

    expect(authStorage.getStoredSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_KEY)).toBeNull();
  });

  it('keeps unexpired stored Supabase sessions available for fallback', () => {
    const stored = {
      access_token: 'active-access-token',
      refresh_token: 'active-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'user-1', email: 'admin@safetyhubconnect.test' },
    };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(stored));

    expect(authStorage.getStoredSession()).toMatchObject(stored);
    expect(window.localStorage.getItem(AUTH_KEY)).not.toBeNull();
  });
});
