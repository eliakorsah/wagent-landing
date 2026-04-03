import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email?.toLowerCase() || ''
  if (!ADMIN_EMAILS.includes(email)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#08090a] text-[#e9edef]">
      {children}
    </div>
  )
}
