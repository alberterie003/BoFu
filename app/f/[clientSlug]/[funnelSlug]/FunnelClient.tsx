'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Types
import { Database } from '@/types/database.types'

type Step = {
    id: string
    type: 'single_select' | 'form' | 'contact' | 'message'
    title: string
    options?: { value: string; label: string }[]
    fields?: { id: string; type: string; label: string; options?: string[] }[] | string[]
    content?: string
    whatsapp_enabled?: boolean
}

type FunnelConfig = {
    steps: Step[]
}

interface FunnelClientProps {
    funnelId: string
    config: FunnelConfig
    templateSpec: FunnelConfig
    whatsappNumber?: string
    trackingData?: any
}

export default function FunnelClient({ funnelId, config, templateSpec, whatsappNumber, trackingData }: FunnelClientProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)

    const steps = templateSpec.steps || []
    const currentStep = steps[currentStepIndex]

    const handleStart = async (firstAnswer?: any) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/public/funnel/${funnelId}/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingData })
            })
            const data = await res.json()
            if (data.error) {
                alert(data.error)
            } else if (data.sessionToken) {
                setSessionToken(data.sessionToken)

                // If we have an initial answer (e.g. from Intent button), save it
                if (firstAnswer) {
                    await handleStepSubmit(firstAnswer, data.sessionToken)
                } else {
                    // Just advance
                    setCurrentStepIndex((prev) => prev + 1)
                }
            }
        } catch (error) {
            console.error('Failed to start session', error)
            alert("Connection error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleStepSubmit = async (stepAnswer: any, tokenOverride?: string) => {
        const token = tokenOverride || sessionToken
        if (!token) return

        // Optimistic update
        const newAnswers = { ...answers, [currentStep.id]: stepAnswer }
        setAnswers(newAnswers)

        setLoading(true)
        try {
            // Send to API
            await fetch(`/api/public/funnel/${funnelId}/session/step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionToken: token,
                    stepIndex: currentStepIndex + 1,
                    answers: { [currentStep.id]: stepAnswer } // Send incremental
                })
            })

            // Advance
            setCurrentStepIndex((prev) => prev + 1)

        } catch (error) {
            console.error('Step submission failed', error)
            alert("Failed to save progress. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleFinalSubmit = async (contactData: any) => {
        if (!sessionToken) return
        setLoading(true)

        try {
            const res = await fetch(`/api/public/funnel/${funnelId}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionToken,
                    contact: contactData
                })
            })

            const data = await res.json()

            if (data.success) {
                setCurrentStepIndex((prev) => prev + 1) // Go to Thank You
            } else {
                alert("Failed to submit. Please try again.")
            }
        } catch (error) {
            console.error('Final submit failed', error)
            alert("Failed to submit. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // RENDERERS

    if (!currentStep) return <div className="p-10 text-center">Loading...</div>

    return (
        <div className="min-h-screen bg-background flex flex-col items-center pt-10 px-4 sm:px-6">

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-2xl bg-card border border-border rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 sm:p-12"
                >

                    {/* Progress Bar (Simple) */}
                    {currentStepIndex > 0 && currentStepIndex < steps.length - 1 && (
                        <div className="w-full bg-secondary h-1.5 rounded-full mb-8 overflow-hidden">
                            <motion.div
                                className="bg-primary h-full"
                                initial={{ width: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%` }}
                                animate={{ width: `${((currentStepIndex) / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4 tracking-tight">
                        {currentStep.title}
                    </h1>

                    {currentStep.content && (
                        <p className="text-muted-foreground text-lg mb-8">{currentStep.content}</p>
                    )}

                    {/* STEP VIEWS */}

                    {currentStep.type === 'single_select' && (
                        <div className="grid gap-4 mt-8">
                            {currentStep.options?.map((opt, idx) => (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, backgroundColor: "var(--secondary)" }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    onClick={() => !sessionToken ? handleStart(opt.value) : handleStepSubmit(opt.value)}
                                    className="group flex items-center justify-between p-6 text-left border border-input rounded-2xl hover:border-primary/50 transition-colors sm:text-lg font-medium text-foreground bg-card"
                                >
                                    {opt.label}
                                    <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {currentStep.type === 'form' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const data = Object.fromEntries(formData.entries())
                                if (data.company_hp) return
                                handleStepSubmit(data)
                            }}
                            className="space-y-6 mt-6"
                        >
                            <input type="text" name="company_hp" className="hidden" tabIndex={-1} autoComplete="off" />
                            {currentStep.fields?.map((field: any, idx: number) => (
                                <motion.div
                                    key={field.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        {field.label}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select name={field.id} required className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all">
                                            <option value="">Select...</option>
                                            {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            name={field.id}
                                            required
                                            className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </motion.div>
                            ))}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-lg mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={20} />}
                                Continue
                            </motion.button>
                        </form>
                    )}

                    {currentStep.type === 'contact' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const data = Object.fromEntries(formData.entries())
                                if (data.company_hp) return
                                handleFinalSubmit(data)
                            }}
                            className="space-y-6 mt-6"
                        >
                            <input type="text" name="company_hp" className="hidden" tabIndex={-1} autoComplete="off" />
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                                <input name="name" type="text" required placeholder="John Doe" className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
                                <input name="email" type="email" required placeholder="john@example.com" className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                                <input name="phone" type="tel" required placeholder="(305) 555-0123" className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                            </motion.div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-lg mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={20} />}
                                Get Listings
                            </motion.button>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                By clicking continue, you agree to our Terms and Privacy Policy.
                            </p>
                        </form>
                    )}

                    {currentStep.type === 'message' && (
                        <div className="text-center mt-8 space-y-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </motion.div>
                            <p className="text-xl text-muted-foreground">
                                Your preferences have been saved. One of our specialists will be in touch shortly.
                            </p>

                            {currentStep.whatsapp_enabled && (
                                <motion.a
                                    href={`https://wa.me/${whatsappNumber || '13055550123'}`} // Fallback to agency number
                                    target="_blank"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#128C7E] transition-all shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    Chat on WhatsApp
                                </motion.a>
                            )}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Footer / Branding */}
            <div className="mt-8 text-center text-sm text-muted-foreground pb-8">
                <p>Powered by BoFu</p>
            </div>
        </div>
    )
}
