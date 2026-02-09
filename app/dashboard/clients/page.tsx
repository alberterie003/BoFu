import { createClient } from '@/lib/supabase/server'
import ClientList from './ClientList'
import { redirect } from 'next/navigation'

export default async function ClientsPage() {
    const supabase = await createClient()

    // Get Current User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get User's Account (and Role)
    const { data: member } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return <div>No account found. Contact support.</div>
    }

    // Get Clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .order('name')

    return (
        <ClientList
            initialClients={clients || []}
            accountId={member.account_id}
        />
    )
}
