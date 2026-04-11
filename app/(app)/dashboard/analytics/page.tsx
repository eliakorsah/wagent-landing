import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const AnalyticsClient = dynamic(() => import('./AnalyticsClient'), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="skeleton w-48 h-6" /></div>,
})

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) redirect('/onboarding')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: messages }, { data: conversations }] = await Promise.all([
    supabase.from('messages').select('from_role, created_at, message_type').eq('business_id', business.id).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at'),
    supabase.from('conversations').select('status, created_at').eq('business_id', business.id).gte('created_at', thirtyDaysAgo.toISOString()),
  ])

  return <AnalyticsClient messages={messages || []} conversations={conversations || []} />
}
