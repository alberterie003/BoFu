import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient() as any

    const email = 'admin@bofu.com'
    const password = 'admin' // Simple for MVP

    // Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers()
    let user = users.users.find((u: any) => u.email === email)

    if (!user) {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Admin User' }
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        user = data.user || undefined
    }

    if (!user) return NextResponse.json({ error: 'User not found/created' }, { status: 500 })

    // Check if account member exists
    const { data: member } = await supabase.from('account_members').select('*').eq('user_id', user.id).single()

    if (!member) {
        // Create Account
        const { data: account, error: accError } = await supabase.from('accounts').insert({
            name: 'BoFu Agency',
            type: 'agency'
        }).select().single()

        if (accError) return NextResponse.json({ error: accError.message }, { status: 500 })

        if (account) {
            // Add Member
            await supabase.from('account_members').insert({
                user_id: user.id,
                account_id: account.id,
                role: 'owner'
            })

            // Create a Client too
            await supabase.from('clients').insert({
                account_id: account.id,
                name: 'Miami Luxury Real Estate',
                slug: 'miami-luxury'
            })
        }
        return NextResponse.json({ success: true, message: 'Admin account created', credentials: { email, password } })
    }

    // Seed Templates
    const { error: templateError } = await supabase.from('templates').upsert({
        key: 'buy_home_miami_v1',
        name: 'Buy a Home in Miami',
        spec: {
            "steps": [
                {
                    "id": "intent",
                    "type": "single_select",
                    "title": "What are you looking to do?",
                    "options": [
                        { "value": "buy", "label": "Buy a Home" },
                        { "value": "rent", "label": "Rent a Home" },
                        { "value": "luxury", "label": "Luxury Investment" }
                    ]
                },
                {
                    "id": "qualification",
                    "type": "form",
                    "title": "Tell us about your needs",
                    "fields": [
                        { "id": "budget", "type": "select", "label": "Budget Range", "options": ["$300k - $500k", "$500k - $1M", "$1M+"] },
                        { "id": "area", "type": "text", "label": "Preferred Area (e.g. Brickell)" },
                        { "id": "timeline", "type": "select", "label": "Timeline", "options": ["ASAP", "1-3 Months", "Just Looking"] }
                    ]
                },
                {
                    "id": "contact",
                    "type": "contact",
                    "title": "Where should we send the listings?",
                    "fields": ["first_name", "email", "phone"]
                },
                {
                    "id": "thank_you",
                    "type": "message",
                    "title": "Thank you!",
                    "content": "A dedicated agent will contact you shortly.",
                    "whatsapp_enabled": true
                }
            ]
        }
    }, { onConflict: 'key' })

    if (templateError) {
        console.error("Template Seed Error:", templateError)
    }

    // Debug: Check funnels
    const { data: funnels } = await supabase.from('funnels').select('id, name, slug, is_published, client:clients(slug)')

    // FIX SLUGS ON THE FLY
    // Helper to sanitize
    const sanitize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')

    // Fix Clients
    const { data: allClients } = await supabase.from('clients').select('id, slug, name')
    if (allClients) {
        for (const c of allClients) {
            const newSlug = sanitize(c.slug)
            if (newSlug !== c.slug) {
                console.log(`Fixing Client ${c.name}: '${c.slug}' -> '${newSlug}'`)
                await supabase.from('clients').update({ slug: newSlug }).eq('id', c.id)
            }
        }
    }

    // Fix Funnels
    const { data: allFunnels } = await supabase.from('funnels').select('id, slug, name')
    if (allFunnels) {
        for (const f of allFunnels) {
            const newSlug = sanitize(f.slug)
            if (newSlug !== f.slug) {
                console.log(`Fixing Funnel ${f.name}: '${f.slug}' -> '${newSlug}'`)
                await supabase.from('funnels').update({ slug: newSlug }).eq('id', f.id)
            }
        }
    }

    // Fetch again to show updated
    const { data: updatedFunnels } = await supabase.from('funnels').select('id, name, slug, is_published, client:clients(slug)')
    console.log('DEBUG FUNNELS (Fixed):', JSON.stringify(updatedFunnels, null, 2))

    return NextResponse.json({
        message: 'Admin setup complete. Templates seeded. Slugs fixed.',
        credentials: { email, password },
        funnels: updatedFunnels
    })
}
