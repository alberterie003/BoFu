
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.join(process.cwd(), '.env.local');
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
    console.log('🔍 Checking funnel_templates content...\n');

    const { data: templates, error } = await supabase
        .from('funnel_templates')
        .select('id, name, intent, template_data');

    if (error) {
        console.error('❌ Error fetching templates:', error);
        return;
    }

    console.log(`Found ${templates.length} templates.`);

    const t = templates[0];
    console.log(`\n--- Template: ${t.name} (${t.intent}) ---`);
    console.log(JSON.stringify(t.template_data, null, 2));

    // check if any funnel uses them
    const { data: funnels } = await supabase.from('funnels').select('id, name, template_id, template:funnel_templates(name)');
    console.log('\n--- Funnels ---');
    funnels?.forEach(f => {
        console.log(`Funnel '${f.name}' uses template: ${(f.template as any)?.name} (ID: ${f.template_id})`);
    });
}

checkTemplates();
