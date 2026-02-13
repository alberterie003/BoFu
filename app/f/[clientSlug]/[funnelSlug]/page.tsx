import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import FunnelClient from './FunnelClient'
import { Metadata } from 'next'

// Generate Metadata for SEO
export async function generateMetadata(
    { params }: { params: Promise<{ clientSlug: string; funnelSlug: string }> }
): Promise<Metadata> {
    const supabase = createAdminClient() as any
    const { clientSlug, funnelSlug } = await params

    // Fetch basic info for SEO
    const { data: funnelData } = await supabase
        .from('funnels')
        .select('name')
        .eq('slug', funnelSlug)
        .single()
    const funnel = funnelData as any

    return {
        title: funnel?.name || 'Loading...',
        description: 'Exclusive Real Estate Opportunities in Miami',
        openGraph: {
            title: funnel?.name,
        }
    }
}

export default async function FunnelPage({
    params,
    searchParams,
}: {
    params: Promise<{ clientSlug: string; funnelSlug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { clientSlug, funnelSlug } = await params
    const resolvedSearchParams = await searchParams

    // Extract UTMs and other tracking info
    const trackingData = {
        utm_source: resolvedSearchParams.utm_source as string,
        utm_medium: resolvedSearchParams.utm_medium as string,
        utm_campaign: resolvedSearchParams.utm_campaign as string,
        utm_term: resolvedSearchParams.utm_term as string,
        utm_content: resolvedSearchParams.utm_content as string,
        referer: resolvedSearchParams.referer as string, // Sometimes passed manually
    }

    // Use Admin Client to bypass RLS for public access
    const supabase = createAdminClient()

    // 1. Get Client
    const { data: clientData } = await supabase
        .from('clients')
        .select('id, whatsapp_number, slug')
        .eq('slug', clientSlug)
        .single()
    const client = clientData as any

    if (!client) return notFound()

    // 2. Get Funnel
    const { data: funnelData } = await supabase
        .from('funnels')
        .select(`
      id,
      name,
      config,
      is_published,
      template:funnel_templates (
        template_data
      )
    `)
        .eq('client_id', client.id)
        .eq('slug', funnelSlug)
        .single()
    const funnel = funnelData as any

    if (!funnel) return notFound()

    // Strict publish check (or add preview logic later)
    if (!funnel.is_published) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-xl text-center border border-gray-100">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Funnel Not Published</h1>
                    <p className="text-gray-600 mb-6">This funnel is currently in draft mode.</p>
                    <a href="/dashboard/funnels" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    // Merge configs (Advanced logic for future, for now MVP uses template spec mostly)
    // MVP: We pass template spec as the main config
    // The 'config' field in funnels table is for overrides (colors, validation rules, specific texts)
    // For MVP we just pass template spec as the structure.

    // Safety: ensure template exists
    if (!funnel.template) {
        // Fallback or 404? 
        console.error(`Funnel ${funnel.id} has no template joined.`)
        return notFound()
    }

    // Transform DB steps to FunnelClient expected format
    const rawSteps = (funnel.template as any).template_data?.steps || []

    // Helper to map question text to ID for scoring
    const getStepId = (question: string, type: string) => {
        const q = question.toLowerCase()
        if (q.includes('budget')) return 'budget'
        if (q.includes('move') || q.includes('time')) return 'timeline'
        if (q.includes('mortgage') || q.includes('cash') || q.includes('financing')) return 'pre_approval'
        if (q.includes('neighborhood') || q.includes('area')) return 'neighborhoods'
        if (q.includes('bedroom')) return 'bedrooms'
        return q.replace(/[^a-z0-9]+/g, '_').substring(0, 30)
    }

    const transformedSteps = rawSteps
        .filter((s: any) => s.type !== 'email' && s.type !== 'phone') // Remove explicit contact steps, we'll add a group one
        .map((s: any) => {
            // Use explicit scoring component from DB if available, otherwise fallback to heuristics
            const id = s.scoring_component || getStepId(s.question || '', s.type)

            // Map types
            if (s.type === 'multiple_choice') {
                return {
                    id,
                    type: 'single_select',
                    title: s.question,
                    options: s.options
                }
            }
            if (s.type === 'text') {
                return {
                    id,
                    type: 'form',
                    title: s.question,
                    fields: [{ id: id, type: 'text', label: s.placeholder || 'Your answer', options: s.options }]
                }
            }
            return {
                id,
                type: 'single_select', // Fallback
                title: s.question,
                options: []
            }
        })

    // Add Contact Step
    transformedSteps.push({
        id: 'contact_info',
        type: 'contact',
        title: 'Where should we send the listings?',
        fields: ['name', 'email', 'phone']
    })

    // Add Thank You Step
    transformedSteps.push({
        id: 'thank_you',
        type: 'message',
        title: 'Thank you!',
        content: 'Your request has been received.',
        whatsapp_enabled: true
    })

    const templateSpec = { steps: transformedSteps }

    return (
        <FunnelClient
            funnelId={funnel.id}
            config={funnel.config as any}
            templateSpec={templateSpec}
            whatsappNumber={client.whatsapp_number}
            trackingData={trackingData}
        />
    )
}
