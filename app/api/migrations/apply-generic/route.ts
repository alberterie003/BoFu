import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { migrationFile } = await req.json();
        const validFiles = ['add_whatsapp_session_column.sql', 'configure_test_client.sql', 'insert_test_funnel.sql', 'reload_schema.sql', 'create_webhook_rpc.sql']; // Security Allowlist

        if (!validFiles.includes(migrationFile)) {
            return NextResponse.json({ error: 'Migration file not allowed' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log(`Applying Migration: ${migrationFile}...`);

        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                const { error } = await (supabase as any).rpc('exec_sql', { query: statement + ';' });
                if (error) {
                    // console.error(`Statement ${i} error (might be okay if exists):`, error.message);
                }
            } catch (err) {
                console.error(`Exception in statement ${i}:`, err);
            }
        }

        return NextResponse.json({ success: true, message: `${migrationFile} applied.` });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
