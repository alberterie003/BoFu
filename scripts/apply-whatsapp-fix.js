const MIGRATION_API_URL = 'http://localhost:3000/api/migrations/apply-generic';

async function applyMigration() {
    console.log(`🚀 Triggering WhatsApp Session Column Migration...`);
    try {
        const response = await fetch(MIGRATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                migrationFile: 'add_whatsapp_session_column.sql'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Migration Success:', data);
        } else {
            console.error('❌ Migration Failed:', data);
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

applyMigration();
