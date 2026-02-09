import { NextResponse } from 'next/server'

// Simple in-memory store for MVP
// In production (Vercel/AWS Lambda), this memory is cleared often.
// For VPS/Docker, it persists as long as the container runs.
const ipRequestMap = new Map<string, { count: number; lastReset: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 20 // 20 requests per minute per IP

export function rateLimit(ip: string) {
    const now = Date.now()
    const record = ipRequestMap.get(ip)

    if (!record) {
        ipRequestMap.set(ip, { count: 1, lastReset: now })
        return true
    }

    if (now - record.lastReset > WINDOW_MS) {
        // Reset window
        ipRequestMap.set(ip, { count: 1, lastReset: now })
        return true
    }

    if (record.count >= MAX_REQUESTS) {
        return false
    }

    record.count += 1
    return true
}

export function cleanupRateLimit() {
    // Optional: cleanup old entries to prevent memory leak
    const now = Date.now()
    ipRequestMap.forEach((value, key) => {
        if (now - value.lastReset > WINDOW_MS) {
            ipRequestMap.delete(key)
        }
    })
}

// Cleanup every 10 mins
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimit, 10 * 60 * 1000)
}
