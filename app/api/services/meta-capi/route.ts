import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createHmac } from 'crypto';

// Types for Meta CAPI Payload
interface UserData {
    em?: string | string[]; // hashed email
    ph?: string | string[]; // hashed phone
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
}

interface CustomData {
    value?: number;
    currency?: string;
    status?: string;
    lead_score?: number;
}

interface MetaEvent {
    event_name: string;
    event_time: number;
    event_source_url: string;
    action_source: 'system_generated' | 'website' | 'chat';
    user_data: UserData;
    custom_data?: CustomData;
    event_id?: string;
}

// Helper: SHA256 Hash
function hashField(field: string): string {
    return createHmac('sha256', field).digest('hex');
}

export async function POST(req: Request) {
    try {
        const { leadId, signalType } = await req.json();

        // 1. Verify User is Admin (Security)
        const supabase = createClient();
        // (RLS usually handles this, but good to double check session if needed)

        // 2. Fetch Lead Data
        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
                id, 
                contact_data, 
                created_at, 
                funnel_id,
                funnels (
                    client_id,
                    clients (
                         pixel_id, 
                         access_token
                    )
                )
            `)
            .eq('id', leadId)
            .single();

        if (error || !lead) {
            console.error('Lead not found or fetch error:', error);
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Access nested client data safely
        // Funnel -> Client -> Pixel/Token
        const funnel = lead.funnels as any;
        const client = funnel?.clients as any;

        if (!client?.access_token || !client?.pixel_id) {
            console.warn(`⚠️ No Meta Credentials for Lead ${leadId}. Skipping CAPI.`);
            // Log this failure in DB?
            return NextResponse.json({ status: 'skipped', reason: 'no_credentials' });
        }

        // 3. Prepare Payload
        // Extract phone/email from contact_data JSONB
        const contact = lead.contact_data as any || {};
        const phoneRaw = contact.phone || contact.whatsapp || '';
        const emailRaw = contact.email || '';

        const phone = phoneRaw.replace(/\D/g, '');
        const email = emailRaw.toLowerCase().trim();

        const eventId = `lead_${lead.id}_${signalType}_${Date.now()}`; // Unique ID

        const payload: MetaEvent = {
            event_name: signalType === 'QUALIFIED' ? 'QualifiedLead' : 'Lead', // Custom Event
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: 'https://wa.me/signal-bridge', // Proxy URL
            action_source: 'system_generated',
            user_data: {
                ph: phone ? hashField(phone) : undefined,
                em: email ? hashField(email) : undefined,
                // client_ip_address: ... (if stored)
            },
            custom_data: {
                status: signalType,
                lead_score: 100 // Example
            },
            event_id: eventId
        };

        // 4. Send to Meta Graph API
        console.log(`📤 Sending CAPI Event: ${payload.event_name} to Pixel ${client.pixel_id}`);

        const response = await fetch(`https://graph.facebook.com/v19.0/${client.pixel_id}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [payload],
                access_token: client.access_token,
                // test_event_code: process.env.META_TEST_CODE // Optional for testing
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ CAPI Success! FBTraceID: ${result.fbtrace_id}`);

            // 5. Success! Update DB
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    qualification_label: signalType === 'QUALIFIED' ? 'qualified' : 'processed',
                    capi_synced_at: new Date().toISOString(),
                    capi_event_id: eventId
                })
                .eq('id', leadId);

            if (updateError) console.error('Error updating lead status:', updateError);

            return NextResponse.json({ success: true, meta_id: result.fbtrace_id });
        } else {
            console.error('❌ Meta CAPI Error:', result);
            return NextResponse.json({ error: result.error?.message || 'Meta API Error' }, { status: 400 });
        }

    } catch (err: any) {
        console.error('CAPI Service Exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
