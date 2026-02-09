import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Filter, BarChart3, TrendingUp, MapPin } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use Admin Client for Analytics Aggregation (Bypass RLS for accurate stats)
    const adminDb = createAdminClient() as any

    // 1. Fetch Total Leads
    const { count: leadsCount, data: allLeads } = await adminDb
        .from('leads')
        .select('contact_data', { count: 'exact' })

    // 2. Fetch Total Sessions (Visits)
    const { count: sessionsCount } = await adminDb
        .from('funnel_sessions')
        .select('id', { count: 'exact' })

    // 3. Fetch Active Funnels
    const { count: funnelsCount } = await adminDb
        .from('funnels')
        .select('id', { count: 'exact' })
        .eq('is_published', true)

    // 4. Fetch Recent Activity
    const { data: recentLeads } = await adminDb
        .from('leads')
        .select('*, funnel:funnels(name)')
        .order('created_at', { ascending: false })
        .limit(5)

    // --- Calculations ---

    // A. Conversion Rate
    // (Leads / Sessions) * 100
    // Note: Sessions includes the lead session itself.
    const cleanSessions = sessionsCount || 1 // Avoid div by zero
    const cleanLeads = leadsCount || 0
    const conversionRate = ((cleanLeads / cleanSessions) * 100).toFixed(1)

    // B. Traffic Sources Aggregation
    const sourcesMap: Record<string, number> = {}
    allLeads?.forEach((lead: any) => {
        const source = lead.contact_data?.utm_source || 'Direct / Unknown'
        sourcesMap[source] = (sourcesMap[source] || 0) + 1
    })

    // Sort by count desc
    const topSources = Object.entries(sourcesMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5) // Top 5
        .map(([name, count]) => ({
            name,
            count,
            percent: ((count / cleanLeads) * 100).toFixed(0)
        }))


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground">Welcome back, {user?.email}</p>
            </div>

            {/* KPI GRID */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leadsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Lifetime volume</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Funnels</CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{funnelsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Published & Live</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Unique sessions</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{conversionRate}%</div>
                            <p className="text-xs text-muted-foreground">Leads / Visitors</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Traffic Sources */}
                {/* Traffic Sources */}
                <div className="col-span-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Top Traffic Sources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topSources.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No traffic data yet.</p>
                                ) : (
                                    topSources.map((source) => (
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

                {/* Recent Activity */}
                <div className="col-span-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Leads</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Name</th>
                                            <th className="px-6 py-3 font-medium">Funnel</th>
                                            <th className="px-6 py-3 font-medium">Source</th>
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentLeads?.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No leads yet.</td>
                                            </tr>
                                        )}
                                        {recentLeads?.map((lead: any) => (
                                            <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {(lead.contact_data as any).name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {(lead.funnel as any)?.name}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground capitalize">
                                                    {(lead.contact_data as any).utm_source || 'Direct'}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {lead.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
