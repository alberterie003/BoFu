const MIGRATION_API_URL = 'http://localhost:3000/api/migrations/apply-generic';

async function setupFunnel() {
    console.log(`🚀 Setting up Test Funnel...`);
    try {
        const response = await fetch(MIGRATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                migrationFile: 'insert_test_funnel.sql'
            })
        });

        const data = await response.json();
        console.log(response.ok ? '✅ Funnel Success:' : '❌ Funnel Failed:', data);
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

setupFunnel();
