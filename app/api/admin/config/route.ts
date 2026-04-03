import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAllConfig, setConfig } from '@/lib/platform-config'

function isAdmin(email: string) {
  const raw = process.env.ADMIN_EMAILS || ''
  if (!raw.trim()) return false
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase())
}

// GET — return all config values
export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const config = await getAllConfig()
  return NextResponse.json({ config })
}

// PATCH — update a single config key
export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { key, value } = await request.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 })
  }
  await setConfig(key, value)
  return NextResponse.json({ success: true })
}
