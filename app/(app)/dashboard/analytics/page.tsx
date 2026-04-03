import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) redirect('/onboarding')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: messages } = await supabase
    .from('messages')
    .select('from_role, created_at, message_type')
    .eq('business_id', business.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('status, created_at')
    .eq('business_id', business.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return <AnalyticsClient messages={messages || []} conversations={conversations || []} />
}
