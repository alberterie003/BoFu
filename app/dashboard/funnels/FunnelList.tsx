'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ExternalLink, Copy, Loader2, Pencil, Trash2 } from 'lucide-react'
import { getTemplateId } from './actions'

// Basic Type - ideally import from types
type Funnel = {
    id: string
    name: string
    slug: string
    is_published: boolean
    client: { id: string, slug: string }

    template_id: string
    created_at: string
}

export default function FunnelList({
    initialFunnels,
    clients,
    templates
}: {
    initialFunnels: any[] // relaxed type
    clients: { id: string, name: string, slug: string }[]
    templates: { id: string, name: string }[]
}) {
    const [funnels, setFunnels] = useState(initialFunnels)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({ name: '', slug: '', clientId: clients[0]?.id || '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    const supabase = createClient()

    // Auto-generate slug
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setFormData(prev => {
            const updates: any = { name: newName }
            if (!slugManuallyEdited && !editingId) {
                const nameSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                const client = clients.find(c => c.id === prev.clientId)
                // Prefix with client slug if available
                if (client) {
                    updates.slug = `${client.slug}-${nameSlug}`
                } else {
                    updates.slug = nameSlug
                }
            }
            return { ...prev, ...updates }
        })
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, slug: e.target.value }))
        setSlugManuallyEdited(true)
    }

    const startEditing = (funnel: Funnel) => {
        setEditingId(funnel.id)
        setFormData({
            name: funnel.name,
            slug: funnel.slug,
            clientId: funnel.client.id
        })
        setIsFormOpen(true)
        setSlugManuallyEdited(true)
    }

    const resetForm = () => {
        setFormData({ name: '', slug: '', clientId: clients[0]?.id || '' })
        setEditingId(null)
        setIsFormOpen(false)
        setSlugManuallyEdited(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Check template via Server Action (bypassing RLS)
        const templateId = await getTemplateId('buy_home_miami_v1')

        if (!templateId) {
            alert("Template missing. Please run seed.")
            setLoading(false)
            return
        }

        let finalSlug = formData.slug

        if (!finalSlug) {
            const nameSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            const client = clients.find(c => c.id === formData.clientId)
            finalSlug = client ? `${client.slug}-${nameSlug}` : nameSlug
        }

        if (editingId) {
            // UPDATE
            const { error } = await supabase
                .from('funnels')
                .update({
                    name: formData.name,
                    slug: finalSlug,
                    client_id: formData.clientId
                })
                .eq('id', editingId)

            if (error) {
                alert(error.message)
            } else {
                // Optimistic update or refresh? Let's refresh whole list or map.
                // We need client slug for display, which we might have changed.
                // Ideally fetch full object back.
                const { data: updatedFunnel } = await supabase
                    .from('funnels')
                    .select('*, client:clients(id, slug), template:templates(id, name)')
                    .eq('id', editingId)
                    .single()

                if (updatedFunnel) {
                    setFunnels(funnels.map(f => f.id === editingId ? updatedFunnel : f))
                    resetForm()
                }
            }
        } else {
            // CREATE
            const { data: newFunnel, error } = await supabase
                .from('funnels')
                .insert({
                    name: formData.name,
                    slug: finalSlug,
                    client_id: formData.clientId,
                    template_id: templateId,
                    config: {}, // Default
                    is_published: true // Default to live for MVP
                })
                .select('*, client:clients(id, slug), template:templates(id, name)')
                .single()

            if (error) {
                alert(error.message)
            } else if (newFunnel) {
                setFunnels([newFunnel, ...funnels])
                resetForm()
            }
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete the funnel and all its leads.')) return

        const { error } = await supabase.from('funnels').delete().eq('id', id)

        if (error) {
            alert(error.message)
        } else {
            setFunnels(funnels.filter(f => f.id !== id))
        }
    }

    const togglePublish = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('funnels')
            .update({ is_published: !currentStatus })
            .eq('id', id)

        if (!error) {
            setFunnels(funnels.map(f => f.id === id ? { ...f, is_published: !currentStatus } : f))
        }
    }

    const copyLink = (clientSlug: string, funnelSlug: string) => {
        const url = `${window.location.origin}/f/${clientSlug}/${funnelSlug}`
        navigator.clipboard.writeText(url)
        alert("Copied to clipboard!")
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Funnels</h1>
                    <p className="text-muted-foreground">Manage your capture pages.</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                        <Plus size={18} />
                        New Funnel
                    </button>
                )}
            </div>

            {/* CREATE/EDIT FORM */}
            {isFormOpen && (
                <div className="mb-8 p-6 bg-card border border-border rounded-xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Funnel' : 'Create New Funnel'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Funnel Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="e.g. South Beach Luxury"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                                <input
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="south-beach-luxury"
                                />
                            </div>
                        </div>

                        {/* Client Select (if multiple) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Client</label>
                            <select
                                value={formData.clientId}
                                onChange={e => {
                                    const newClientId = e.target.value
                                    setFormData(prev => {
                                        const updates: any = { clientId: newClientId }
                                        // Update slug if not manually edited
                                        if (!slugManuallyEdited && !editingId) {
                                            const client = clients.find(c => c.id === newClientId)
                                            if (client && prev.name) {
                                                const nameSlug = prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                                                updates.slug = `${client.slug}-${nameSlug}`
                                            }
                                        }
                                        return { ...prev, ...updates }
                                    })
                                }}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
                            >
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
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
                                {editingId ? 'Save Changes' : 'Create Funnel'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <ul className="divide-y divide-border">
                    {funnels.length === 0 && !isFormOpen && (
                        <li className="p-8 text-center text-muted-foreground">
                            No funnels yet. Create your first one!
                        </li>
                    )}
                    {funnels.map((funnel, index) => (
                        <li
                            key={funnel.id}
                            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">{funnel.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${funnel.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {funnel.is_published ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">/{funnel.client.slug}/{funnel.slug}</span>
                                    <span>• {templates.find(t => t.id === funnel.template_id)?.name || 'Unknown Template'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyLink(funnel.client.slug, funnel.slug)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg tooltip"
                                    title="Copy Link"
                                >
                                    <Copy size={18} />
                                </button>
                                <a
                                    href={`/f/${funnel.client.slug}/${funnel.slug}`}
                                    target="_blank"
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg"
                                    title="Open"
                                >
                                    <ExternalLink size={18} />
                                </a>
                                <button
                                    onClick={() => startEditing(funnel)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => togglePublish(funnel.id, funnel.is_published)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${funnel.is_published ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {funnel.is_published ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                    onClick={() => handleDelete(funnel.id)}
                                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
