
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const drivers = [
    {
        name: 'Sarah Jenkins',
        status: 'Active',
        phone: '555-0101',
        email: 'sarah.j@example.com',
        license_number: 'DL998877',
        terminal: 'West Coast',
        risk_score: 15,
        years_of_service: 5,
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
        name: 'Mike Ross',
        status: 'Inactive',
        phone: '555-0102',
        email: 'mike.ross@example.com',
        license_number: 'DL112233',
        terminal: 'North East',
        risk_score: 25,
        years_of_service: 2,
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
        name: 'David Kim',
        status: 'Active',
        phone: '555-0103',
        email: 'david.kim@example.com',
        license_number: 'DL445566',
        terminal: 'Central',
        risk_score: 10,
        years_of_service: 8,
        image: 'https://randomuser.me/api/portraits/men/65.jpg'
    },
    {
        name: 'Elena Rodriguez',
        status: 'On Leave',
        phone: '555-0104',
        email: 'elena.r@example.com',
        license_number: 'DL778899',
        terminal: 'South West',
        risk_score: 35,
        years_of_service: 3,
        image: 'https://randomuser.me/api/portraits/women/22.jpg'
    }
];

async function seed() {
    console.log('Seeding drivers...');
    const { data, error } = await supabase.from('drivers').insert(drivers).select();

    if (error) {
        console.error('Error seeding drivers:', error);
    } else {
        console.log('Successfully added drivers:', data.map(d => d.name));
    }
}

seed();
