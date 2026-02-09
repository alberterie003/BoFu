import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ funnelId: string }> }
) {
    const supabase = createAdminClient() as any
    const { funnelId } = await params
    const { trackingData } = await request.json().catch(() => ({ trackingData: {} }))

    // 1. Anti-spam: Rate Limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Verify funnel exists
    const { data: funnel, error } = await supabase
        .from('funnels')
        .select('id')
        .eq('id', funnelId)
        .single()

    if (error || !funnel) {
        return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    const sessionToken = uuidv4()

    const { data: session, error: insertError } = await supabase
        .from('funnel_sessions')
        .insert({
            funnel_id: funnelId,
            session_token: sessionToken,
            step_progress: 0,
            status: 'started',
            answers: trackingData ? { _tracking: trackingData } : {}
        })
        .select()
        .single()

    if (insertError) {
        return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }

    return NextResponse.json({
        sessionId: session.id,
        sessionToken: session.session_token
    })
}
