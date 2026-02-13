-- ============================================
-- CONFIGURE TEST FUNNEL (SAFE)
-- ============================================

-- 1. Insert Funnel for Client with matching Twilio Number
INSERT INTO funnels (
    id, -- Manually setting ID for test predictability
    client_id, 
    template_id, 
    name, 
    slug, 
    is_published, 
    config
)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000', -- KNOWN ID for our test: 550e8400-e29b-41d4-a716-446655440000
    c.id,
    (SELECT id FROM funnel_templates LIMIT 1),
    'WhatsApp Demo Funnel',
    'wa-demo',
    true,
    '{}'
FROM clients c
WHERE c.twilio_phone_number = '13054593411'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = 'WhatsApp Demo Funnel Updated';

-- 2. Verify Steps exist (Create if none)
INSERT INTO funnel_steps (funnel_id, question, field_name, order_index, type)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    '¿Cuál es tu nombre?',
    'name',
    0,
    'text'
WHERE NOT EXISTS (SELECT 1 FROM funnel_steps WHERE funnel_id = '550e8400-e29b-41d4-a716-446655440000');

SELECT id, name FROM funnels WHERE id = '550e8400-e29b-41d4-a716-446655440000';
