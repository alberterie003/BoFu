// Native fetch in Node 18+

async function checkHealth() {
    try {
        const response = await fetch('http://localhost:3000/api/campaigns/health');
        const data = await response.json();

        console.log('Campaign Health Data:', JSON.stringify(data, null, 2));

        const testCampaign = data.campaigns?.find(c => c.campaign_name === 'test-campaign-1');
        if (testCampaign) {
            console.log('✅ Test Campaign Found!');
            console.log(`   Hot Leads: ${testCampaign.hot_leads}`);
            console.log(`   Total Leads: ${testCampaign.total_leads}`);
        } else {
            console.log('❌ Test Campaign NOT found.');
        }
    } catch (e) {
        console.error('Error fetching health:', e);
    }
}

checkHealth();
