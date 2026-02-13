// Buy WhatsApp Number from Twilio
// Run with: node buy-whatsapp-number.js

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function buyWhatsAppNumber() {
    try {
        console.log('🔍 Searching for WhatsApp-capable numbers...\n');

        // Search for numbers with SMS capability (WhatsApp uses SMS infrastructure)
        const numbers = await client.availablePhoneNumbers('US')
            .local
            .list({
                smsEnabled: true,
                limit: 10
            });

        if (numbers.length === 0) {
            console.log('❌ No numbers available. Try again later.');
            return;
        }

        const selectedNumber = numbers[0];
        console.log(`✅ Found number: ${selectedNumber.phoneNumber}`);
        console.log(`   Location: ${selectedNumber.locality}, ${selectedNumber.region}\n`);

        console.log('💳 Purchasing number...\n');

        // Purchase the number
        const purchasedNumber = await client.incomingPhoneNumbers.create({
            phoneNumber: selectedNumber.phoneNumber,
            smsUrl: 'https://bo-9yga6fi5d-rene-marrero-s-projects.vercel.app/api/webhooks/twilio',
            smsMethod: 'POST',
            friendlyName: 'BoFu WhatsApp'
        });

        console.log('🎉 SUCCESS! Number purchased!');
        console.log(`📱 Your new number: ${purchasedNumber.phoneNumber}`);
        console.log(`🔗 Webhook configured: ${purchasedNumber.smsUrl}\n`);

        console.log('📝 Next steps:');
        console.log('1. Enable WhatsApp on this number in Twilio console');
        console.log('2. Update database with this number');
        console.log('3. Test the funnel!\n');

        console.log(`UPDATE clients SET twilio_phone_number = '${purchasedNumber.phoneNumber}' WHERE name = 'Miami Luxury Real Estate';`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

buyWhatsAppNumber();
