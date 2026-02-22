import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = (process.argv[2] || process.env.TARGET_ADMIN_EMAIL || '').trim().toLowerCase();
const fallbackOrgId = (process.env.DEFAULT_ORG_ID || '').trim() || null;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!targetEmail) {
  console.error('Missing target email. Usage: npm run admin:grant -- user@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const findUserIdByEmail = async (email: string): Promise<string | null> => {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const users = data.users || [];
    const match = users.find((user) => (user.email || '').toLowerCase() === email);
    if (match) return match.id;

    if (users.length < perPage) return null;
    page += 1;
  }

  return null;
};

const grantAdmin = async () => {
  const userId = await findUserIdByEmail(targetEmail);
  if (!userId) {
    console.error(`No auth user found for ${targetEmail}`);
    process.exit(1);
  }

  const { data: existingProfile, error: profileReadError } = await supabase
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileReadError) {
    throw new Error(`Failed to read profile: ${profileReadError.message}`);
  }

  if (existingProfile) {
    const updates: Record<string, unknown> = {
      role: 'admin'
    };

    if (!existingProfile.organization_id && fallbackOrgId) {
      updates.organization_id = fallbackOrgId;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log(`Granted admin role to ${targetEmail} (user id: ${userId})`);
    return;
  }

  const insertPayload: Record<string, unknown> = {
    id: userId,
    role: 'admin'
  };

  if (fallbackOrgId) {
    insertPayload.organization_id = fallbackOrgId;
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert([insertPayload]);

  if (insertError) {
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  console.log(`Created profile and granted admin role to ${targetEmail} (user id: ${userId})`);
};

grantAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
