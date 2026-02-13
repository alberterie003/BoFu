import { scoreAndSaveLead, recalculateAllScores } from '@/lib/scoring/lead-scorer';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scoring/calculate
 * Calculate and save score for a lead
 */
export async function POST(request: NextRequest) {
    try {
        const { lead_id, recalculate_all, client_id } = await request.json();

        if (recalculate_all) {
            // Recalculate all leads
            const count = await recalculateAllScores(client_id);
            return NextResponse.json({
                success: true,
                message: `Recalculated scores for ${count} leads`,
                scored_count: count
            });
        }

        if (!lead_id) {
            return NextResponse.json(
                { error: 'lead_id is required' },
                { status: 400 }
            );
        }

        // Score single lead
        const scores = await scoreAndSaveLead(lead_id);

        return NextResponse.json({
            success: true,
            scores
        });

    } catch (error: any) {
        console.error('Scoring error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/scoring/calculate?lead_id=xxx
 * Get calculated score without saving
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const leadId = searchParams.get('lead_id');

        if (!leadId) {
            return NextResponse.json(
                { error: 'lead_id parameter is required' },
                { status: 400 }
            );
        }

        const { calculateLeadScore } = await import('@/lib/scoring/lead-scorer');
        const scores = await calculateLeadScore(leadId);

        return NextResponse.json({
            success: true,
            scores
        });

    } catch (error: any) {
        console.error('Scoring error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
