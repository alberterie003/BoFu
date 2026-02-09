'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markLeadAsViewed(leadId: string) {
    const supabase = createAdminClient() as any

    // Check if lead is already viewed to avoid unnecessary writes
    const { data: lead } = await supabase.from('leads').select('status').eq('id', leadId).single()

    if (lead && (lead as any).status === 'new') {
        await supabase
            .from('leads')
            .update({ status: 'viewed' })
            .eq('id', leadId)

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/clients/[clientId]', 'page')
    }
}

export async function deleteLead(leadId: string) {
    const supabase = createAdminClient()

    await supabase.from('leads').delete().eq('id', leadId)

    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/clients/[clientId]', 'page')
}
