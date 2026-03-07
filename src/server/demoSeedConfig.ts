type DemoSeedEnv = Record<string, string | undefined> & Partial<Record<
  'VITE_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'DEMO_ORG_ID' | 'VITE_SUPABASE_ANON_KEY',
  string | undefined
>>;

type ResolveDemoSeedConfigOptions = {
  env: DemoSeedEnv;
  argv: string[];
};

type DemoSeedConfig = {
  orgId?: string;
  supabaseKey: string;
  supabaseUrl: string;
};

const readFlagValue = (argv: string[], flag: string): string | undefined => {
  const index = argv.findIndex((arg) => arg === flag);
  if (index === -1) return undefined;

  const value = argv[index + 1]?.trim();
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
};

export const resolveDemoSeedConfig = ({
  env,
  argv
}: ResolveDemoSeedConfigOptions): DemoSeedConfig => {
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required env: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const envOrgId = env.DEMO_ORG_ID?.trim() || undefined;
  const orgId = readFlagValue(argv, '--org-id') ?? envOrgId;

  return {
    orgId,
    supabaseKey,
    supabaseUrl
  };
};
