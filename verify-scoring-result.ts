
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

async function verifyResults() {
    console.log('🔍 Verifying Lead Scoring and Campaign Health...\n');

    // 1. Get most recent lead
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select(`
        id, 
        created_at, 
        contact_data, 
        temperature,
        score:lead_qualification_scores(*)
    `)
        .order('created_at', { ascending: false })
        .limit(1);

    if (lError) {
        console.error('❌ Error fetching leads:', lError);
    } else if (!leads || leads.length === 0) {
        console.log('⚠️ No leads found yet. Waiting for user submission.');
    } else {
        const l = leads[0];
        console.log(`✅ Latest Lead Found: ${l.id} (Created: ${l.created_at})`);
        console.log(`   Contact: ${(l.contact_data as any)?.name || 'N/A'}`);
        console.log(`   Temp: ${l.temperature}`);

        if (l.score) {
            console.log(`   ✅ SCORE GENERATED:`);
            console.log(`      Total: ${(l.score as any).total_score}`);
            console.log(`      Tier: ${(l.score as any).quality_tier}`);
            console.log(`      Breakdown: Timeline=${(l.score as any).timeline_score}, Financial=${(l.score as any).financial_ready_score}`);
        } else {
            console.error('❌ NO SCORE FOUND for this lead. Scoring engine failed or delayed.');
        }
    }

    // 2. Check Campaign Health View
    console.log('\n🔍 Check Campaign View:');
    const { data: campaigns, error: cError } = await supabase.from('campaign_performance_summary').select('*');
    if (cError) {
        console.error('❌ Error fetching campaign summary:', cError);
    } else {
        console.log(`✅ Campaign View accessible. Rows: ${campaigns?.length}`);
        if (campaigns && campaigns.length > 0) {
            console.log('   Stats:', JSON.stringify(campaigns[0], null, 2));
        } else {
            console.log('   (View is empty, normal if no UTM params used in verification)');
        }
    }
}

verifyResults();
