-- TEMPLATE: Buy a Home in Miami v1
INSERT INTO public.templates (key, name, spec)
VALUES (
  'buy_home_miami_v1',
  'Buy a Home in Miami',
  '{
    "steps": [
      {
        "id": "intent",
        "type": "single_select",
        "title": "What are you looking to do?",
        "options": [
          {"value": "buy", "label": "Buy a Home"},
          {"value": "rent", "label": "Rent a Home"},
          {"value": "luxury", "label": "Luxury Investment"}
        ]
      },
      {
        "id": "qualification",
        "type": "form",
        "title": "Tell us about your needs",
        "fields": [
          {"id": "budget", "type": "select", "label": "Budget Range", "options": ["$300k - $500k", "$500k - $1M", "$1M+"]},
          {"id": "area", "type": "text", "label": "Preferred Area (e.g. Brickell)"},
          {"id": "timeline", "type": "select", "label": "Timeline", "options": ["ASAP", "1-3 Months", "Just Looking"]}
        ]
      },
      {
        "id": "contact",
        "type": "contact",
        "title": "Where should we send the listings?",
        "fields": ["first_name", "email", "phone"]
      },
      {
        "id": "thank_you",
        "type": "message",
        "title": "Thank you!",
        "content": "A dedicated agent will contact you shortly.",
        "whatsapp_enabled": true
      }
    ]
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
