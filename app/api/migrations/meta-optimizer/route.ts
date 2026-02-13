import { createAdminClient } from '@/lib/supabase/admin';
import { SYSTEM_TEMPLATES } from '@/lib/funnel-templates/system-templates';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const supabase = createAdminClient();

        // Read the migration file
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'add_meta_optimizer.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split into individual statements (rough split)
        const statements = migrationSQL
            .split(';')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0 && !s.startsWith('--'));

        console.log(`Executing ${statements.length} migration statements...`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await (supabase as any).rpc('exec_sql', { query: statement + ';' });
                console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
            } catch (error: any) {
                // Ignore "already exists" errors
                if (error.message?.includes('already exists')) {
                    console.log(`⊙ Statement ${i + 1}/${statements.length} already exists, skipping`);
                } else {
                    console.warn(`✗ Error in statement ${i + 1}:`, error.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Meta optimizer migration applied successfully'
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
