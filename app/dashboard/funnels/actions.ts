'use server'

import { createAdminClient } from "@/lib/supabase/admin"

export async function getTemplateId(key: string) {
    const supabase = createAdminClient() as any
    const { data, error } = await supabase
        .from('templates')
        .select('id')
        .eq('key', key)
        .single()

    if (error) {
        console.error("Error fetching template:", error)
        return null
    }
    return (data as any)?.id
}

export async function getTemplates() {
    const supabase = createAdminClient()
    const { data } = await supabase.from('templates').select('id, name')
    return data || []
}
