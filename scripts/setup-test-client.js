const MIGRATION_API_URL = 'http://localhost:3000/api/migrations/apply-generic';

async function configureTestClient() {
    console.log(`🚀 Configuring Test Client (WhatsApp + Funnel)...`);
    try {
        const response = await fetch(MIGRATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                migrationFile: 'configure_test_client.sql'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Configuration Success:', data);
        } else {
            console.error('❌ Configuration Failed:', data);
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

configureTestClient();
