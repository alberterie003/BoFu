'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface CampaignHealth {
    campaign_name: string;
    utm_source: string;
    utm_medium: string;
    total_leads: number;
    hot_leads: number;
    warm_leads: number;
    cold_leads: number;
    noise_leads: number;
    avg_score: number;
    qualification_rate: number;
    learning_status: 'learning' | 'active' | 'learning_limited';
    events_this_week: number;
    noise_rate: number;
    alerts: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
    }>;
}

export default function CampaignHealthDashboard() {
    const [campaigns, setCampaigns] = useState<CampaignHealth[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaignHealth();
    }, []);

    const fetchCampaignHealth = async () => {
        try {
            const res = await fetch('/api/campaigns/health');
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.campaigns);
            }
        } catch (error) {
            console.error('Error fetching campaign health:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading campaign data...</p>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="bg-secondary/20 border border-dashed border-secondary rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                    No campaign data yet. Leads need UTM parameters to appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {campaigns.map((campaign, idx) => (
                <Card key={idx} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">{campaign.campaign_name || 'Unnamed Campaign'}</h3>
                            <p className="text-sm text-muted-foreground">
                                {campaign.utm_source} / {campaign.utm_medium}
                            </p>
                        </div>
                        <LearningStatusBadge status={campaign.learning_status} />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <MetricCard
                            label="Total Leads"
                            value={campaign.total_leads}
                        />
                        <MetricCard
                            label="Qualified"
                            value={`${campaign.hot_leads + campaign.warm_leads} (${campaign.qualification_rate}%)`}
                            trend={campaign.qualification_rate >= 40 ? 'up' : 'down'}
                        />
                        <MetricCard
                            label="Noise Rate"
                            value={`${campaign.noise_rate}%`}
                            trend={campaign.noise_rate <= 20 ? 'up' : 'down'}
                        />
                        <MetricCard
                            label="Avg Score"
                            value={campaign.avg_score?.toFixed(0) || '0'}
                            trend={campaign.avg_score >= 60 ? 'up' : 'neutral'}
                        />
                    </div>

                    {/* Lead Quality Breakdown */}
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Lead Quality Distribution:</p>
                        <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
                            {campaign.hot_leads > 0 && (
                                <div
                                    className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                                    style={{ width: `${(campaign.hot_leads / campaign.total_leads) * 100}%` }}
                                >
                                    {campaign.hot_leads > 2 && `🔥 ${campaign.hot_leads}`}
                                </div>
                            )}
                            {campaign.warm_leads > 0 && (
                                <div
                                    className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                                    style={{ width: `${(campaign.warm_leads / campaign.total_leads) * 100}%` }}
                                >
                                    {campaign.warm_leads > 2 && `🟡 ${campaign.warm_leads}`}
                                </div>
                            )}
                            {campaign.cold_leads > 0 && (
                                <div
                                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                                    style={{ width: `${(campaign.cold_leads / campaign.total_leads) * 100}%` }}
                                >
                                    {campaign.cold_leads > 2 && `❄️ ${campaign.cold_leads}`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    {campaign.alerts && campaign.alerts.length > 0 && (
                        <div className="space-y-2">
                            {campaign.alerts.map((alert, alertIdx) => (
                                <Alert key={alertIdx} type={alert.type}>
                                    {alert.message}
                                </Alert>
                            ))}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

function LearningStatusBadge({ status }: { status: string }) {
    const config = {
        active: {
            label: 'Active',
            icon: CheckCircle,
            className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
        },
        learning: {
            label: 'Learning',
            icon: TrendingUp,
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        },
        learning_limited: {
            label: 'Learning Limited',
            icon: AlertTriangle,
            className: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
        }
    };

    const { label, icon: Icon, className } = config[status as keyof typeof config] || config.learning_limited;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
            <Icon className="h-4 w-4" />
            {label}
        </span>
    );
}

function MetricCard({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }) {
    return (
        <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{label}</p>
                {trend && (
                    trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null
                )}
            </div>
            <p className="text-lg font-semibold mt-1">{value}</p>
        </div>
    );
}

function Alert({ type, children }: { type: 'error' | 'warning' | 'info'; children: React.ReactNode }) {
    const config = {
        error: {
            icon: XCircle,
            className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
        },
        warning: {
            icon: AlertTriangle,
            className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300'
        },
        info: {
            icon: CheckCircle,
            className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'
        }
    };

    const { icon: Icon, className } = config[type];

    return (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${className}`}>
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{children}</p>
        </div>
    );
}
