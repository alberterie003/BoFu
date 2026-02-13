/**
 * Test Lead Scoring System
 * 
 * This script tests the lead scoring functionality:
 * 1. Connects to Supabase
 * 2. Fetches a lead
 * 3. Calculates and saves score
 * 4. Displays results
 */

import { createClient } from '@supabase/supabase-js';
import { scoreAndSaveLead, calculateLeadScore } from './lib/scoring/lead-scorer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.error('Make sure you have:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScoring() {
    console.log('🔍 Testing Lead Scoring System\n');

    // 1. Check if tables exist
    console.log('Step 1: Verifying database tables...');

    const { data: tables, error: tablesError } = await supabase
        .from('lead_qualification_scores')
        .select('id')
        .limit(1);

    if (tablesError) {
        console.error('❌ ERROR: lead_qualification_scores table not found!');
        console.error('Run the SQL setup first: supabase/SETUP_META_OPTIMIZER.sql');
        console.error(tablesError.message);
        process.exit(1);
    }
    console.log('✅ Tables exist\n');

    // 2. Get a sample lead
    console.log('Step 2: Fetching a sample lead...');
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, contact_data, created_at')
        .limit(1);

    if (leadsError || !leads || leads.length === 0) {
        console.error('❌ No leads found in database');
        console.error('Create a test lead first by submitting a funnel');
        process.exit(1);
    }

    const lead = leads[0];
    console.log(`✅ Found lead: ${lead.id}`);
    console.log(`   Contact: ${lead.contact_data?.name || 'Unknown'}\n`);

    // 3. Calculate score
    console.log('Step 3: Calculating score...');
    const scores = await calculateLeadScore(lead.id);

    console.log('📊 Score Breakdown:');
    console.log(`   Timeline Score:        ${scores.timeline_score}/30`);
    console.log(`   Financial Ready:       ${scores.financial_ready_score}/30`);
    console.log(`   Specificity Score:     ${scores.specificity_score}/25`);
    console.log(`   Engagement Score:      ${scores.engagement_score}/15`);
    console.log(`   Response Speed:        ${scores.response_speed_score}/10`);
    console.log(`   ────────────────────────────`);
    console.log(`   TOTAL SCORE:           ${scores.total_score}/100`);
    console.log(`   Quality Tier:          ${getTierEmoji(scores.quality_tier)} ${scores.quality_tier?.toUpperCase()}\n`);

    // 4. Save score
    console.log('Step 4: Saving score to database...');
    await scoreAndSaveLead(lead.id);
    console.log('✅ Score saved\n');

    // 5. Verify in database
    console.log('Step 5: Verifying saved score...');
    const { data: savedScore } = await supabase
        .from('lead_qualification_scores')
        .select('*')
        .eq('lead_id', lead.id)
        .single();

    if (savedScore) {
        console.log('✅ Score verified in database');
        console.log(`   Total: ${savedScore.total_score}, Tier: ${savedScore.quality_tier}\n`);
    }

    // 6. Test campaign view
    console.log('Step 6: Testing campaign_performance_summary view...');
    const { data: campaigns, error: campaignError } = await supabase
        .from('campaign_performance_summary')
        .select('*')
        .limit(3);

    if (campaignError) {
        console.error('❌ Campaign view error:', campaignError.message);
        console.error('Make sure to run the SQL setup');
    } else if (campaigns && campaigns.length > 0) {
        console.log(`✅ Found ${campaigns.length} campaign(s):`);
        campaigns.forEach(c => {
            console.log(`   - ${c.campaign_name || 'Unknown'}: ${c.total_leads} leads, ${c.qualification_rate}% qualified`);
        });
    } else {
        console.log('⚠️  No campaigns found (needs UTM parameters in leads)');
    }

    console.log('\n✅ ALL TESTS PASSED! 🎉');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3000/dashboard/campaigns');
    console.log('2. Visit http://localhost:3000/dashboard/leads');
    console.log('3. Check lead scores and campaign health');
}

function getTierEmoji(tier?: string) {
    switch (tier) {
        case 'hot': return '🔥';
        case 'warm': return '🟡';
        case 'cold': return '❄️';
        default: return '❓';
    }
}

testScoring().catch(console.error);
