'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, Users, Pencil, Trash2, Smartphone, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Client = {
    id: string
    name: string
    slug: string
    twilio_phone_number?: string
    client_whatsapp_number?: string
    created_at: string
}

export default function ClientList({ initialClients, accountId }: { initialClients: Client[], accountId: string }) {
    const [clients, setClients] = useState(initialClients)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form and Edit State
    const [formData, setFormData] = useState({ name: '', slug: '', twilio_number: '', client_number: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    const supabase = createClient()

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setFormData(prev => {
            const updates: any = { name: newName }
            if (!slugManuallyEdited && !editingId) {
                updates.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            }
            return { ...prev, ...updates }
        })
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, slug: e.target.value }))
        setSlugManuallyEdited(true)
    }

    const startEditing = (client: Client) => {
        setEditingId(client.id)
        setFormData({
            name: client.name,
            slug: client.slug,
            twilio_number: client.twilio_phone_number || '',
            client_number: client.client_whatsapp_number || ''
        })
        setIsFormOpen(true)
        setSlugManuallyEdited(true)
    }

    const resetForm = () => {
        setFormData({ name: '', slug: '', twilio_number: '', client_number: '' })
        setEditingId(null)
        setIsFormOpen(false)
        setSlugManuallyEdited(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const finalSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

        const updatePayload = {
            name: formData.name,
            slug: finalSlug,
            twilio_phone_number: formData.twilio_number,
            client_whatsapp_number: formData.client_number
        }

        if (editingId) {
            // UPDATE
            const { error } = await supabase
                .from('clients')
                .update(updatePayload)
                .eq('id', editingId)

            if (error) {
                alert(error.message)
            } else {
                setClients(clients.map(c => c.id === editingId ? { ...c, ...updatePayload, id: c.id, created_at: c.created_at } : c))
                resetForm()
            }
        } else {
            // CREATE
            const { data, error } = await supabase
                .from('clients')
                .insert({
                    ...updatePayload,
                    account_id: accountId,
                })
                .select()
                .single()

            if (error) {
                alert(error.message)
            } else if (data) {
                setClients([...clients, data])
                resetForm()
            }
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all funnels and leads associated with this client.')) return

        const { error } = await supabase.from('clients').delete().eq('id', id)

        if (error) {
            alert(error.message)
        } else {
            setClients(clients.filter(c => c.id !== id))
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage your agency clients.</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                        <Plus size={18} />
                        New Client
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="mb-8 p-6 bg-card border border-border rounded-xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Company Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="e.g. Prestige Realty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                                <input
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="prestige-realty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Twilio Number (App)</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                    <input
                                        value={formData.twilio_number}
                                        onChange={(e) => setFormData({ ...formData, twilio_number: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="+1..."
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Number purchased in Twilio.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Client WhatsApp (Destination)</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                    <input
                                        value={formData.client_number}
                                        onChange={(e) => setFormData({ ...formData, client_number: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="+1..."
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Where leads are forwarded to.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={14} />}
                                {editingId ? 'Save Changes' : 'Add Client'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Slug</th>
                                <th className="px-6 py-3">WhatsApp</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {clients.map((client, index) => (
                                <tr
                                    key={client.id}
                                    className="hover:bg-secondary/20 transition-colors group animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-muted-foreground" />
                                            <Link href={`/dashboard/clients/${client.id}`} className="hover:underline text-primary">
                                                {client.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-muted-foreground">{client.slug}</td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        <div className="flex flex-col gap-1">
                                            {client.twilio_phone_number && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Smartphone size={12} className="text-blue-500" />
                                                    {client.twilio_phone_number} (App)
                                                </span>
                                            )}
                                            {client.client_whatsapp_number && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Users size={12} className="text-green-500" />
                                                    {client.client_whatsapp_number} (Client)
                                                </span>
                                            )}
                                            {!client.twilio_phone_number && !client.client_whatsapp_number && (
                                                <span className="text-muted-foreground/50 italic text-xs">Not Configured</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/dashboard/clients/${client.id}`}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                            <button
                                                onClick={() => startEditing(client)}
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
                                                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && !isFormOpen && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No clients found. Add one to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
