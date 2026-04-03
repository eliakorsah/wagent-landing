'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Props {
  business: { id: string; name: string; plan: string; auto_reply: boolean; voice_enabled: boolean; handoff_enabled: boolean; reply_delay_seconds: number }
  stats: { totalConvs: number; aiReplies: number; voiceMsgs: number }
  recentConvs: Array<{ id: string; customer_phone: string; customer_name?: string; status: string; last_message?: string; last_message_at?: string; unread_count: number }>
}

const statusStyles: Record<string, { label: string; color: string }> = {
  ai_active: { label: 'AI Replied', color: 'bg-green-500/20 text-green-400' },
  manual: { label: 'Manual', color: 'bg-blue-500/20 text-blue-400' },
  resolved: { label: 'Resolved', color: 'bg-[#374045] text-[#8696a0]' },
  needs_human: { label: 'Needs Human', color: 'bg-red-500/20 text-red-400' },
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
}

function AnimatedStat({ value, label }: { value: number | string; label: string }) {
  const [displayed, setDisplayed] = useState(0)
  const isNum = typeof value === 'number'

  useEffect(() => {
    if (!isNum) return
    const dur = 1200
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / dur, 1)
      setDisplayed(Math.round(progress * (value as number)))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, isNum])

  return (
    <div className="bg-[#1f2c34] border border-[#374045] rounded-2xl p-5">
      <div className="font-mono text-2xl font-bold text-white mb-1">
        {isNum ? displayed : value}
      </div>
      <div className="text-[#8696a0] text-sm">{label}</div>
    </div>
  )
}

export default function OverviewClient({ business, stats, recentConvs }: Props) {
  const supabase = createClient()
  const [convs, setConvs] = useState(recentConvs)
  const [settings, setSettings] = useState({
    auto_reply: business.auto_reply,
    voice_enabled: business.voice_enabled,
    handoff_enabled: business.handoff_enabled,
    reply_delay_seconds: business.reply_delay_seconds,
  })
  const [paymentToast, setPaymentToast] = useState<{ type: 'success' | 'failed'; plan?: string } | null>(null)

  useEffect(() => {
    // Show payment result toast from Paystack redirect
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const plan = params.get('plan')
    if (payment === 'success') {
      setPaymentToast({ type: 'success', plan: plan || undefined })
      // Clean URL without reload
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setPaymentToast(null), 6000)
    } else if (payment === 'error') {
      setPaymentToast({ type: 'failed' })
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setPaymentToast(null), 5000)
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-convs')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `business_id=eq.${business.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setConvs(prev => [payload.new as any, ...prev.slice(0, 9)])
        } else if (payload.eventType === 'UPDATE') {
          setConvs(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [business.id, supabase])

  const updateSetting = async (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    await supabase.from('businesses').update({ [key]: value }).eq('id', business.id)
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Payment toast */}
      {paymentToast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all animate-[fadeDown_0.3s_ease-out] ${
          paymentToast.type === 'success'
            ? 'bg-[#111b21] border-[#00a884]/40 text-[#e9edef]'
            : 'bg-[#111b21] border-red-500/30 text-[#e9edef]'
        }`}>
          <span className="text-xl">{paymentToast.type === 'success' ? '🎉' : '❌'}</span>
          <div>
            {paymentToast.type === 'success' ? (
              <>
                <div className="font-semibold text-sm">Payment successful!</div>
                <div className="text-[#8696a0] text-xs">
                  You&apos;re now on the{' '}
                  <span className="text-[#00a884] font-semibold capitalize">{paymentToast.plan}</span>{' '}
                  plan. Your AI agent is fully active.
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm text-red-400">Payment could not be verified</div>
                <div className="text-[#8696a0] text-xs">Please try again or contact support.</div>
              </>
            )}
          </div>
          <button onClick={() => setPaymentToast(null)} className="ml-2 text-[#8696a0] hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-[#e9edef]">Overview</h1>
        <p className="text-[#8696a0] text-sm mt-1">Today&apos;s activity for {business.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat value={stats.totalConvs} label="Conversations today" />
        <AnimatedStat value={stats.aiReplies} label="AI replies sent" />
        <AnimatedStat value={stats.voiceMsgs} label="Voice messages" />
        <AnimatedStat value="1.4s" label="Avg response time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent conversations */}
        <div className="lg:col-span-2 bg-[#111b21] border border-[#374045] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#374045]">
            <h2 className="text-[#e9edef] font-medium">Recent conversations</h2>
            <Link href="/dashboard/chats" className="text-[#00a884] text-sm hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[#374045]">
            {convs.length === 0 && (
              <div className="px-5 py-8 text-center text-[#8696a0] text-sm">No conversations yet. Share your WhatsApp number to get started.</div>
            )}
            {convs.map(conv => {
              const st = statusStyles[conv.status] || statusStyles.pending
              return (
                <Link key={conv.id} href={`/dashboard/chats?id=${conv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#1f2c34] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-[#2a3942] flex items-center justify-center text-[#8696a0] text-sm font-medium flex-shrink-0">
                    {(conv.customer_name || conv.customer_phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] text-sm font-medium truncate">{conv.customer_name || conv.customer_phone}</span>
                      <span className="text-[#8696a0] text-xs ml-2 flex-shrink-0">{conv.last_message_at ? formatDate(conv.last_message_at) : ''}</span>
                    </div>
                    <div className="text-[#8696a0] text-xs truncate mt-0.5">{conv.last_message || 'No messages'}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* AI Controls */}
        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5 space-y-4">
          <h2 className="text-[#e9edef] font-medium">AI Settings</h2>

          {[
            { key: 'auto_reply', label: 'Auto-reply', desc: 'AI responds to all messages' },
            { key: 'voice_enabled', label: 'Voice replies', desc: 'Send audio messages' },
            { key: 'handoff_enabled', label: 'Human handoff', desc: 'Flag complex conversations' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#374045] last:border-0">
              <div>
                <div className="text-[#e9edef] text-sm font-medium">{item.label}</div>
                <div className="text-[#8696a0] text-xs">{item.desc}</div>
              </div>
              <button
                onClick={() => updateSetting(item.key, !settings[item.key as keyof typeof settings])}
                className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${settings[item.key as keyof typeof settings] ? 'bg-[#00a884]' : 'bg-[#374045]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${settings[item.key as keyof typeof settings] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#e9edef] text-sm">Reply delay</span>
              <span className="text-[#00a884] font-mono text-sm">{settings.reply_delay_seconds}s</span>
            </div>
            <input
              type="range" min={0} max={10} step={1}
              value={settings.reply_delay_seconds}
              onChange={e => updateSetting('reply_delay_seconds', parseInt(e.target.value))}
              className="w-full accent-[#00a884]"
            />
            <div className="flex justify-between text-[#8696a0] text-xs mt-1">
              <span>Instant</span><span>10s</span>
            </div>
          </div>

          <Link href="/dashboard/training" className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] text-sm rounded-xl transition-colors mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Update AI training
          </Link>
        </div>
      </div>
    </div>
  )
}
