
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.join(process.cwd(), '.env.local');
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    console.log('Available keys from .env.local:', Object.keys(env));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
    console.log('Checking templates...');
    const { data: templates, error } = await supabase
        .from('funnel_templates')
        .select('id, name, intent');

    if (error) {
        console.error('Error fetching templates:', error);
        return;
    }

    console.log('Found templates:', templates);

    // Verify matching logic
    const keywords = ['buyer', 'seller', 'investor', 'renter'];
    let allFound = true;
    keywords.forEach(k => {
        const match = templates?.find(t => t.name.toLowerCase().includes(k));
        console.log(`Keyword '${k}': ${match ? '✅ Found (' + match.name + ')' : '❌ NOT FOUND'}`);
        if (!match) allFound = false;
    });

    if (allFound) {
        console.log('\n🎉 All templates are present and match UI logic!');
    } else {
        console.log('\n⚠️ Some templates are missing.');
    }
}

checkTemplates();
