import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env vars manually since this is a standalone script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);
console.log('Using key (first 10 chars):', supabaseKey?.substring(0, 10) + '...');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Just try to fetch something trivial. Even if tables don't exist,
        // a valid auth query or simple select should work or give a specific error,
        // not a connection/auth error.
        // We'll list all buckets as a generic "is auth working" test since it relies on storage.
        // Or better, just try to get session.
        const { error } = await supabase.from('random_table_that_does_not_exist').select('*').limit(1);

        if (error) {
            // If code is 'PGRST204' (table not found) or similar, it means we connected but table check failed.
            // If it's a 401/403, auth failed.
            console.log('Connection Response Error:', error.code, error.message);
            if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('permission denied')) {
                console.log('SUCCESS: Connected to Supabase (Database is reachable).');
                console.log('Note: Table query failed as expected, but auth handshake succeeded.');
            } else {
                console.error('FAILURE: Connection or Auth failed.');
            }

            // Check system_options table
            try {
                const { error: systemOptionsError } = await supabase.from('system_options').select('count', { count: 'exact', head: true });
                if (systemOptionsError) {
                    console.error('❌ system_options table check failed:', systemOptionsError.message);
                } else {
                    console.log('✅ system_options table exists and is accessible.');
                }
            } catch (err) {
                console.error('❌ Unexpected error checking system_options:', err);
            }
            console.log('\nVerification complete!');
        } else {
            console.log('SUCCESS: Connected and query executed.');
        }
    } catch (err) {
        console.error('EXCEPTION:', err);
    }
}

testConnection();
