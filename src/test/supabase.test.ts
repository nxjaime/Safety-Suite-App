import { describe, expect, it } from 'vitest';
import { getSupabaseBaseUrl } from '../lib/supabase';

describe('getSupabaseBaseUrl', () => {
  it('returns the configured Supabase URL', () => {
    expect(getSupabaseBaseUrl()).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });
});
