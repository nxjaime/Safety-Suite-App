import { describe, expect, it } from 'vitest';
import { getSupabaseBaseUrl } from '../lib/supabase';

describe('getSupabaseBaseUrl', () => {
  it('routes browser auth requests through the same-origin proxy path', () => {
    expect(getSupabaseBaseUrl()).toBe(new URL('/supabase', window.location.origin).toString());
  });
});
