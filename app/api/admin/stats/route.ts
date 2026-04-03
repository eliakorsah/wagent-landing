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
  if (!user?.email || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [
    { count: totalBusinesses },
    { count: totalMessages },
    { count: totalConversations },
    { data: businesses },
  ] = await Promise.all([
    adminClient.from('businesses').select('*', { count: 'exact', head: true }),
    adminClient.from('messages').select('*', { count: 'exact', head: true }),
    adminClient.from('conversations').select('*', { count: 'exact', head: true }),
    adminClient.from('businesses').select('id, name, industry, plan, plan_expires_at, created_at, auto_reply, phone_number_id').order('created_at', { ascending: false }),
  ])

  // Plan breakdown
  const planCounts = { trial: 0, starter: 0, growth: 0, business: 0 }
  businesses?.forEach(b => {
    if (b.plan in planCounts) planCounts[b.plan as keyof typeof planCounts]++
  })

  // MRR estimate
  const planPrices = { trial: 0, starter: 199, growth: 449, business: 899 }
  const mrr = businesses?.reduce((sum, b) => sum + (planPrices[b.plan as keyof typeof planPrices] || 0), 0) || 0

  // Last 7 days signups
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const recentSignups = businesses?.filter(b => b.created_at > sevenDaysAgo).length || 0

  // Connected (have phone_number_id)
  const connected = businesses?.filter(b => b.phone_number_id).length || 0

  return NextResponse.json({
    totalBusinesses: totalBusinesses || 0,
    totalMessages: totalMessages || 0,
    totalConversations: totalConversations || 0,
    mrr,
    planCounts,
    recentSignups,
    connected,
    businesses: businesses || [],
  })
}
