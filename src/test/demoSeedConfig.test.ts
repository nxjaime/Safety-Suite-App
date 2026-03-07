import { describe, expect, it } from 'vitest';

describe('resolveDemoSeedConfig', () => {
  it('requires a service role key even when an anon key exists', async () => {
    const { resolveDemoSeedConfig } = await import('../server/demoSeedConfig');

    expect(() => resolveDemoSeedConfig({
      env: {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key'
      },
      argv: ['node', 'seedDemoData.ts']
    })).toThrow('Missing required env: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  });

  it('prefers an explicit org id argument over env defaults', async () => {
    const { resolveDemoSeedConfig } = await import('../server/demoSeedConfig');

    expect(resolveDemoSeedConfig({
      env: {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        DEMO_ORG_ID: 'org-from-env'
      },
      argv: ['node', 'seedDemoData.ts', '--org-id', 'org-from-arg']
    })).toEqual({
      orgId: 'org-from-arg',
      supabaseKey: 'service-role-key',
      supabaseUrl: 'https://example.supabase.co'
    });
  });
});
