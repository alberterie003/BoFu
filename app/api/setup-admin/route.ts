import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (process.env.NODE_ENV === 'production' && secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() as any
    const email = 'admin@bofu.com'
    const password = process.env.ADMIN_PASSWORD || 'admin' // Configurable password

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

    // Template seeding removed. Use migration SQL.

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
