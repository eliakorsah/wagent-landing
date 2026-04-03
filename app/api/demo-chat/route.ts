import { NextRequest, NextResponse } from 'next/server'
import { generateDemoReply } from '@/lib/claude'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory rate limit (use Redis/Supabase in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please sign up for full access.' }, { status: 429 })
    }

    const { message, history } = await request.json()

    if (!message || typeof message !== 'string' || message.length > 500) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    if (history && history.length >= 6) {
      return NextResponse.json({ error: 'Demo limit reached. Sign up to continue.' }, { status: 400 })
    }

    const reply = await generateDemoReply(message, history || [])

    return NextResponse.json({ reply, success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate reply', reply: 'The demo is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
