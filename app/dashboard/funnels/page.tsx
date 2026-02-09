import { createClient } from '@/lib/supabase/server'
import FunnelList from './FunnelList'
import { getTemplates } from './actions'

export default async function FunnelsPage() {
    const supabase = await createClient()

    // Verify auth again (middleware does it, but RLS relies on it)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // Fetch Funnels + Client info
    // Note: Template join might return null due to RLS, so we fetch templates separately
    const { data: funnels } = await supabase
        .from('funnels')
        .select(`
      *,
      client:clients(id, name, slug)
    `)
        .order('created_at', { ascending: false })

    // Fetch Clients for the create dropdown (Agency mode)
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name, slug')
        .order('name')

    // Fetch Templates (bypass RLS)
    const templates = await getTemplates()

    return (
        <FunnelList
            initialFunnels={funnels || []}
            clients={clients || []}
            templates={templates}
        />
    )
}
