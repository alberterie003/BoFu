import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ funnelId: string }> }
) {
    const supabase = createAdminClient() as any
    const { funnelId } = await params
    const { sessionToken, contact, company_hp } = await request.json()

    // 1. Anti-spam: Rate Limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Anti-spam: Honeypot
    if (company_hp) {
        // Pretend success
        return NextResponse.json({ success: true, leadId: 'hp-' + Date.now() })
    }

    if (!sessionToken || !contact) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Find Session
    const { data: session, error } = await supabase
        .from('funnel_sessions')
        .select('id, answers')
        .eq('session_token', sessionToken)
        .eq('funnel_id', funnelId)
        .single()

    if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 2. Score Lead
    let temperature = 'cold'
    const answers = (session as any).answers || {}
    const budget = answers['qualification']?.budget
    if (budget === '$1M+' || budget === '$500k - $1M') temperature = 'warm'
    const timeline = answers['qualification']?.timeline
    if (timeline === 'ASAP') temperature = 'hot'
    else if (timeline === '1-3 Months' && temperature !== 'hot') temperature = 'warm'

    // Extract tracking data
    const trackingData = answers._tracking || {}
    const finalContactData = { ...contact, ...trackingData }

    // 3. Create Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            funnel_id: funnelId,
            session_id: session.id,
            contact_data: finalContactData,
            status: 'new',
            temperature: temperature
        })
        .select()
        .single()

    if (leadError) {
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    // 4. Mark session completed
    await supabase.from('funnel_sessions').update({ status: 'completed' }).eq('id', session.id)

    // 5. Create Notification
    const { data: funnel } = await supabase.from('funnels').select('client_id').eq('id', funnelId).single()
    if (funnel) {
        const { data: client } = await supabase.from('clients').select('account_id').eq('id', funnel.client_id).single()
        if (client) {
            await supabase.from('notifications').insert({
                account_id: client.account_id,
                lead_id: lead.id,
                type: 'new_lead',
                is_read: false
            })
        }
    }

    return NextResponse.json({ success: true, leadId: lead.id })
}
