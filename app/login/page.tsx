'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('') // New
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'magic_link' | 'password'>('password') // Default to password now
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (mode === 'magic_link') {
            // Magic Link
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) {
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'success', text: 'Check your email for the login link!' })
            }
        } else {
            // Password Login
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                setMessage({ type: 'error', text: error.message })
            } else {
                router.push('/dashboard')
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12 relative overflow-hidden">
                <div className="z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-8xl font-bold font-serif mb-4 text-secondary tracking-tighter"
                    >
                        BoFu
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex items-center justify-center gap-3 text-primary-foreground/80"
                    >
                        <span className="h-px w-8 bg-secondary/50"></span>
                        <p className="text-xl tracking-[0.2em] font-sans uppercase text-xs">
                            Funnel Engine
                        </p>
                        <span className="h-px w-8 bg-secondary/50"></span>
                    </motion.div>
                </div>
                {/* Abstract Background - Gold Mesh */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/30 via-transparent to-transparent animate-[spin_60s_linear_infinite]" />
                </div>
            </div>

            {/* Form Side */}
            <div className="flex items-center justify-center p-8 bg-card">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold font-serif text-foreground tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">Sign in to manage your funnels</p>
                    </div>

                    <div className="flex gap-4 border-b border-border pb-4">
                        <button
                            onClick={() => setMode('password')}
                            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${mode === 'password' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                        >
                            Password
                        </button>
                        <button
                            onClick={() => setMode('magic_link')}
                            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${mode === 'magic_link' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                        >
                            Magic Link
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none transition-all"
                                placeholder="you@agency.com"
                            />
                        </div>

                        {mode === 'password' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </motion.div>
                        )}

                        {message && (
                            <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message.text}
                            </div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {mode === 'password' ? 'Log In' : 'Send Magic Link'}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
