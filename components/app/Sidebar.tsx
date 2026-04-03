'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeProvider'

interface SidebarProps {
  business: { id: string; name: string; plan: string; plan_expires_at?: string | null; auto_reply: boolean; voice_enabled: boolean; logo_url?: string } | null
  user: { email?: string } | null
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

const navItems = [
  {
    label: 'Overview', href: '/dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    label: 'Live Chats', href: '/dashboard/chats', badge: 3,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
  },
  {
    label: 'Training', href: '/dashboard/training',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.318 2.498l-1.636-.233m0 0a23.843 23.843 0 01-5.166-.973m0 0a23.843 23.843 0 01-5.167.973M5.283 18.5l-1.636.233C2.3 18.933 1.329 17.235 2.33 16.235L3.73 14.834" /></svg>,
  },
  {
    label: 'Analytics', href: '/dashboard/analytics',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    label: 'Settings', href: '/dashboard/settings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    label: 'Referrals', href: '/dashboard/referrals',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  },
  {
    label: 'Vote / Features', href: '/dashboard/vote',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.729c0 .272.018.54.053.805A6.02 6.02 0 005.25 21a.75.75 0 01-.75-.75v-3.042c0-.51.05-1.01.15-1.494l.148-.737c.106-.531.55-.921 1.09-.921h.866z" /></svg>,
  },
]

const planColors: Record<string, string> = {
  trial: 'bg-[#374045] text-[#8696a0]',
  starter: 'bg-blue-500/20 text-blue-400',
  growth: 'bg-[#00a884]/20 text-[#00a884]',
  business: 'bg-purple-500/20 text-purple-400',
}

export default function Sidebar({ business, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [aiActive, setAiActive] = useState(business?.auto_reply ?? true)
  const supabase = createClient()

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const toggleAI = async () => {
    const next = !aiActive
    setAiActive(next)
    if (business?.id) {
      await supabase.from('businesses').update({ auto_reply: next }).eq('id', business.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-60 h-full bg-[#111b21] border-r border-[#374045]">
        <div className="px-4 py-4 border-b border-[#374045]">
          <Image
            src="/logo&name.png"
            alt="WAgenT by LYTRIX CONSULT"
            width={180}
            height={44}
            className="h-11 w-auto object-contain mb-2"
          />
          <div className="flex items-center gap-2 mt-1">
            {business?.logo_url ? (
              <Image src={business.logo_url} alt="Business logo" width={20} height={20} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#2a3942] flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-[#00a884]">{(business?.name || 'B').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="text-[#8696a0] text-xs truncate">{business?.name || 'Your Business'}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]'}`}>
                <span className={active ? 'text-[#00a884]' : ''}>{item.icon}</span>
                {item.label}
                {item.badge && <span className="ml-auto bg-[#00a884] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>}
              </Link>
            )
          })}

          {/* Admin link — only visible to admin emails */}
          {isAdmin && (
            <>
              <div className="my-2 h-px bg-[#374045]" />
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-purple-300'
                }`}
              >
                <svg className={`w-5 h-5 ${pathname.startsWith('/admin') ? 'text-purple-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Admin Console
                <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">LYTRIX</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-[#374045] space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${aiActive ? 'bg-[#00a884] status-pulse' : 'bg-[#374045]'}`} />
              <span className="text-[#8696a0] text-xs">AI Agent</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={toggleAI} className={`w-10 h-5 rounded-full transition-all duration-200 relative ${aiActive ? 'bg-[#00a884]' : 'bg-[#374045]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${aiActive ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${planColors[business?.plan || 'trial']}`}>
              {business?.plan || 'Trial'}
            </span>
            <Link href="/dashboard/upgrade" className="text-[#00a884] text-xs hover:underline">
              {(!business?.plan || business.plan === 'trial' || business.plan === 'starter') ? 'Upgrade' : ''}
            </Link>
          </div>
          {business?.plan === 'trial' && business.plan_expires_at && (() => {
            const daysLeft = Math.ceil((new Date(business.plan_expires_at).getTime() - Date.now()) / 86400000)
            if (daysLeft <= 0) return (
              <Link href="/dashboard/upgrade" className="flex items-center gap-1.5 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                Trial expired — upgrade now
              </Link>
            )
            if (daysLeft <= 3) return (
              <Link href="/dashboard/upgrade" className="flex items-center gap-1.5 text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0 animate-pulse" />
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in trial
              </Link>
            )
            return (
              <div className="text-[10px] text-[#8696a0] px-1">{daysLeft} days left in trial</div>
            )
          })()}
          {user?.email && (
            <div className="px-1 text-[#374045] text-[10px] truncate">{user.email}</div>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-[#8696a0] hover:text-[#e9edef] text-xs transition-colors rounded-lg hover:bg-[#1f2c34]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111b21] border-t border-[#374045] z-40 flex">
        {navItems.slice(0, 5).map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${active ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
              {item.icon}
              <span className="text-[9px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
