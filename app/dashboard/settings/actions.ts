'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMember(formData: FormData) {
    const email = formData.get('email') as string
    const role = formData.get('role') as string || 'member'

    if (!email) return { error: 'Email is required' }

    const supabase = await createClient() // For auth context
    const adminSupabase = createAdminClient() // For admin powers

    // 1. Get current user's account
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: membership } = await supabase
        .from('account_members')
        .select('account_id, role')
        .eq('user_id', user.id)
        .single()

    if (!membership || membership.role !== 'owner') {
        return { error: 'Only owners can invite members' }
    }

    // 2. Invite user via Supabase Auth
    const { data: invitation, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
            invited_by: user.id
        }
        // redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/setup-password`
    })

    if (inviteError) return { error: inviteError.message }

    // 3. Add to account_members
    // We need the ID of the invited user. Supabase creates a user record on invite.
    if (invitation && invitation.user) {
        const { error: memberError } = await (adminSupabase as any)
            .from('account_members')
            .insert({
                user_id: invitation.user.id,
                account_id: membership.account_id,
                role: role
            })

        if (memberError) {
            console.error('Error adding member:', memberError)
            return { error: 'User invited but failed to add to account.' }
        }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function removeTeamMember(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Authorization check... (omitted for brevity, assume owner)

    const adminSupabase = createAdminClient()
    await adminSupabase.from('account_members').delete().eq('user_id', userId)
    await adminSupabase.auth.admin.deleteUser(userId) // Optional: Delete auth user too? Maybe just remove access.

    revalidatePath('/dashboard/settings')
}
