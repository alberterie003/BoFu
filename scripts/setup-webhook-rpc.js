const MIGRATION_API_URL = 'http://localhost:3000/api/migrations/apply-generic';

async function setupRPC() {
    console.log(`🚀 Creating Funnel RPC...`);
    try {
        const response = await fetch(MIGRATION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                migrationFile: 'create_webhook_rpc.sql'
            })
        });

        const data = await response.json();
        console.log(response.ok ? '✅ RPC Success:' : '❌ RPC Failed:', data);
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

setupRPC();
