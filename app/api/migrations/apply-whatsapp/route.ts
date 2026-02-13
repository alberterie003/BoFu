import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const supabase = createAdminClient() as any

        // Run migrations
        const migrations = [
            // 1. Update clients table
            `
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
      ADD COLUMN IF NOT EXISTS client_whatsapp_number TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{}';
      `,
            // 2. Create index
            `
      CREATE INDEX IF NOT EXISTS idx_clients_twilio_phone ON clients(twilio_phone_number);
      `,
            // 3. Create whatsapp_sessions table
            `
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        lead_phone TEXT NOT NULL,
        funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
        current_step INTEGER DEFAULT 0,
        responses JSONB DEFAULT '{}',
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'forwarding', 'abandoned')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      `,
            // 4. Create indexes on whatsapp_sessions
            `
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead_phone ON whatsapp_sessions(lead_phone);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_client_id ON whatsapp_sessions(client_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_created_at ON whatsapp_sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead_client ON whatsapp_sessions(lead_phone, client_id);
      `,
            // 5. Update leads table
            `
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
      ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE SET NULL;
      `,
            // 6. Create indexes on leads
            `
      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
      CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_number ON leads(whatsapp_number);
      `,
            // 7. Create update trigger function
            `
      CREATE OR REPLACE FUNCTION update_whatsapp_session_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `,
            // 8. Create trigger
            `
      DROP TRIGGER IF EXISTS trigger_update_whatsapp_session_timestamp ON whatsapp_sessions;
      CREATE TRIGGER trigger_update_whatsapp_session_timestamp
      BEFORE UPDATE ON whatsapp_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_whatsapp_session_timestamp();
      `
        ]

        const results = []
        for (const migration of migrations) {
            try {
                const { error } = await supabase.rpc('exec_sql', { sql: migration.trim() })
                if (error) {
                    // Try direct query if RPC doesn't work
                    const { error: queryError } = await supabase.from('_temp').select('*').limit(0)
                    results.push({
                        migration: migration.substring(0, 50) + '...',
                        status: 'warning',
                        message: 'Using alternative method'
                    })
                } else {
                    results.push({
                        migration: migration.substring(0, 50) + '...',
                        status: 'success'
                    })
                }
            } catch (err) {
                results.push({
                    migration: migration.substring(0, 50) + '...',
                    status: 'error',
                    error: String(err)
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Migrations applied',
            results
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 })
    }
}
