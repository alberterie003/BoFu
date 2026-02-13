import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FunnelList from '../../funnels/FunnelList'
import LeadList from '../../leads/LeadList' // Import LeadList
import { ArrowLeft, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { getTemplates } from '../../funnels/actions'

// Client Component for Tabs (embedded)
import ClientTabs from './ClientTabs'

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params
    const supabase = await createClient()

    // 1. Fetch Client
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

    if (!client) return notFound()

    // 2. Fetch Funnels
    const { data: funnels } = await supabase
        .from('funnels')
        .select('*, client:clients(id, slug), template:funnel_templates(id, name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    // 3. Fetch Leads
    const { data: leads } = await supabase
        .from('leads')
        // Join funnel to get funnel name
        .select('*, funnel:funnels(name, client:clients(name))')
        .eq('funnel.client_id', clientId) // Warning: this filter might not work directly in one go if RLS/join limits. 
    // Better: Fetch all leads for funnels belonging to this client.
    // Or filter in application layer if volume is low.
    // Let's rely on supabase relational filtering if possible, or two steps.

    // 3. Fetch Leads & Analytics (Using Admin Client)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient() as any

    // A. Fetch Leads for this Client
    const { data: clientLeads, count: leadsCount } = await adminClient
        .from('leads')
        .select('*, funnel:funnels!inner(id, name, client_id), session:funnel_sessions(answers)', { count: 'exact' })
        .eq('funnel.client_id', clientId)
        .order('created_at', { ascending: false })

    // B. Fetch Sessions for this Client
    const { count: sessionsCount } = await adminClient
        .from('funnel_sessions')
        .select('id, funnel:funnels!inner(client_id)', { count: 'exact' })
        .eq('funnel.client_id', clientId)

    // C. Calculate Conversion Rate
    const cleanSessions = sessionsCount || 1
    const cleanLeads = leadsCount || 0
    const conversionRate = ((cleanLeads / cleanSessions) * 100).toFixed(1)

    // D. Calculate Top Sources
    const sourcesMap: Record<string, number> = {}
    clientLeads?.forEach((lead: any) => {
        const source = lead.contact_data?.utm_source || 'Direct / Unknown'
        sourcesMap[source] = (sourcesMap[source] || 0) + 1
    })

    const topSources = Object.entries(sourcesMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
            name,
            count,
            percent: ((count / cleanLeads) * 100).toFixed(0)
        }))

    const analyticsData = {
        totalLeads: cleanLeads,
        totalSessions: sessionsCount || 0,
        conversionRate,
        topSources
    }

    // 3. Fetch Templates
    const templates = await getTemplates()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">/{client.slug}</span>
                        {client.whatsapp_number && (
                            <span className="flex items-center gap-1 text-green-600">
                                <Smartphone size={14} /> {client.whatsapp_number}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Tabs Component taking data as props */}
            {/* Tabs Component taking data as props */}
            <ClientTabs
                funnels={
                    <FunnelList
                        initialFunnels={funnels || []}
                        clients={[client]}
                        templates={templates}
                    />
                }
                leads={
                    <LeadList
                        leads={(clientLeads as any) || []}
                        showClientColumn={false}
                    />
                }
                hasNewLeads={clientLeads?.some((l: any) => l.status === 'new')}
                analytics={analyticsData}
            />
        </div>
    )
}
