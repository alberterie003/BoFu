
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyIntegrity() {
    console.log('🔍 Starting Database Integrity Check...\n');

    // 1. Check Funnel Templates
    console.log('1. Checking funnel_templates...');
    const { data: templates, error: tError } = await supabase.from('funnel_templates').select('count');
    if (tError) console.error('❌ Error accessing funnel_templates:', tError.message);
    else console.log(`✅ funnel_templates accessible. Count: ${(templates as any)?.[0]?.count}`);

    // 2. Check Campaign Performance View
    console.log('\n2. Checking campaign_performance_summary view...');
    const { data: campaigns, error: cError } = await supabase.from('campaign_performance_summary').select('*').limit(1);
    if (cError) {
        // It might not exist if no leads, but error would be different
        console.error('❌ Error accessing campaign_performance_summary:', cError.message);
        if (cError.code === '42P01') console.error('   (View might check for tables that exist but returns error if view itself is missing)');
    } else {
        console.log('✅ campaign_performance_summary is accessible.');
    }

    // 3. Check Leads Foreign Keys (Sample check)
    console.log('\n3. Checking specific leads references...');
    // Check if we have leads without scores
    const { data: unsscored } = await supabase.from('leads').select('id').is('qualification_score', null).limit(5);
    if (unsscored && unsscored.length > 0) {
        console.log(`⚠️ Found ${unsscored.length} leads without qualification_score (Expected for new leads before scoring engine runs).`);
    } else {
        console.log('✅ All checked leads have scores (or table empty).');
    }

    console.log('\n🏁 Integrity Check Complete.');
}

verifyIntegrity();
