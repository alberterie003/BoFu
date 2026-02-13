// System funnel templates for real estate intents
// These are pre-built, optimized funnels for different buyer types

export interface FunnelTemplateStep {
    question: string;
    type: 'multiple_choice' | 'text' | 'email' | 'phone';
    options?: Array<{
        value: string;
        label: string;
        score?: number;
        disqualify?: boolean;
    }>;
    placeholder?: string;
    scoring_component?: 'timeline' | 'financial_ready' | 'specificity' | 'engagement';
    scoring_rule?: string;
    required?: boolean;
}

export interface FunnelTemplate {
    name: string;
    intent: 'buyer' | 'seller' | 'investor' | 'renter' | 'custom';
    description: string;
    is_system: boolean;
    template_data: {
        steps: FunnelTemplateStep[];
    };
}

export const BUYER_TEMPLATE: FunnelTemplate = {
    name: "Buyer Qualification",
    intent: "buyer",
    description: "Optimized funnel to qualify home buyers for purchase readiness and timeline",
    is_system: true,
    template_data: {
        steps: [
            {
                question: "When are you looking to move?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "30_days", label: "Within 30 days", score: 30 },
                    { value: "60_days", label: "30-60 days", score: 25 },
                    { value: "3_6_months", label: "3-6 months", score: 15 },
                    { value: "exploring", label: "Just exploring", score: 5 }
                ],
                scoring_component: "timeline"
            },
            {
                question: "Do you have mortgage pre-approval?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "yes", label: "Yes, pre-approved", score: 30 },
                    { value: "in_progress", label: "In progress", score: 20 },
                    { value: "cash", label: "Paying cash", score: 30 },
                    { value: "no", label: "Not yet", score: 5 }
                ],
                scoring_component: "financial_ready"
            },
            {
                question: "What's your budget range?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "under_300k", label: "Under $300K", score: 20 },
                    { value: "300_500k", label: "$300K - $500K", score: 20 },
                    { value: "500_800k", label: "$500K - $800K", score: 20 },
                    { value: "800_1.5m", label: "$800K - $1.5M", score: 20 },
                    { value: "1.5m_plus", label: "$1.5M+", score: 20 },
                    { value: "flexible", label: "Flexible/Not sure", score: 5 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "Which neighborhoods or areas interest you?",
                type: "text",
                required: false,
                placeholder: "e.g., Brickell, Coral Gables, Miami Beach",
                scoring_component: "specificity"
            },
            {
                question: "How many bedrooms do you need?",
                type: "multiple_choice",
                required: false,
                options: [
                    { value: "1", label: "1 bedroom", score: 5 },
                    { value: "2", label: "2 bedrooms", score: 5 },
                    { value: "3", label: "3 bedrooms", score: 5 },
                    { value: "4_plus", label: "4+ bedrooms", score: 5 },
                    { value: "flexible", label: "Flexible", score: 2 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "What's your email?",
                type: "email",
                required: true,
                scoring_component: "engagement"
            },
            {
                question: "What's your phone number?",
                type: "phone",
                required: true,
                scoring_component: "engagement"
            }
        ]
    }
};

export const SELLER_TEMPLATE: FunnelTemplate = {
    name: "Seller Qualification",
    intent: "seller",
    description: "Optimized funnel to qualify home sellers and assess urgency",
    is_system: true,
    template_data: {
        steps: [
            {
                question: "Do you currently own the property you want to sell?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "yes", label: "Yes, I own it", score: 30 },
                    { value: "no", label: "No", score: 0, disqualify: true }
                ],
                scoring_component: "financial_ready"
            },
            {
                question: "When are you planning to sell?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "asap", label: "ASAP (within 30 days)", score: 30 },
                    { value: "1_3_months", label: "1-3 months", score: 25 },
                    { value: "3_6_months", label: "3-6 months", score: 15 },
                    { value: "exploring", label: "Just exploring home value", score: 5 }
                ],
                scoring_component: "timeline"
            },
            {
                question: "What type of property is it?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "single_family", label: "Single-family home", score: 15 },
                    { value: "condo", label: "Condo/Apartment", score: 15 },
                    { value: "townhouse", label: "Townhouse", score: 15 },
                    { value: "multi_unit", label: "Multi-unit property", score: 15 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "What's your property address or neighborhood?",
                type: "text",
                required: true,
                placeholder: "e.g., 123 Main St, Miami or Coral Gables",
                scoring_component: "specificity"
            },
            {
                question: "Are you currently working with a real estate agent?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "no", label: "No, looking for one", score: 20 },
                    { value: "yes_open", label: "Yes, but open to talking", score: 10 },
                    { value: "yes_exclusive", label: "Yes, I have an exclusive contract", score: 0, disqualify: true }
                ],
                scoring_component: "engagement"
            },
            {
                question: "What's your email?",
                type: "email",
                required: true,
                scoring_component: "engagement"
            },
            {
                question: "What's your phone number?",
                type: "phone",
                required: true,
                scoring_component: "engagement"
            }
        ]
    }
};

