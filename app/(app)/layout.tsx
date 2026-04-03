import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/app/Sidebar'
import WhatsAppSupportButton from '@/components/WhatsAppSupportButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, plan, plan_expires_at, auto_reply, voice_enabled, logo_url')
    .eq('user_id', user.id)
    .single()

  // Trial expiry gate — redirect to upgrade page if trial has run out
  if (business) {
    const headersList = headers()
    const pathname = headersList.get('x-pathname') || ''
    const isUpgradePage = pathname.includes('/dashboard/upgrade')

    const trialExpired =
      business.plan === 'trial' &&
      business.plan_expires_at &&
      new Date(business.plan_expires_at) < new Date()

    if (trialExpired && !isUpgradePage) {
      redirect('/dashboard/upgrade')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b141a]">
      <Sidebar business={business} user={user} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <WhatsAppSupportButton />
    </div>
  )
}
