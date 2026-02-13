import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    console.log('🔍 Checking Schema Status...');

    // Check 1: WhatsApp columns in clients
    const { data: clients, error: cError } = await supabase
        .from('clients')
        .select('twilio_phone_number')
        .limit(1);

    if (cError) {
        console.error('❌ Error checking clients table:', cError.message);
        if (cError.message.includes('does not exist') || cError.code === '42703') { // undefined_column
            console.log('   -> WhatsApp columns missing in clients table.');
        }
    } else {
        console.log('✅ WhatsApp columns exist in clients table.');
    }

    // Check 2: verify whatsapp_sessions table exists
    const { error: sError } = await supabase
        .from('whatsapp_sessions')
        .select('id')
        .limit(1);

    if (sError) {
        if (sError.code === '42P01') { // undefined_table
            console.log('❌ Table "whatsapp_sessions" DOES NOT exist.');
        } else {
            console.error('❌ Error checking whatsapp_sessions:', sError.message);
        }
    } else {
        console.log('✅ Table "whatsapp_sessions" exists.');
    }
}

checkSchema();
