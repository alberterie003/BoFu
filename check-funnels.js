const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunnels() {
    const { data: funnels, error } = await supabase
        .from('funnels')
        .select(`
      id,
      name,
      slug,
      is_published,
      client:clients (
        slug
      )
    `);

    if (error) {
        console.error('Error fetching funnels:', error);
        return;
    }

    console.log('Funnels found:', funnels.length);
    funnels.forEach(f => {
        console.log(`Funnel: ${f.name}`);
        console.log(`  ID: ${f.id}`);
        console.log(`  Slug: ${f.slug}`);
        console.log(`  Client Slug: ${f.client?.slug}`);
        console.log(`  Published: ${f.is_published}`);
        console.log(`  URL should be: /f/${f.client?.slug}/${f.slug}`);
        console.log('---');
    });
}

checkFunnels();
