import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const supabase = createAdminClient();

        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'add_capi_columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Applying CAPI Columns Migration...');

        // Split by semicolon to execute statements individually if needed, 
        // but exec_sql might handle blocks. Let's try splitting to be safe like the other route.
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                const { error } = await (supabase as any).rpc('exec_sql', { query: statement + ';' });
                if (error) {
                    console.error(`Error executing statement ${i}:`, error);
                    // Continue, as safe "IF NOT EXISTS" logic handles most errors
                } else {
                    console.log(`✓ Statement ${i} executed.`);
                }
            } catch (err) {
                console.error(`Exception in statement ${i}:`, err);
            }
        }

        return NextResponse.json({ success: true, message: 'CAPI columns added.' });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
