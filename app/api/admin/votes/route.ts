import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAdmin(email: string) {
  const raw = process.env.ADMIN_EMAILS || ''
  if (!raw.trim()) return false
  const admins = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await adminClient
    .from('feature_votes')
    .select('feature_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate counts in JS (Supabase JS client doesn't support GROUP BY directly)
  const countMap: Record<string, number> = {}
  for (const row of data || []) {
    countMap[row.feature_id] = (countMap[row.feature_id] || 0) + 1
  }

  const votes = Object.entries(countMap).map(([feature_id, count]) => ({ feature_id, count }))

  return NextResponse.json({ votes })
}
