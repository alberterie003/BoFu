
-- Update Buyer Template Question
-- Changes "When are you looking to move?" to "When do you plan to purchase?"

UPDATE funnel_templates
SET template_data = '{
  "steps": [
    {
      "type": "multiple_choice",
      "options": [
        {
          "label": "Within 30 days",
          "score": 30,
          "value": "30_days"
        },
        {
          "label": "30-60 days",
          "score": 25,
          "value": "60_days"
        },
        {
          "label": "3-6 months",
          "score": 15,
          "value": "3_6_months"
        },
        {
          "label": "Just exploring",
          "score": 5,
          "value": "exploring"
        }
      ],
      "question": "When do you plan to purchase?",
      "required": true,
      "scoring_component": "timeline"
    },
    {
      "type": "multiple_choice",
      "options": [
        {
          "label": "Yes, pre-approved",
          "score": 30,
          "value": "yes"
        },
        {
          "label": "In progress",
          "score": 20,
          "value": "in_progress"
        },
        {
          "label": "Paying cash",
          "score": 30,
          "value": "cash"
        },
        {
          "label": "Not yet",
          "score": 5,
          "value": "no"
        }
      ],
      "question": "Do you have mortgage pre-approval?",
      "required": true,
      "scoring_component": "financial_ready"
    },
    {
      "type": "multiple_choice",
      "options": [
        {
          "label": "Under $300K",
          "score": 20,
          "value": "under_300k"
        },
        {
          "label": "$300K - $500K",
          "score": 20,
          "value": "300_500k"
        },
        {
          "label": "$500K - $800K",
          "score": 20,
          "value": "500_800k"
        },
        {
          "label": "$800K - $1.5M",
          "score": 20,
          "value": "800_1.5m"
        },
        {
          "label": "$1.5M+",
          "score": 20,
          "value": "1.5m_plus"
        },
        {
          "label": "Flexible/Not sure",
          "score": 5,
          "value": "flexible"
        }
      ],
      "question": "What is your budget range?",
      "required": true,
      "scoring_component": "specificity"
    },
    {
      "type": "text",
      "question": "Which neighborhoods or areas interest you?",
      "required": false,
      "placeholder": "e.g., Brickell, Coral Gables, Miami Beach",
      "scoring_component": "specificity"
    },
    {
      "type": "multiple_choice",
      "options": [
        {
          "label": "1 bedroom",
          "score": 5,
          "value": "1"
        },
        {
          "label": "2 bedrooms",
          "score": 5,
          "value": "2"
        },
        {
          "label": "3 bedrooms",
          "score": 5,
          "value": "3"
        },
        {
          "label": "4+ bedrooms",
          "score": 5,
          "value": "4_plus"
        },
        {
          "label": "Flexible",
          "score": 2,
          "value": "flexible"
        }
      ],
      "question": "How many bedrooms do you need?",
      "required": false,
      "scoring_component": "specificity"
    },
    {
      "type": "email",
      "question": "What is your email?",
      "required": true,
      "scoring_component": "engagement"
    },
    {
      "type": "phone",
      "question": "What is your phone number?",
      "required": true,
      "scoring_component": "engagement"
    }
  ]
}'::jsonb
WHERE intent = 'buyer';

SELECT name, intent FROM funnel_templates WHERE intent = 'buyer';
