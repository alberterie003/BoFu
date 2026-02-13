-- ============================================
-- FORCE TEST CLIENT UPDATE
-- ============================================

-- Option 1: Update existing demo client if found
UPDATE clients 
SET twilio_phone_number = '+13054593411', 
    client_whatsapp_number = '+15559876543'
WHERE slug = 'demo-realty' OR name ILIKE '%demo%';

-- Option 2: If no rows updated (how to check in SQL script? tricky), 
-- just insert a new one if it doesn't exist.
INSERT INTO clients (account_id, name, slug, twilio_phone_number, client_whatsapp_number)
SELECT 
    (SELECT id FROM accounts LIMIT 1),
    'Demo Realty Miami',
    'demo-realty',
    '+13054593411',
    '+15559876543'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE twilio_phone_number = '+13054593411');

-- 3. Verify
SELECT id, name, twilio_phone_number FROM clients;
