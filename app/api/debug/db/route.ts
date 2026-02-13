import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient() as any

    const { data: clients, error: clientsError } = await supabase.from('clients').select('*')
    const { data: funnels, error: funnelsError } = await supabase.from('funnels').select('*')
    const { data: templates, error: templatesError } = await supabase.from('funnel_templates').select('*')

    return NextResponse.json({
        clients,
        clientsError,
        funnels,
        funnelsError,
        templates,
        templatesError
    })
}
