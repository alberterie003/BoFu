import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ funnelId: string }> }
) {
    const supabase = createAdminClient() as any
    const { funnelId } = await params
    const { sessionToken, answers, stepIndex, company_hp } = await request.json()

    // 1. Anti-spam: Rate Limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Anti-spam: Honeypot
    if (company_hp) {
        // Pretend success
        return NextResponse.json({ success: true })
    }

    if (!sessionToken) {
        return NextResponse.json({ error: 'Missing session token' }, { status: 400 })
    }

    // Find session
    const { data: session, error } = await supabase
        .from('funnel_sessions')
        .select('id, answers, step_progress')
        .eq('session_token', sessionToken)
        .eq('funnel_id', funnelId)
        .single()

    if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Merge answers
    // @ts-ignore
    const newAnswers = { ...session.answers, ...answers }
    const newProgress = Math.max(session.step_progress, stepIndex)

    const { error: updateError } = await supabase
        .from('funnel_sessions')
        .update({
            answers: newAnswers,
            step_progress: newProgress,
            updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
