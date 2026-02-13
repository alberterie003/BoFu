'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Copy, ArrowRight, ArrowLeft, Rocket, Target, MessageSquare, ExternalLink } from 'lucide-react'
import { SYSTEM_TEMPLATES, getTemplateByIntent } from '@/lib/funnel-templates/system-templates'

export default function CampaignLauncherPage() {
    const [step, setStep] = useState(1)
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generatedLink, setGeneratedLink] = useState('')

    const supabase = createClient()

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('clients').select('*')
            if (data) setClients(data)
            setLoading(false)
        }
        fetchClients()
    }, [])

    const handleIntentSelect = (intent: string) => {
        setSelectedIntent(intent)
        setStep(2)
    }

    const handleGenerate = () => {
        if (!selectedClient || !selectedIntent) return

        // Generate Link: wa.me/NUMBER?text=START_FUNNEL_INTENT
        const phone = selectedClient.client_whatsapp_number || 'PHONE_NUMBER_MISSING'
        const cleanPhone = phone.replace(/\D/g, '')
        const funnelCode = `START_FUNNEL_${selectedIntent.toUpperCase()}_v1`

        const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(funnelCode)}`
        setGeneratedLink(link)
        setStep(3)
    }

    const [copied, setCopied] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(err => {
                console.error('Failed to copy:', err)
                // Fallback for older browsers or non-secure contexts if needed
                alert('Copy failed. Please select and copy manually.')
            })
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">Meta Ads Launcher</h1>
                <p className="text-muted-foreground mt-2">
                    Create high-converting campaigns in 3 simple steps.
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <span className={step >= 1 ? 'text-primary' : ''}>1. Objective</span>
                <ArrowRight size={16} />
                <span className={step >= 2 ? 'text-primary' : ''}>2. Configuration</span>
                <ArrowRight size={16} />
                <span className={step >= 3 ? 'text-primary' : ''}>3. Launch Assets</span>
            </div>

            {/* STEP 1: OBJECTIVE */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { id: 'buyer', label: 'Find Buyers', desc: 'Qualify production-ready buyers', icon: Target },
                        { id: 'seller', label: 'Get Listings', desc: 'Find homeowners looking to sell', icon: Rocket },
                        { id: 'investor', label: 'Investors', desc: 'Connect with cash buyers', icon: BarChart },
                        { id: 'renter', label: 'Renters', desc: 'Fill rental vacancies fast', icon: Users }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handleIntentSelect(opt.id)}
                            className="flex flex-col items-start p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                        >
                            <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <opt.icon size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{opt.label}</h3>
                            <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* STEP 2: CONFIGURATION */}
            {step === 2 && (
                <div className="max-w-2xl bg-card border border-border rounded-xl p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium">Select Client Account</label>
                        <select
                            className="w-full p-3 rounded-lg border border-input bg-background"
                            onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value))}
                        >
                            <option value="">-- Choose Client --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedClient && (
                        <div className="p-4 bg-secondary/10 rounded-lg text-sm text-secondary-foreground space-y-2">
                            <p><strong>WhatsApp Number:</strong> {selectedClient.client_whatsapp_number || 'Not Configured ⚠️'}</p>
                            <p><strong>Funnel Template:</strong> {getTemplateByIntent(selectedIntent!)?.name}</p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg hover:bg-accent">Back</button>
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedClient}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            Generate Assets
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: OUTPUT */}
            {step === 3 && (
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Link Asset */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Rocket size={20} />
                            <h3>Ads Manager Link</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Paste this link into your Meta Ad "Destination" field.</p>

                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={generatedLink}
                                className="flex-1 p-2 text-sm bg-muted rounded border border-input font-mono"
                            />
                            <button
                                onClick={() => copyToClipboard(generatedLink)}
                                className="p-2 border rounded hover:bg-accent min-w-[40px] flex items-center justify-center transition-all bg-secondary/50"
                                title="Copy to Clipboard"
                            >
                                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            </button>
                        </div>

                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs">
                            <strong>Tip:</strong> This link automatically starts the chatbot funnel when clicked.
                        </div>
                    </div>

                    {/* Ad Copy Asset */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <MessageSquare size={20} />
                            <h3>Suggested Ad Copy</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-muted-foreground">Primary Text</label>
                                <div className="p-3 bg-muted rounded-lg text-sm mt-1 whitespace-pre-wrap">
                                    {selectedIntent === 'buyer' ?
                                        "🏡 Stop renting and start owning! \n\nSee if you qualify for our exclusive home buyer program in strictly under 2 minutes. \n\nClick below to chat with our assistant instantly! 👇" :
                                        selectedIntent === 'seller' ?
                                            "📈 Home prices have changed. \n\nFind out exactly what your property could sell for in today's market. \n\nGet a free instant valuation via chat! 👇" :
                                            "Discover your next opportunity. Chat with us to learn more."
                                    }
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase font-bold text-muted-foreground">Headline</label>
                                <div className="p-3 bg-muted rounded-lg text-sm mt-1 font-bold">
                                    {selectedIntent === 'buyer' ? "Check Your Home Buying Eligibility 🏡" : "What is your home worth? 💰"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex justify-center pt-8">
                        <button onClick={() => window.open('https://adsmanager.facebook.com', '_blank')} className="flex items-center gap-2 px-8 py-3 bg-[#1877F2] text-white rounded-full hover:bg-blue-600 font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                            <ExternalLink size={18} />
                            Open Meta Ads Manager
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function BarChart({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
    )
}

function Users({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    )
}
