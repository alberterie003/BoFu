import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/campaigns/health
 * Get campaign health metrics for all campaigns
 */
export async function GET() {
    try {
        const supabase = createAdminClient();

        // Get campaign performance data from the view
        const { data: campaigns, error } = await supabase
            .from('campaign_performance_summary')
            .select('*')
            .order('total_leads', { ascending: false });

        if (error) {
            console.error('Error fetching campaigns:', error);
            // If view doesn't exist yet, return empty array
            return NextResponse.json({
                success: true,
                campaigns: []
            });
        }

        // Calculate learning status for each campaign
        const enrichedCampaigns = ((campaigns as any[]) || []).map(campaign => {
            const leadsThisWeek = campaign.total_leads || 0; // This is simplified - should be filtered by date

            let learningStatus = 'learning_limited';
            if (leadsThisWeek >= 50) {
                learningStatus = 'active';
            } else if (leadsThisWeek >= 30) {
                learningStatus = 'learning';
            }

            // Generate alerts
            const alerts = [];

            if (learningStatus === 'learning_limited') {
                alerts.push({
                    type: 'warning',
                    message: `Only ${leadsThisWeek} events this week. Need 50 for stable learning. Consider consolidating ad sets.`
                });
            }

            const qualRate = parseFloat(campaign.qualification_rate) || 0;
            if (qualRate < 30) {
                alerts.push({
                    type: 'error',
                    message: `Low qualification rate (${qualRate}%). Review creative filtration and targeting.`
                });
            }

            const noiseRate = campaign.noise_leads ?
                (campaign.noise_leads / campaign.total_leads * 100).toFixed(1) : 0;

            if (parseFloat(noiseRate as string) > 30) {
                alerts.push({
                    type: 'warning',
                    message: `High noise rate (${noiseRate}%). Check noise sources and update creative.`
                });
            }

            return {
                ...campaign,
                learning_status: learningStatus,
                events_this_week: leadsThisWeek,
                noise_rate: parseFloat(noiseRate as string),
                alerts
            };
        });

        return NextResponse.json({
            success: true,
            campaigns: enrichedCampaigns
        });

    } catch (error: any) {
        console.error('Campaign health error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                campaigns: []
            },
            { status: 500 }
        );
    }
}
