'use server'

import { createAdminClient } from "@/lib/supabase/admin"

export async function getTemplateId(intent: string) {
    const supabase = createAdminClient() as any
    // Try to find by intent first (new system), then name or key if meaningful
    const { data, error } = await supabase
        .from('funnel_templates')
        .select('id')
        .eq('intent', intent)
        .single()

    if (error) {
        console.error("Error fetching template by intent:", error)
        return null
    }
    return (data as any)?.id
}

export async function getTemplates() {
    const supabase = createAdminClient()
    const { data } = await supabase.from('funnel_templates').select('id, name, intent')
    return data || []
}