export const INVESTOR_TEMPLATE: FunnelTemplate = {
    name: "Investor Qualification",
    intent: "investor",
    description: "Optimized funnel to qualify real estate investors and assess experience level",
    is_system: true,
    template_data: {
        steps: [
            {
                question: "What's your investment strategy?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "fix_flip", label: "Fix and flip", score: 20 },
                    { value: "buy_hold", label: "Buy and hold (rental income)", score: 20 },
                    { value: "commercial", label: "Commercial real estate", score: 20 },
                    { value: "wholesale", label: "Wholesaling", score: 15 },
                    { value: "exploring", label: "Just exploring options", score: 5 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "How will you finance the purchase?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "all_cash", label: "All cash", score: 30 },
                    { value: "conventional", label: "Conventional financing", score: 20 },
                    { value: "hard_money", label: "Hard money loan", score: 25 },
                    { value: "depends", label: "Depends on the deal", score: 15 },
                    { value: "unsure", label: "Not sure yet", score: 5 }
                ],
                scoring_component: "financial_ready"
            },
            {
                question: "What's your investment experience level?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "seasoned", label: "Seasoned (5+ properties)", score: 15 },
                    { value: "intermediate", label: "Intermediate (2-4 properties)", score: 15 },
                    { value: "first_time", label: "First investment property", score: 10 },
                    { value: "no_experience", label: "No experience, learning", score: 5 }
                ],
                scoring_component: "engagement"
            },
            {
                question: "What's your target price range?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "under_200k", label: "Under $200K", score: 15 },
                    { value: "200_400k", label: "$200K - $400K", score: 15 },
                    { value: "400_600k", label: "$400K - $600K", score: 15 },
                    { value: "600k_1m", label: "$600K - $1M", score: 15 },
                    { value: "1m_plus", label: "$1M+", score: 15 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "When are you looking to purchase?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "30_days", label: "Within 30 days", score: 30 },
                    { value: "1_3_months", label: "1-3 months", score: 25 },
                    { value: "3_6_months", label: "3-6 months", score: 15 },
                    { value: "monitoring", label: "Monitoring market", score: 10 }
                ],
                scoring_component: "timeline"
            },
            {
                question: "What's your email?",
                type: "email",
                required: true,
                scoring_component: "engagement"
            },
            {
                question: "What's your phone number?",
                type: "phone",
                required: true,
                scoring_component: "engagement"
            }
        ]
    }
};

export const RENTER_TEMPLATE: FunnelTemplate = {
    name: "Renter Qualification",
    intent: "renter",
    description: "Optimized funnel to qualify renters and assess move-in readiness",
    is_system: true,
    template_data: {
        steps: [
            {
                question: "When do you need to move in?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "asap", label: "ASAP (within 2 weeks)", score: 30 },
                    { value: "30_days", label: "Within 30 days", score: 25 },
                    { value: "60_days", label: "30-60 days", score: 20 },
                    { value: "flexible", label: "Flexible/Just looking", score: 5 }
                ],
                scoring_component: "timeline"
            },
            {
                question: "What's your monthly rent budget?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "under_1500", label: "Under $1,500", score: 15 },
                    { value: "1500_2500", label: "$1,500 - $2,500", score: 15 },
                    { value: "2500_3500", label: "$2,500 - $3,500", score: 15 },
                    { value: "3500_plus", label: "$3,500+", score: 15 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "How many bedrooms do you need?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "studio", label: "Studio", score: 10 },
                    { value: "1", label: "1 bedroom", score: 10 },
                    { value: "2", label: "2 bedrooms", score: 10 },
                    { value: "3_plus", label: "3+ bedrooms", score: 10 }
                ],
                scoring_component: "specificity"
            },
            {
                question: "Which areas are you interested in?",
                type: "text",
                required: false,
                placeholder: "e.g., Downtown, Brickell, Wynwood",
                scoring_component: "specificity"
            },
            {
                question: "What's your current employment status?",
                type: "multiple_choice",
                required: true,
                options: [
                    { value: "full_time", label: "Full-time employed", score: 20 },
                    { value: "self_employed", label: "Self-employed", score: 15 },
                    { value: "student", label: "Student", score: 10 },
                    { value: "other", label: "Other", score: 5 }
                ],
                scoring_component: "financial_ready"
            },
            {
                question: "What's your email?",
                type: "email",
                required: true,
                scoring_component: "engagement"
            },
            {
                question: "What's your phone number?",
                type: "phone",
                required: true,
                scoring_component: "engagement"
            }
        ]
    }
};

// Export all templates as an array
export const SYSTEM_TEMPLATES: FunnelTemplate[] = [
    BUYER_TEMPLATE,
    SELLER_TEMPLATE,
    INVESTOR_TEMPLATE,
    RENTER_TEMPLATE
];

// Helper to get template by intent
export function getTemplateByIntent(intent: string): FunnelTemplate | undefined {
    return SYSTEM_TEMPLATES.find(t => t.intent === intent);
}
