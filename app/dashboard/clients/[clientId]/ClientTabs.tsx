'use client'

import { useState } from 'react'
import { LayoutGrid, Users, BarChart3, TrendingUp, MapPin, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
    totalLeads: number
    totalSessions: number
    conversionRate: string
    topSources: { name: string; count: number; percent: string }[]
}

export default function ClientTabs({ funnels, leads, hasNewLeads, analytics }: { funnels: React.ReactNode, leads: React.ReactNode, hasNewLeads?: boolean, analytics: AnalyticsData }) {
    const [activeTab, setActiveTab] = useState<'funnels' | 'leads' | 'analytics'>('funnels')

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('funnels')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === 'funnels'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <LayoutGrid size={16} />
                    Funnels
                    {activeTab === 'funnels' && (
                        <span className="layout-tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === 'leads'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Users size={16} />
                    Leads
                    {hasNewLeads && (
                        <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block" title="New Leads" />
                    )}
                    {activeTab === 'leads' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === 'analytics'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <BarChart3 size={16} />
                    Analytics
                    {activeTab === 'analytics' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {activeTab === 'funnels' && funnels}
                {activeTab === 'leads' && leads}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.totalLeads}</div>
                                    <p className="text-xs text-muted-foreground">All time volume</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.totalSessions}</div>
                                    <p className="text-xs text-muted-foreground">Unique sessions</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                                    <p className="text-xs text-muted-foreground">Leads / Visitors</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Sources Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Traffic Sources</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.topSources.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No traffic data yet.</p>
                                    ) : (
                                        analytics.topSources.map((source) => (
                                            <div key={source.name} className="flex items-center">
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm font-medium leading-none capitalize">{source.name}</p>
                                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-blue-500 h-full rounded-full"
                                                                style={{ width: `${source.percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-sm text-muted-foreground">
                                                        {source.percent}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
