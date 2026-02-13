import { createAdminClient } from '@/lib/supabase/admin';
import { SYSTEM_TEMPLATES } from '@/lib/funnel-templates/system-templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/funnel-templates
 * Get all funnel templates (system + custom)
 */
/**
 * GET /api/funnel-templates
 * Get all funnel templates (system + custom)
 * SIMPLIFIED: Returns hardcoded system templates to avoid DB complexity.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const intent = searchParams.get('intent');
        // const systemOnly = searchParams.get('system_only') === 'true';

        // Filter valid system templates
        let templates = Object.values(SYSTEM_TEMPLATES).map((t: any) => ({
            id: t.id || `temp_${t.key}`,
            name: t.name,
            key: t.key,
            description: t.description || 'System Template',
            intent: t.intent || 'buy', // Default to buy if missing
            is_system: true,
            template_data: t
        }));

        if (intent) {
            templates = templates.filter(t => t.intent === intent);
        }

        return NextResponse.json({
            success: true,
            templates: templates
        });

    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/funnel-templates
 * Create a new custom funnel template
 * DISABLED: Custom templates not supported in MVP.
 */
export async function POST(request: NextRequest) {
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
