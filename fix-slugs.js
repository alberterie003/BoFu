const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function sanitize(slug) {
    if (!slug) return slug;
    // Replace spaces with -, remove non-url chars, remove multiple dashes, trim dashes
    return slug.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

async function fixSlugs() {
    console.log('Fixing Client Slugs...');
    const { data: clients } = await supabase.from('clients').select('id, slug, name');
    for (const c of clients) {
        const newSlug = sanitize(c.slug);
        if (newSlug !== c.slug) {
            console.log(`Updating Client ${c.name}: '${c.slug}' -> '${newSlug}'`);
            await supabase.from('clients').update({ slug: newSlug }).eq('id', c.id);
        }
    }

    console.log('Fixing Funnel Slugs...');
    const { data: funnels } = await supabase.from('funnels').select('id, slug, name');
    for (const f of funnels) {
        const newSlug = sanitize(f.slug);
        if (newSlug !== f.slug) {
            console.log(`Updating Funnel ${f.name}: '${f.slug}' -> '${newSlug}'`);
            await supabase.from('funnels').update({ slug: newSlug }).eq('id', f.id);
        }
    }
    console.log('Done.');
}

fixSlugs();
