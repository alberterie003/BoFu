'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INTENT_CONFIG = {
    buyer: {
        icon: '🏡',
        title: 'Buyer Qualification',
        description: 'Qualify home buyers for purchase readiness',
        color: 'from-blue-500 to-blue-600'
    },
    seller: {
        icon: '🏘️',
        title: 'Seller Qualification',
        description: 'Qualify home sellers and assess urgency',
        color: 'from-green-500 to-green-600'
    },
    investor: {
        icon: '💰',
        title: 'Investor Qualification',
        description: 'Qualify real estate investors',
        color: 'from-purple-500 to-purple-600'
    },
    renter: {
        icon: '🔑',
        title: 'Renter Qualification',
        description: 'Qualify renters and assess move-in readiness',
        color: 'from-orange-500 to-orange-600'
    }
};

export default function CreateFunnelFromTemplate({ clientId }: { clientId: string }) {
    const router = useRouter();
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
    const [funnelName, setFunnelName] = useState('');
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingFunnel, setCreatingFunnel] = useState(false);

    useEffect(() => {
        if (selectedIntent) {
            fetchTemplates();
        }
    }, [selectedIntent]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/funnel-templates?intent=${selectedIntent}&system_only=true`);
            const data = await res.json();
            if (data.success && data.templates.length > 0) {
                setTemplates(data.templates);
                // Auto-set funnel name from template
                if (!funnelName) {
                    setFunnelName(data.templates[0].name);
                }
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const createFunnel = async () => {
        if (!selectedIntent || !funnelName || templates.length === 0) return;

        setCreatingFunnel(true);
        try {
            const res = await fetch('/api/funnels/from-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: templates[0].id,
                    client_id: clientId,
                    funnel_name: funnelName
                })
            });

            const data = await res.json();

            if (data.success) {
                router.push(`/dashboard/funnels/${data.funnel.id}`);
            } else {
                alert('Error creating funnel: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating funnel:', error);
            alert('Error creating funnel');
        } finally {
            setCreatingFunnel(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Create Funnel from Template</h2>
                <p className="text-muted-foreground">
                    Choose a pre-built template optimized for real estate lead qualification
                </p>
            </div>

            {/* Step 1: Select Intent */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Step 1: Choose Funnel Type</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(INTENT_CONFIG).map(([intent, config]) => (
                        <Card
                            key={intent}
                            className={`cursor-pointer p-6 text-center transition-all hover:shadow-lg ${selectedIntent === intent
                                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : ''
                                }`}
                            onClick={() => setSelectedIntent(intent)}
                        >
                            <div className="text-5xl mb-3">{config.icon}</div>
                            <h4 className="text-lg font-semibold mb-1">{config.title}</h4>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Step 2: Customize (if intent selected) */}
            {selectedIntent && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 2: Customize Funnel</h3>

                    <div>
                        <Label htmlFor="funnelName">Funnel Name</Label>
                        <Input
                            id="funnelName"
                            value={funnelName}
                            onChange={(e) => setFunnelName(e.target.value)}
                            placeholder="e.g., Miami Luxury Buyers Q1 2024"
                            className="mt-1"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground">Loading template...</p>
                        </div>
                    ) : templates.length > 0 ? (
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Template Preview: {templates[0].name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{templates[0].description}</p>
                            <div className="text-sm">
                                <strong>Questions included:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                                    {templates[0].template_data.steps.slice(0, 5).map((step: any, idx: number) => (
                                        <li key={idx}>{step.question}</li>
                                    ))}
                                    {templates[0].template_data.steps.length > 5 && (
                                        <li className="italic">+ {templates[0].template_data.steps.length - 5} more questions</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : null}

                    <Button
                        onClick={createFunnel}
                        disabled={!funnelName || creatingFunnel}
                        className="w-full"
                        size="lg"
                    >
                        {creatingFunnel ? 'Creating Funnel...' : 'Create Funnel'}
                    </Button>
                </div>
            )}
        </div>
    );
}
