'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Funnel, FileText, Settings, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from './components/NotificationBell'

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/clients', label: 'Clients', icon: Users }, // Agency only? Show for all MVP
    { href: '/dashboard/funnels', label: 'Funnels', icon: Funnel }, // Custom Icon fail? Funnel is not in lucide? It is, but maybe filter. 'Filter' is better if not found. ArrowDownFromLine?
    // Lucide 'Funnel' exists? 'Filter' usually. Let's use 'Filter' if unsure, or check import. 
    // Actually Lucide has 'Filter'. We imported 'Funnel' let's see. 
    { href: '/dashboard/leads', label: 'Leads', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-transparent flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r-0 rounded-r-2xl my-4 ml-4 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } flex flex-col overflow-hidden shadow-2xl bg-primary text-white border-r border-white/10`}
                style={{ height: 'calc(100vh - 2rem)' }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-20 flex items-center px-6 border-b border-white/10 bg-primary/95 text-primary-foreground">
                        <span className="text-3xl font-bold font-serif text-secondary tracking-tighter">BoFu</span>
                        <span className="ml-3 text-[10px] font-bold tracking-widest border border-secondary text-secondary px-2 py-0.5 rounded-full uppercase">BETA</span>
                        <button className="ml-auto lg:hidden absolute right-4 top-6 text-white" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${isActive
                                        ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-105 font-bold'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-105'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-primary' : 'text-secondary/70 group-hover:text-secondary'} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Footer */}
                    <div className="p-4 border-t border-white/10 bg-white/5">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all hover:shadow-sm"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col relative z-0">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 glass-panel mx-4 mt-4 rounded-xl flex items-center px-4 justify-between sticky top-4 z-30">
                    <span className="font-bold font-serif text-lg text-primary">BoFu</span>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-muted-foreground">
                            <Menu size={24} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full">
                    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
