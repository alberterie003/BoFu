import { createClient } from '@/lib/supabase/server'
import LeadList from './LeadList'

export default async function LeadsPage() {
    const supabase = await createClient()

    // 1. Get user's account IDs first for security filtering
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: members } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)

    const accountIds = members?.map(m => m.account_id) || []

    // 2. Use Admin Client to fetch leads + sessions + scores (bypass RLS for join)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient() as any

    // Create a query that filters by account via funnel -> client
    const { data: leads } = await adminClient
        .from('leads')
        .select(`
            *,
            funnel:funnels!inner(
                name, 
                client:clients!inner(
                    name, 
                    account_id
                )
            ),
            session:funnel_sessions(answers),
            scores:lead_qualification_scores(
                timeline_score,
                financial_ready_score,
                specificity_score,
                engagement_score,
                response_speed_score,
                total_score,
                quality_tier
            )
        `)
        .in('funnel.client.account_id', accountIds)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">Recent inquiries across all funnels.</p>
            </div>

            <LeadList leads={leads || []} />
        </div>
    )
}
