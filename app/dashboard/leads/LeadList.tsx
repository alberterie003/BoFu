'use client'

import { useState, useEffect } from 'react'
import { Phone, MessageCircle, Flame, Snowflake, ThermometerSun, X, Calendar, DollarSign, Clock, MapPin, FileText, CheckCircle2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markLeadAsViewed, deleteLead, assessLead } from './actions'

interface Lead {
    id: string
    created_at: string
    status: string
    temperature?: string
    contact_data: any
    qualification_label?: string
    is_noise?: boolean
    funnel?: {
        name: string
        client?: {
            name: string
        }
    }
    session?: {
        answers: any
    }
}

interface LeadListProps {
    leads: Lead[]
    showClientColumn?: boolean
}

export default function LeadList({ leads: initialLeads, showClientColumn = true }: LeadListProps) {
    const [leads, setLeads] = useState(initialLeads)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    // Sync with server data when it updates
    useEffect(() => {
        setLeads(initialLeads)
    }, [initialLeads])

    if (leads.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-secondary">
                No leads found.
            </div>
        )
    }

    const getTempIcon = (temp: string | undefined) => {
        switch (temp) {
            case 'hot': return <Flame size={16} className="text-red-500 fill-red-500" />
            case 'warm': return <ThermometerSun size={16} className="text-orange-500" />
            default: return <Snowflake size={16} className="text-blue-400" />
        }
    }

    const getTempLabel = (temp: string | undefined) => {
        if (!temp) return 'Cold'
        return temp.charAt(0).toUpperCase() + temp.slice(1)
    }

    const handleLeadClick = async (lead: Lead) => {
        if (lead.status === 'new') {
            // Optimistic update
            const updatedLead = { ...lead, status: 'viewed' }

            // Update selected lead immediately if opened
            setSelectedLead(updatedLead)

            // Update list immediately
            setLeads(current => current.map(l => l.id === lead.id ? updatedLead : l))

            // Trigger server action
            await markLeadAsViewed(lead.id)
        }
        setSelectedLead(lead)
    }

    const handleDelete = async (e: React.MouseEvent, leadId: string) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this lead?')) {
            // Optimistic deletion
            setLeads(current => current.filter(l => l.id !== leadId))
            if (selectedLead?.id === leadId) setSelectedLead(null)

            await deleteLead(leadId)
        }
    }

    const handleExportCSV = () => {
        if (!leads || leads.length === 0) return

        // Define headers
        const headers = ['Date', 'Name', 'Email', 'Phone', 'Source', 'Campaign', 'Temperature', 'Status', 'Funnel']

        // Map data to rows
        const rows = leads.map(lead => {
            const contact = lead.contact_data
            const date = new Date(lead.created_at).toLocaleDateString()
            const name = contact.name || ''
            const email = contact.email || ''
            const phone = contact.phone || ''
            const source = contact.utm_source || 'Direct'
            const campaign = contact.utm_campaign || ''
            const temp = lead.temperature || ''
            const status = lead.status
            const funnel = lead.funnel?.name || ''

            // Escape CSV fields (wrap in quotes if contains comma)
            const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`

            return [
                escape(date),
                escape(name),
                escape(email),
                escape(phone),
                escape(source),
                escape(campaign),
                escape(temp),
                escape(status),
                escape(funnel)
            ].join(',')
        })

        // Combine
        const csvContent = [headers.join(','), ...rows].join('\n')

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors text-sm font-medium"
                >
                    <FileText size={16} />
                    Export CSV
                </button>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Contact</th>
                                <th className="px-6 py-3 font-medium">Score</th>
                                <th className="px-6 py-3 font-medium">Campaign</th>
                                {showClientColumn && <th className="px-6 py-3 font-medium">Funnel / Client</th>}
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {leads.map((lead) => {
                                const contact = lead.contact_data
                                const phone = contact.phone?.replace(/\D/g, '') || ''
                                const temp = lead.temperature || 'cold'
                                const isNew = lead.status === 'new'
                                const source = contact.utm_source || 'Direct'
                                const campaign = contact.utm_campaign
                                const isOverdue = isNew && (new Date().getTime() - new Date(lead.created_at).getTime() > 5 * 60 * 1000)

                                return (
                                    <tr
                                        key={lead.id}
                                        className={`hover:bg-muted/50 transition-colors cursor-pointer ${isNew ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => handleLeadClick(lead)}
                                    >
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(lead.created_at).toLocaleDateString()} <span className="text-xs opacity-70">{new Date(lead.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className={`px-6 py-4 text-foreground ${isNew ? 'font-bold' : 'font-medium'}`}>
                                            {contact.name || 'Unknown'}
                                            {isNew && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="flex flex-col">
                                                <span>{contact.email}</span>
                                                <span className="text-xs">{contact.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" title={getTempLabel(temp)}>
                                                {getTempIcon(temp)}
                                                <span className="text-xs font-medium text-muted-foreground capitalize">{temp}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground capitalize">{source}</span>
                                                {campaign && <span className="text-xs text-muted-foreground">{campaign}</span>}
                                            </div>
                                        </td>
                                        {showClientColumn && (
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{lead.funnel?.name}</span>
                                                    <span className="text-xs">{lead.funnel?.client?.name}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isNew ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {lead.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* SLA Timer / Status */}
                                                {isOverdue && (
                                                    <div className="mr-2 px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 bg-red-100 text-red-700 border-red-200 animate-pulse">
                                                        <Clock size={10} />
                                                        OVERDUE
                                                    </div>
                                                )}

                                                {/* Qualification Actions */}
                                                {!lead.qualification_label && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                assessLead(lead.id, 'qualified');
                                                            }}
                                                            className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 border border-green-200 transition-colors"
                                                            title="Mark as Qualified (Triggers CAPI)"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                assessLead(lead.id, 'noise', 'manual');
                                                            }}
                                                            className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 border border-red-200 transition-colors"
                                                            title="Mark as Noise"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}

                                                {lead.qualification_label === 'qualified' && (
                                                    <span className="text-xs font-bold text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> Qualified
                                                    </span>
                                                )}

                                                {phone && (
                                                    <>
                                                        <a
                                                            href={`tel:${phone}`}
                                                            className="p-2 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition-colors"
                                                            title="Call"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Phone size={16} />
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${phone}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                                            title="WhatsApp"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MessageCircle size={16} />
                                                        </a>
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, lead.id)}
                                                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lead Detail Modal */}
            <AnimatePresence>
                {selectedLead && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                            onClick={() => setSelectedLead(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-start bg-secondary/30">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold">{selectedLead.contact_data.name}</h2>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${selectedLead.temperature === 'hot' ? 'bg-red-50 text-red-700 border-red-200' :
                                            selectedLead.temperature === 'warm' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {selectedLead.temperature?.toUpperCase() || 'COLD'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                                        Added {new Date(selectedLead.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDelete(e, selectedLead.id)}
                                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Lead"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedLead(null)}
                                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-8">
                                {/* Status Indicator in Modal */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 size={16} className={selectedLead.status === 'viewed' || selectedLead.status === 'new' ? 'text-green-500' : ''} />
                                    Current Status: <span className="font-medium text-foreground uppercase">{selectedLead.status === 'new' ? 'VIEWED' : selectedLead.status}</span>
                                </div>

                                {/* Contact Info Grid */}
                                <div className="grid grid-cols-2 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium text-lg">{selectedLead.contact_data.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium text-lg flex items-center gap-2">
                                            {selectedLead.contact_data.phone}
                                            <a href={`https://wa.me/${selectedLead.contact_data.phone?.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:text-green-700">
                                                <MessageCircle size={16} />
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-border" />

                                {/* Survey Answers */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-primary" />
                                        Survey Responses
                                    </h3>

                                    {selectedLead.session?.answers ? (
                                        <div className="grid gap-4">
                                            {/* Campaign / Tracking Info */}
                                            {selectedLead.contact_data && (selectedLead.contact_data.utm_source || selectedLead.contact_data.utm_campaign) && (
                                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 col-span-full">
                                                    <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                                        <MapPin size={14} />
                                                        Campaign / Tracking Specs
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                        {selectedLead.contact_data.utm_source && (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Source</span>
                                                                <span className="font-medium text-foreground">{selectedLead.contact_data.utm_source}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.contact_data.utm_medium && (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Medium</span>
                                                                <span className="font-medium text-foreground">{selectedLead.contact_data.utm_medium}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.contact_data.utm_campaign && (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Campaign</span>
                                                                <span className="font-medium text-foreground">{selectedLead.contact_data.utm_campaign}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.contact_data.utm_content && (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Content</span>
                                                                <span className="font-medium text-foreground">{selectedLead.contact_data.utm_content}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.contact_data.utm_term && (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Term</span>
                                                                <span className="font-medium text-foreground">{selectedLead.contact_data.utm_term}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {Object.entries(selectedLead.session.answers).map(([stepKey, data]: [string, any]) => {
                                                if (stepKey === 'contact') return null // Skip contact as it's shown above
                                                if (stepKey === '_tracking') return null // Skip tracking as it's shown above

                                                // Try to format answer nicely
                                                let displayData = data
                                                if (typeof data === 'object') {
                                                    displayData = Object.entries(data).map(([k, v]) => (
                                                        <div key={k} className="flex flex-col mb-2">
                                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{k}</span>
                                                            <span className="font-medium">{String(v)}</span>
                                                        </div>
                                                    ))
                                                }

                                                return (
                                                    <div key={stepKey} className="bg-secondary/30 p-4 rounded-lg border border-border">
                                                        <h4 className="text-sm font-semibold text-primary mb-3 capitalize bg-primary/10 inline-block px-2 py-0.5 rounded">
                                                            {stepKey}
                                                        </h4>
                                                        <div className="text-foreground">
                                                            {Array.isArray(displayData) ? displayData : (
                                                                typeof data === 'object' ? displayData : <span className="font-medium">{String(data)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground italic">No survey answers recorded.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
