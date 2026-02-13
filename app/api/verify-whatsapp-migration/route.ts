import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const supabase = createAdminClient() as any

        // Check if whatsapp_sessions table exists
        const { data: sessions, error: sessionsError } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .limit(1)

        // Check if clients has new columns
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, twilio_phone_number, client_whatsapp_number')
            .limit(1)

        // Check if leads has new columns
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, source, whatsapp_number')
            .limit(1)

        return NextResponse.json({
            success: true,
            checks: {
                whatsapp_sessions_table: {
                    exists: !sessionsError,
                    error: sessionsError?.message || null
                },
                clients_columns: {
                    exists: !clientsError,
                    sample: clients?.[0] || null,
                    error: clientsError?.message || null
                },
                leads_columns: {
                    exists: !leadsError,
                    sample: leads?.[0] || null,
                    error: leadsError?.message || null
                }
            }
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 })
    }
}
