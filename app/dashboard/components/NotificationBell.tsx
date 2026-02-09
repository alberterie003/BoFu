'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()

        // Subscribe to changes
        const channel = supabase
            .channel('notifications-bell')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)

        setUnreadCount(count || 0)
    }

    const loadList = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*, lead:leads(contact_data)')
            .order('created_at', { ascending: false })
            .limit(5)

        setNotifications(data || [])
    }

    const toggleOpen = () => {
        if (!isOpen) {
            loadList()
        }
        setIsOpen(!isOpen)
    }

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-3 border-b border-border bg-secondary/30 flex justify-between items-center">
                            <h4 className="font-semibold text-sm">Notifications</h4>
                            {unreadCount > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-3 text-sm hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" style={{ opacity: n.is_read ? 0 : 1 }} />
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-medium leading-none">
                                                        New Lead: <span className="text-foreground">{n.lead?.contact_data?.name || 'Unknown'}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(n.created_at).toLocaleTimeString()} · {new Date(n.created_at).toLocaleDateString()}
                                                    </p>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 border-t border-border bg-secondary/30 text-center">
                            <Link href="/dashboard/leads" className="text-xs font-medium text-primary hover:underline" onClick={() => setIsOpen(false)}>
                                View all leads
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
