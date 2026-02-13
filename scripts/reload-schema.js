const MIGRATION_API_URL = 'http://localhost:3000/api/migrations/apply-generic';

async function reloadSchema() {
    console.log(`🚀 Reloading Schema Cache...`);
    try {
        const response = await fetch(MIGRATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                migrationFile: 'reload_schema.sql'
            })
        });

        const data = await response.json();
        console.log(response.ok ? '✅ Reload Success:' : '❌ Reload Failed:', data);
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

reloadSchema();
