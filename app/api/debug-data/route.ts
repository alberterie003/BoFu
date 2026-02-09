import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    // Create direct client using env vars to bypass any potential lib issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Check if env vars are loaded
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing env vars', supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // 1. Get latest lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (leadError) return NextResponse.json({ error: 'Lead Error', details: leadError })
        if (!lead) return NextResponse.json({ message: 'No leads found' })

        // 2. Get associated session
        if (!lead.session_id) {
            return NextResponse.json({
                lead,
                message: 'Lead has no session_id',
            })
        }

        const { data: session, error: sessionError } = await supabase
            .from('funnel_sessions')
            .select('*')
            .eq('id', lead.session_id)
            .single()

        return NextResponse.json({
            lead_id: lead.id,
            session_id: lead.session_id,
            lead_data: lead,
            session_found: !!session,
            session_answers: session?.answers,
            session_status: session?.status,
            session_error: sessionError
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Exception', details: e.message, stack: e.stack })
    }
}
