import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TeamSettings from './TeamSettings'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()

    // 1. Get My Account
    const { data: membership } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

    if (!membership) return <div>No account found.</div>

    // 2. Get All Members
    const { data: members } = await supabase
        .from('account_members')
        .select('*')
        .eq('account_id', membership.account_id)

    // 3. Hydrate with Emails (requires Admin)
    const enrichedMembers = await Promise.all((members || []).map(async (m) => {
        const { data: u } = await adminSupabase.auth.admin.getUserById(m.user_id)
        return {
            ...m,
            email: u.user?.email,
            last_sign_in_at: u.user?.last_sign_in_at
        }
    }))

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">Agency Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your team and agency preferences.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <TeamSettings initialMembers={enrichedMembers} currentUserId={user.id} />
            </div>
        </div>
    )
}
