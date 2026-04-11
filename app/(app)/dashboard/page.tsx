import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OverviewClient from './OverviewClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, plan, auto_reply, voice_enabled, handoff_enabled, reply_delay_seconds')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ count: totalConvs }, { count: aiReplies }, { count: voiceMsgs }, { data: recentConvs }] = await Promise.all([
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('business_id', business.id).gte('created_at', today.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('from_role', 'ai').gte('created_at', today.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('message_type', 'audio').gte('created_at', today.toISOString()),
    supabase.from('conversations').select('id, customer_phone, customer_name, status, last_message, last_message_at, unread_count').eq('business_id', business.id).order('last_message_at', { ascending: false }).limit(10),
  ])

  return (
    <OverviewClient
      business={business}
      stats={{ totalConvs: totalConvs || 0, aiReplies: aiReplies || 0, voiceMsgs: voiceMsgs || 0 }}
      recentConvs={recentConvs || []}
    />
  )
}
