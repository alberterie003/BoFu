
import { createClient } from '@supabase/supabase-js';
import { scoreAndSaveLead } from './lib/scoring/lead-scorer';
// Note: importing scoreAndSaveLead directly might be hard due to next.js aliases in tsx
// So I will implement the test using pure DB calls + the logic I want to verify, 
// OR simpler: I'll just insert a lead with the RIGHT structure and call the update code logic derived from the file.

// Actually, since I can't easily import from 'lib' in a standalone script without ts-node paths setup,
// I will just insert the lead and then manually run the SCORING LOGIC in this script to see if it matches expectations,
// OR I can trust my previous 'verify-scoring-result.ts' which showed the score persisted.

// Better approach: Insert a lead via the API? No, can't easily do that.
// I will insert a lead into 'leads' and 'funnel_sessions' with the CORRECT structure I just enforced in page.tsx.
// Then I will run a SQL query to "simulate" looking at it, or just ask the user to test.

// Wait, I can use the existing `api/scoring/calculate` endpoint if I knew it!
// Ah, `app/api/scoring/calculate/route.ts` calls `scoreAndSaveLead`.
// I can fetch that endpoint!

import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.join(process.cwd(), '.env.local');
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testScoring() {
    console.log('🧪 Testing Scoring Logic via DB Insertion...');

    // 1. Create a dummy session with "Hot" answers
    const { data: session, error: sError } = await supabase.from('funnel_sessions').insert({
        funnel_id: (await supabase.from('funnels').select('id').limit(1).single()).data?.id,
        // session_token will auto-generate
        answers: {
            "timeline": "30_days",         // 30 pts
            "financial_ready": "cash",     // 30 pts
            "budget": "1.5m_plus",         // 10 pts (mapped from specificity)
            "neighborhoods": "Brickell Key, Edgewater" // 10 pts
        },
        status: 'completed'
    }).select().single();

    if (sError) { console.error('Session creation failed', sError); return; }

    // 2. Create Lead linked to session
    const { data: lead, error: lError } = await supabase.from('leads').insert({
        funnel_id: session.funnel_id,
        session_id: session.id,
        contact_data: {
            name: 'Test Hot Lead',
            email: 'test@hot.com',
            utm_campaign: 'test-campaign-1',
            utm_source: 'google',
            utm_medium: 'cpc'
        },
        status: 'new'
    }).select().single();

    if (lError) { console.error('Lead creation failed', lError); return; }
    console.log(`✅ Created Test Lead: ${lead.id}`);

    // 3. Trigger Scoring via API (since app is running locally)
    console.log('🚀 Triggering Scoring via API (http://localhost:3000/api/scoring/calculate)...');
    try {
        const response = await fetch('http://localhost:3000/api/scoring/calculate', {
            method: 'POST',
            body: JSON.stringify({ lead_id: lead.id }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        const result = await response.json();
        console.log('✅ Scoring Result:', JSON.stringify(result, null, 2));

        if (result.success && result.scores?.quality_tier === 'hot') {
            console.log('✨ SUCCESS: Lead classified as HOT correctly!');
        } else {
            console.log('⚠️ WARNING: Lead classification unexpected:', result.scores?.quality_tier);
        }

    } catch (err) {
        console.error('❌ Scoring request failed:', err);
    }
}

testScoring();
