const CAPI_MIGRATION_URL = 'http://localhost:3000/api/migrations/apply-capi';

async function applyMigration() {
    console.log(`🚀 Triggering CAPI Migration at ${CAPI_MIGRATION_URL}...`);
    try {
        const response = await fetch(CAPI_MIGRATION_URL, {
            method: 'POST',
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
