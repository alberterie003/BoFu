import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/funnels/from-template
 * Create a new funnel from a template
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { template_id, client_id, funnel_name, customizations } = body;

        if (!template_id || !client_id) {
            return NextResponse.json(
                { error: 'template_id and client_id are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get the template
        const { data: templateRaw, error: templateError } = await (supabase as any)
            .from('funnel_templates')
            .select('*')
            .eq('id', template_id)
            .single();

        const template = templateRaw as any;

        if (templateError || !template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Create the funnel
        const { data: funnel, error: funnelError } = await (supabase as any)
            .from('funnels')
            .insert({
                client_id: client_id, // Fix: Ensure this matches body
                name: funnel_name || template.name,
                // template_id: template.id, // Removed: Not in schema according to recent changes? Wait, schema has it.
                // intent: template.intent, // Removed: Not in schema?
                // Using 'any' cast on supabase client to bypass strict type checking for now
                // as database types might be out of sync with recent migrations
                template_id: template.id,
                slug: (funnel_name || template.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Added slug as it is required
                // intent: template.intent // Intent is on template, not funnel directly? Funnel has config.
            })
            .select()
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json(
                { error: funnelError?.message || 'Failed to create funnel' },
                { status: 500 }
            );
        }

        // Create funnel steps from template
        const templateSteps = template.template_data.steps || [];
        const steps = templateSteps.map((step: any, index: number) => ({
            funnel_id: funnel.id,
            step_number: index + 1,
            question_text: step.question,
            question_type: step.type,
            options: step.options || [],
            is_required: step.required !== false,
            placeholder: step.placeholder || null
        }));

        const { error: stepsError } = await supabase
            .from('funnel_steps')
            .insert(steps);

        if (stepsError) {
            // Rollback funnel creation
            await supabase.from('funnels').delete().eq('id', funnel.id);

            return NextResponse.json(
                { error: stepsError.message },
                { status: 500 }
            );
        }

        // Get complete funnel with steps
        const { data: completeFunnel } = await supabase
            .from('funnels')
            .select(`
        *,
        steps:funnel_steps(*)
      `)
            .eq('id', funnel.id)
            .single();

        return NextResponse.json({
            success: true,
            funnel: completeFunnel,
            template_used: template.name
        });

    } catch (error: any) {
        console.error('Error creating funnel from template:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
