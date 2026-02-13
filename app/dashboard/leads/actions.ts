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

export async function assessLead(leadId: string, quality: 'qualified' | 'noise', noiseReason?: string) {
    const supabase = createAdminClient()

    // 1. Update DB
    const updateData: any = {
        qualification_label: quality,
        status: 'processed' // Move out of 'new'
    }

    if (quality === 'noise' && noiseReason) {
        updateData.noise_tag = noiseReason
        updateData.is_noise = true
    }

    await (supabase as any).from('leads').update(updateData).eq('id', leadId)

    // 2. Trigger CAPI (Fire and Forget)
    // We use the absolute URL to call our own API route
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // If Qualified, send positive signal
    if (quality === 'qualified') {
        fetch(`${appUrl}/api/services/meta-capi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, signalType: 'QUALIFIED' })
        }).catch(err => console.error('CAPI Trigger Error:', err))
    }

    revalidatePath('/dashboard/leads')
}
