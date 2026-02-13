import { createAdminClient } from '@/lib/supabase/admin';

export interface LeadScoringComponents {
    timeline_score?: number;         // 0-30 points
    financial_ready_score?: number;  // 0-30 points  
    specificity_score?: number;      // 0-25 points
    engagement_score?: number;       // 0-15 points
    response_speed_score?: number;   // 0-10 points
    total_score?: number;            // 0-100 calculated
    quality_tier?: 'hot' | 'warm' | 'cold';
}

/**
 * Calculate qualification score for a lead based on multiple factors
 */
export async function calculateLeadScore(leadId: string): Promise<LeadScoringComponents> {
    const supabase = createAdminClient();

    console.log(`[Score] Calculating score for lead: ${leadId}`);

    // Get lead with all related data
    const { data: leadData, error: lError } = await supabase
        .from('leads')
        .select(`
      *,
      funnel_session:funnel_sessions(*)
    `)
        .eq('id', leadId)
        .single();

    if (lError) {
        throw new Error(`[Score] Lead fetch error: ${lError.message} (${lError.code})`);
    }

    const lead = leadData as any;
    console.log(`[Score] Lead found: ${lead ? lead.id : 'null'}`);

    if (!lead) {
        throw new Error(`[Score] Lead not found for ID: ${leadId}`);
    }

    const scores: LeadScoringComponents = {};
    const responses = lead.funnel_session?.answers || {};
    const contactData = lead.contact_data || {};

    // ===================================
    // 1. TIMELINE SCORE (0-30 points)
    // ===================================
    // How urgently does the lead need to act?

    const timeline = responses.timeline || responses.when_looking_to_move || contactData.timeline;

    if (timeline) {
        const timelineScoreMap: Record<string, number> = {
            // Buyers
            '30_days': 30,
            'within_30_days': 30,
            '60_days': 25,
            '30_60_days': 25,
            '1_3_months': 20,
            '3_6_months': 15,
            'exploring': 5,
            'just_exploring': 5,

            // Sellers (merged with Buyers)
            'asap': 30,

            // Renters
            'flexible': 5,

            // Investors
            'monitoring': 10
        };

        scores.timeline_score = timelineScoreMap[timeline] || 10;
    } else {
        scores.timeline_score = 0;
    }

    // ===================================
    // 2. FINANCIAL READINESS (0-30 points)
    // ===================================
    // How ready is the lead financially?

    const preApproval = responses.pre_approval || responses.payment_method ||
        responses.financing || responses.employment_status;

    if (preApproval) {
        const financialScoreMap: Record<string, number> = {
            // Buyers
            'yes': 30,
            'pre_approved': 30,
            'cash': 30,
            'in_progress': 20,
            'no': 5,

            // Investors
            'all_cash': 30,
            'conventional': 20,
            'hard_money': 25,
            'depends': 15,
            'unsure': 5,

            // Sellers
            // 'yes': 30,  // Already defined under Buyers

            // Renters
            'full_time': 20,
            'self_employed': 15,
            'student': 10,
            'other': 5
        };

        scores.financial_ready_score = financialScoreMap[preApproval] || 10;
    } else {
        scores.financial_ready_score = 0;
    }

    // ===================================
    // 3. SPECIFICITY SCORE (0-25 points)
    // ===================================
    // How specific/targeted is the lead?

    let specificityScore = 0;

    // Has specific budget range (10 points)
    const budget = responses.budget || responses.budget_range || contactData.budget_range;
    if (budget && budget !== 'flexible' && budget !== 'unsure') {
        specificityScore += 10;
    }

    // Named specific neighborhoods/areas (up to 15 points)
    const neighborhoods = responses.neighborhoods || responses.area_preference ||
        responses.property_address || contactData.area_preference;

    if (neighborhoods) {
        const length = (neighborhoods as string).length;
        if (length > 20) {
            specificityScore += 15; // Very specific
        } else if (length > 10) {
            specificityScore += 10; // Somewhat specific
        } else {
            specificityScore += 5;  // Vague
        }
    }

    scores.specificity_score = Math.min(specificityScore, 25);

    // ===================================
    // 4. ENGAGEMENT SCORE (0-15 points)
    // ===================================
    // How engaged is the lead with the funnel?

    let engagementScore = 0;

    // Completed funnel (15 points)
    if (lead.funnel_session?.status === 'completed') {
        engagementScore = 15;
    } else {
        // Partial completion based on number of responses
        const responseCount = Object.keys(responses).length;
        engagementScore = Math.min(responseCount * 3, 12);
    }

    scores.engagement_score = engagementScore;

    // ===================================
    // 5. RESPONSE SPEED SCORE (0-10 points)
    // ===================================
    // How fast did we respond to the lead?

    if (lead.created_at && lead.contacted_at) {
        const responseSeconds = (new Date(lead.contacted_at).getTime() -
            new Date(lead.created_at).getTime()) / 1000;

        if (responseSeconds < 300) {
            // < 5 minutes = 10 points
            scores.response_speed_score = 10;
        } else if (responseSeconds < 3600) {
            // < 1 hour = 7 points
            scores.response_speed_score = 7;
        } else if (responseSeconds < 86400) {
            // < 24 hours = 4 points
            scores.response_speed_score = 4;
        } else {
            // > 24 hours = 0 points
            scores.response_speed_score = 0;
        }
    } else {
        scores.response_speed_score = 0;
    }

    // ===================================
    // CALCULATE TOTALS
    // ===================================

    scores.total_score = (
        (scores.timeline_score || 0) +
        (scores.financial_ready_score || 0) +
        (scores.specificity_score || 0) +
        (scores.engagement_score || 0) +
        (scores.response_speed_score || 0)
    );

    // Determine quality tier
    if (scores.total_score >= 70) {
        scores.quality_tier = 'hot';
    } else if (scores.total_score >= 40) {
        scores.quality_tier = 'warm';
    } else {
        scores.quality_tier = 'cold';
    }

    return scores;
}

/**
 * Calculate and save score for a lead
 */
export async function scoreAndSaveLead(leadId: string): Promise<LeadScoringComponents> {
    const scores = await calculateLeadScore(leadId);
    const supabase = createAdminClient();

    // Save to database
    // @ts-ignore - bypassing strict schema check for now
    const { error } = await supabase
        .from('lead_qualification_scores')
        .upsert({
            lead_id: leadId,
            timeline_score: scores.timeline_score,
            financial_ready_score: scores.financial_ready_score,
            specificity_score: scores.specificity_score,
            engagement_score: scores.engagement_score,
            response_speed_score: scores.response_speed_score
            // total_score and quality_tier are auto-generated by database
        } as any, {
            onConflict: 'lead_id'
        });

    if (error) {
        console.error('Error saving lead score:', error);
    }

    return scores;
}

/**
 * Recalculate scores for all leads (batch operation)
 */
export async function recalculateAllScores(clientId?: string): Promise<number> {
    const supabase = createAdminClient();

    // Get all leads
    let query = supabase
        .from('leads')
        .select('id');

    if (clientId) {
        query = query.eq('client_id', clientId);
    }

    const { data: leadsData } = await query;
    const leads = leadsData as any[];

    if (!leads) return 0;

    // Score each lead
    let scoredCount = 0;
    for (const lead of leads) {
        try {
            await scoreAndSaveLead(lead.id);
            scoredCount++;
        } catch (error) {
            console.error(`Error scoring lead ${lead.id}:`, error);
        }
    }

    return scoredCount;
}
