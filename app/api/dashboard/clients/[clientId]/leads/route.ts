import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const supabase = await createClient()
    const { clientId } = await params

    // RLS will handle security, but we double check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get funnels for this client first? Or join leads?
    // Let's get leads where funnel -> client_id = clientId

    // Supabase join syntax:
    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
      *,
      funnel:funnels (
        id,
        name,
        client_id
      )
    `)
        // We need to filter by client_id.
        // However, inner join filtering on nested resource in Supabase JS is:
        // .eq('funnel.client_id', clientId) -> This is surprisingly valid if set up right, but simpler is:
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter in memory for MVP simplicity if RLS allows reading all (it shouldn't due to RLS).
    // Actually RLS for 'leads' says:
    // exists (select 1 from funnels f join clients c ... where f.id = lead.funnel_id ... and am.user_id = auth.uid())

    // So we only see leads we have access to. 
    // But we want to filter by specific clientId from params.

    const clientLeads = leads.filter((lead: any) => lead.funnel?.client_id === clientId)

    return NextResponse.json({ leads: clientLeads })
}
