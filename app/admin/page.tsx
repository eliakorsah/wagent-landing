'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Business {
  id: string
  name: string
  industry: string
  plan: string
  plan_expires_at: string | null
  created_at: string
  auto_reply: boolean
  phone_number_id: string | null
}

interface DiscountCode {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  applies_to_plan: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  description: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

interface Stats {
  totalBusinesses: number
  totalMessages: number
  totalConversations: number
  mrr: number
  planCounts: Record<string, number>
  recentSignups: number
  connected: number
  businesses: Business[]
}

/* ─── Plan badge ────────────────────────────────────────────────────────── */
const planColors: Record<string, string> = {
  trial: 'bg-[#374045] text-[#8696a0]',
  starter: 'bg-blue-500/15 text-blue-400',
  growth: 'bg-[#00a884]/15 text-[#00a884]',
  business: 'bg-purple-500/15 text-purple-400',
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${planColors[plan] || planColors.trial}`}>
      {plan}
    </span>
  )
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color = '#00a884' }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string
}) {
  return (
    <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[#8696a0] text-xs mb-1">{label}</div>
        <div className="text-white text-2xl font-bold font-mono">{value}</div>
        {sub && <div className="text-[#8696a0] text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Tab button ────────────────────────────────────────────────────────── */
function Tab({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#1f2c34]'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#00a884] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">{badge}</span>
      )}
    </button>
  )
}

/* ─── Generate random code ───────────────────────────────────────────────── */
function generateCode(prefix = 'LYTRIX') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}${rand}`
}

/* ─── Main admin page ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'businesses' | 'discounts' | 'messages' | 'votes' | 'settings'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // Votes state
  const [votes, setVotes] = useState<Array<{ feature_id: string; count: number }>>([])
  const [votesLoading, setVotesLoading] = useState(false)

  // Platform settings state
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>({})
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Businesses state
  const [bizSearch, setBizSearch] = useState('')
  const [bizPlanFilter, setBizPlanFilter] = useState('all')
  const [bizUpdating, setBizUpdating] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Discounts state
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [discountsLoading, setDiscountsLoading] = useState(false)
  const [showNewCode, setShowNewCode] = useState(false)
  const [codeForm, setCodeForm] = useState({
    code: generateCode(),
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: 20,
    applies_to_plan: '',
    max_uses: '',
    expires_at: '',
    description: '',
  })
  const [codeCreating, setCodeCreating] = useState(false)
  const [codeCopied, setCodeCopied] = useState<string | null>(null)

  /* Load stats */
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* Load discounts when tab opens */
  useEffect(() => {
    if (tab === 'discounts') loadDiscounts()
  }, [tab])

  /* Load votes when tab opens */
  useEffect(() => {
    if (tab === 'votes') {
      setVotesLoading(true)
      fetch('/api/admin/votes').then(r => r.json()).then(d => { setVotes(d.votes || []); setVotesLoading(false) })
    }
    if (tab === 'settings') {
      fetch('/api/admin/config').then(r => r.json()).then(d => setPlatformConfig(d.config || {}))
    }
  }, [tab])

  const saveConfig = async (key: string, value: string) => {
    setConfigSaving(true)
    await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setPlatformConfig(prev => ({ ...prev, [key]: value }))
    setConfigSaving(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const loadDiscounts = useCallback(async () => {
    setDiscountsLoading(true)
    const r = await fetch('/api/admin/discounts')
    const d = await r.json()
    setDiscounts(d.codes || [])
    setDiscountsLoading(false)
  }, [])

  /* Update plan */
  const updatePlan = async (id: string, plan: string) => {
    setBizUpdating(id)
    const expires = plan === 'trial' ? null : new Date(Date.now() + 30 * 86400000).toISOString()
    await fetch('/api/admin/businesses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, plan, plan_expires_at: expires }),
    })
    setStats(prev => prev ? {
      ...prev,
      businesses: prev.businesses.map(b => b.id === id ? { ...b, plan } : b),
    } : prev)
    setBizUpdating(null)
  }

  /* Toggle auto_reply */
  const toggleAutoReply = async (id: string, current: boolean) => {
    setBizUpdating(id)
    await fetch('/api/admin/businesses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, auto_reply: !current }),
    })
    setStats(prev => prev ? {
      ...prev,
      businesses: prev.businesses.map(b => b.id === id ? { ...b, auto_reply: !current } : b),
    } : prev)
    setBizUpdating(null)
  }

  /* Delete business */
  const deleteBusiness = async (id: string) => {
    await fetch('/api/admin/businesses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setStats(prev => prev ? {
      ...prev,
      businesses: prev.businesses.filter(b => b.id !== id),
      totalBusinesses: prev.totalBusinesses - 1,
    } : prev)
    setConfirmDelete(null)
  }

  /* Create discount code */
  const createCode = async () => {
    setCodeCreating(true)
    const body = {
      ...codeForm,
      discount_value: Number(codeForm.discount_value),
      max_uses: codeForm.max_uses ? Number(codeForm.max_uses) : null,
      expires_at: codeForm.expires_at || null,
      applies_to_plan: codeForm.applies_to_plan || null,
    }
    const r = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    if (d.code) {
      setDiscounts(prev => [d.code, ...prev])
      setShowNewCode(false)
      setCodeForm({ code: generateCode(), discount_type: 'percent', discount_value: 20, applies_to_plan: '', max_uses: '', expires_at: '', description: '' })
    }
    setCodeCreating(false)
  }

  /* Toggle discount active */
  const toggleDiscount = async (id: string, current: boolean) => {
    await fetch('/api/admin/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, is_active: !current } : d))
  }

  /* Delete discount */
  const deleteDiscount = async (id: string) => {
    await fetch('/api/admin/discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDiscounts(prev => prev.filter(d => d.id !== id))
  }

  /* Copy code to clipboard */
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCodeCopied(code)
    setTimeout(() => setCodeCopied(null), 2000)
  }

  const filteredBiz = (stats?.businesses || []).filter(b => {
    const matchPlan = bizPlanFilter === 'all' || b.plan === bizPlanFilter
    const matchSearch = !bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase())
    return matchPlan && matchSearch
  })

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div className="min-h-screen bg-[#08090a]">
      {/* Top bar */}
      <div className="border-b border-[#374045] bg-[#111b21] sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo&name.png" alt="WAgenT" width={140} height={34} className="h-8 w-auto object-contain" />
            <div className="h-5 w-px bg-[#374045]" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
              <span className="text-[#00a884] text-xs font-semibold uppercase tracking-widest">Admin Console</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#8696a0] hover:text-white text-sm transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to app
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif italic text-white mb-1">LYTRIX CONSULT — Admin</h1>
          <p className="text-[#8696a0] text-sm">Full platform management for WAgenT</p>
        </div>

        {/* Sidebar + content layout */}
        <div className="flex gap-8">
          {/* Sidebar nav */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              {[
                { id: 'overview', label: 'Overview', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
                { id: 'businesses', label: 'Businesses', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>, badge: stats?.totalBusinesses },
                { id: 'discounts', label: 'Discounts', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
                { id: 'messages', label: 'Activity', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
                { id: 'votes', label: 'Votes', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904" /></svg> },
                { id: 'settings', label: 'Platform', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as typeof tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === item.id ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]'
                  }`}
                >
                  <span className={tab === item.id ? 'text-[#00a884]' : ''}>{item.icon}</span>
                  {item.label}
                  {item.badge !== undefined && (
                    <span className="ml-auto text-[10px] text-[#8696a0]">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-[#111b21] border border-[#374045] rounded-2xl p-5 h-24 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        label="Total Businesses"
                        value={stats?.totalBusinesses || 0}
                        sub={`+${stats?.recentSignups || 0} this week`}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
                      />
                      <StatCard
                        label="Est. MRR"
                        value={`GHS ${(stats?.mrr || 0).toLocaleString()}`}
                        sub="Based on active plans"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
                        color="#f59e0b"
                      />
                      <StatCard
                        label="Total Messages"
                        value={fmt(stats?.totalMessages || 0)}
                        sub="All time"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
                        color="#3b82f6"
                      />
                      <StatCard
                        label="Connected"
                        value={`${stats?.connected || 0} / ${stats?.totalBusinesses || 0}`}
                        sub="WhatsApp connected"
                        icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
                      />
                    </div>

                    {/* Plan breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-5">Plan Distribution</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Trial', key: 'trial', color: '#374045', price: 0 },
                            { label: 'Starter', key: 'starter', color: '#3b82f6', price: 199 },
                            { label: 'Growth', key: 'growth', color: '#00a884', price: 449 },
                            { label: 'Business', key: 'business', color: '#a855f7', price: 899 },
                          ].map(p => {
                            const count = stats?.planCounts[p.key] || 0
                            const total = stats?.totalBusinesses || 1
                            const pct = Math.round((count / total) * 100)
                            return (
                              <div key={p.key}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                    <span className="text-[#8696a0] text-sm">{p.label}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#8696a0] text-xs">GHS {p.price}/mo</span>
                                    <span className="text-white text-sm font-mono font-medium w-6 text-right">{count}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-[#1f2c34] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: p.color }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-5">Recent Signups</h3>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {(stats?.businesses || []).slice(0, 10).map(b => (
                            <div key={b.id} className="flex items-center gap-3 py-2 border-b border-[#374045]/50 last:border-0">
                              <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center text-xs font-semibold text-[#e9edef] flex-shrink-0">
                                {b.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[#e9edef] text-sm truncate">{b.name}</div>
                                <div className="text-[#8696a0] text-[10px]">{b.industry || 'Unknown industry'}</div>
                              </div>
                              <PlanBadge plan={b.plan} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => setTab('discounts')} className="flex items-center gap-2 px-4 py-2.5 bg-[#00a884]/10 border border-[#00a884]/25 text-[#00a884] rounded-xl text-sm font-medium hover:bg-[#00a884]/20 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          New Discount Code
                        </button>
                        <button onClick={() => setTab('businesses')} className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2c34] border border-[#374045] text-[#e9edef] rounded-xl text-sm font-medium hover:bg-[#2a3942] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Manage Businesses
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── BUSINESSES ── */}
            {tab === 'businesses' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">All Businesses</h2>
                  <span className="text-[#8696a0] text-sm">{filteredBiz.length} results</span>
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-[#111b21] border border-[#374045] rounded-xl px-3 py-2 flex-1 min-w-48">
                    <svg className="w-4 h-4 text-[#8696a0] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      value={bizSearch}
                      onChange={e => setBizSearch(e.target.value)}
                      placeholder="Search businesses..."
                      className="bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none flex-1"
                    />
                  </div>
                  {['all', 'trial', 'starter', 'growth', 'business'].map(p => (
                    <button
                      key={p}
                      onClick={() => setBizPlanFilter(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${bizPlanFilter === p ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30' : 'bg-[#111b21] border border-[#374045] text-[#8696a0] hover:text-white'}`}
                    >
                      {p === 'all' ? 'All Plans' : p}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="bg-[#111b21] border border-[#374045] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#374045]">
                          <th className="text-left px-5 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">Business</th>
                          <th className="text-left px-4 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">Plan</th>
                          <th className="text-left px-4 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">WA Connected</th>
                          <th className="text-left px-4 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">AI Replies</th>
                          <th className="text-left px-4 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">Joined</th>
                          <th className="text-left px-4 py-3.5 text-[#8696a0] text-xs font-medium uppercase tracking-wider">Change Plan</th>
                          <th className="px-4 py-3.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBiz.map(b => (
                          <tr key={b.id} className="border-b border-[#374045]/50 hover:bg-[#1f2c34]/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#2a3942] flex items-center justify-center text-sm font-semibold text-[#e9edef] flex-shrink-0">
                                  {b.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-[#e9edef] text-sm font-medium">{b.name}</div>
                                  <div className="text-[#8696a0] text-xs">{b.industry || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5"><PlanBadge plan={b.plan} /></td>
                            <td className="px-4 py-3.5">
                              {b.phone_number_id ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#00a884]" />
                                  <span className="text-[#00a884] text-xs">Connected</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#374045]" />
                                  <span className="text-[#8696a0] text-xs">Not set up</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => toggleAutoReply(b.id, b.auto_reply)}
                                disabled={bizUpdating === b.id}
                                className={`w-9 h-5 rounded-full relative transition-all duration-200 ${b.auto_reply ? 'bg-[#00a884]' : 'bg-[#374045]'}`}
                              >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${b.auto_reply ? 'left-4' : 'left-0.5'}`} />
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-[#8696a0] text-xs">
                              {new Date(b.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5">
                              <select
                                value={b.plan}
                                onChange={e => updatePlan(b.id, e.target.value)}
                                disabled={bizUpdating === b.id}
                                className="bg-[#2a3942] text-[#e9edef] text-xs rounded-lg px-2 py-1.5 border border-[#374045] outline-none cursor-pointer hover:border-[#00a884]/40 transition-colors disabled:opacity-50"
                              >
                                <option value="trial">Trial</option>
                                <option value="starter">Starter</option>
                                <option value="growth">Growth</option>
                                <option value="business">Business</option>
                              </select>
                            </td>
                            <td className="px-4 py-3.5">
                              {confirmDelete === b.id ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => deleteBusiness(b.id)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Confirm</button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#8696a0] hover:text-white transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete(b.id)} className="text-[#8696a0] hover:text-red-400 transition-colors p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredBiz.length === 0 && (
                          <tr><td colSpan={7} className="py-16 text-center text-[#8696a0] text-sm">No businesses found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── DISCOUNTS ── */}
            {tab === 'discounts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Discount Codes</h2>
                  <button
                    onClick={() => { setShowNewCode(true); setCodeForm(f => ({ ...f, code: generateCode() })) }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Generate Code
                  </button>
                </div>

                {/* New code form */}
                {showNewCode && (
                  <div className="bg-[#111b21] border border-[#00a884]/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,168,132,0.08)]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold text-lg">New Discount Code</h3>
                      <button onClick={() => setShowNewCode(false)} className="text-[#8696a0] hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Code */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Code</label>
                        <div className="flex gap-2">
                          <input
                            value={codeForm.code}
                            onChange={e => setCodeForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                            className="flex-1 bg-[#2a3942] border border-[#374045] text-[#e9edef] rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-[#00a884]/50 tracking-widest"
                            placeholder="LYTRIX2026"
                          />
                          <button
                            type="button"
                            onClick={() => setCodeForm(f => ({ ...f, code: generateCode() }))}
                            className="px-3 py-2.5 bg-[#2a3942] border border-[#374045] text-[#8696a0] rounded-xl hover:text-white hover:border-[#374045] transition-colors"
                            title="Randomize"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Description (optional)</label>
                        <input
                          value={codeForm.description}
                          onChange={e => setCodeForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="e.g. Launch promo, 20% off"
                          className="w-full bg-[#2a3942] border border-[#374045] text-[#e9edef] placeholder-[#8696a0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50"
                        />
                      </div>

                      {/* Discount type */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Discount Type</label>
                        <div className="flex gap-2">
                          {(['percent', 'fixed'] as const).map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCodeForm(f => ({ ...f, discount_type: t }))}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${codeForm.discount_type === t ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884]' : 'bg-[#2a3942] border-[#374045] text-[#8696a0] hover:text-white'}`}
                            >
                              {t === 'percent' ? '% Percentage' : 'GHS Fixed'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Discount value */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">
                          {codeForm.discount_type === 'percent' ? 'Discount %' : 'Discount Amount (GHS)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={codeForm.discount_type === 'percent' ? 100 : 9999}
                            value={codeForm.discount_value}
                            onChange={e => setCodeForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                            className="w-full bg-[#2a3942] border border-[#374045] text-[#e9edef] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50 pr-12"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8696a0] text-sm">
                            {codeForm.discount_type === 'percent' ? '%' : 'GHS'}
                          </span>
                        </div>
                      </div>

                      {/* Applies to plan */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Applies to Plan</label>
                        <select
                          value={codeForm.applies_to_plan}
                          onChange={e => setCodeForm(f => ({ ...f, applies_to_plan: e.target.value }))}
                          className="w-full bg-[#2a3942] border border-[#374045] text-[#e9edef] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50 cursor-pointer"
                        >
                          <option value="">All plans</option>
                          <option value="starter">Starter only</option>
                          <option value="growth">Growth only</option>
                          <option value="business">Business only</option>
                        </select>
                      </div>

                      {/* Max uses */}
                      <div>
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Max Uses (blank = unlimited)</label>
                        <input
                          type="number"
                          min={1}
                          value={codeForm.max_uses}
                          onChange={e => setCodeForm(f => ({ ...f, max_uses: e.target.value }))}
                          placeholder="Unlimited"
                          className="w-full bg-[#2a3942] border border-[#374045] text-[#e9edef] placeholder-[#8696a0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50"
                        />
                      </div>

                      {/* Expiry */}
                      <div className="md:col-span-2">
                        <label className="text-[#8696a0] text-xs font-medium mb-2 block uppercase tracking-wider">Expiry Date (blank = never expires)</label>
                        <input
                          type="date"
                          value={codeForm.expires_at}
                          onChange={e => setCodeForm(f => ({ ...f, expires_at: e.target.value }))}
                          className="bg-[#2a3942] border border-[#374045] text-[#e9edef] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50 w-64"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-5 p-4 bg-[#0b141a] border border-[#374045] rounded-xl">
                      <div className="text-[#8696a0] text-xs mb-2">Preview</div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white text-lg font-bold tracking-widest">{codeForm.code || '—'}</span>
                        <span className="text-[#8696a0] text-sm">→</span>
                        <span className="text-[#00a884] font-semibold">
                          {codeForm.discount_type === 'percent' ? `${codeForm.discount_value}% off` : `GHS ${codeForm.discount_value} off`}
                          {codeForm.applies_to_plan ? ` (${codeForm.applies_to_plan} plan)` : ' (all plans)'}
                        </span>
                        {codeForm.max_uses && <span className="text-[#8696a0] text-xs">· max {codeForm.max_uses} uses</span>}
                        {codeForm.expires_at && <span className="text-[#8696a0] text-xs">· expires {new Date(codeForm.expires_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={createCode}
                        disabled={codeCreating || !codeForm.code}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
                      >
                        {codeCreating ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                        {codeCreating ? 'Creating...' : 'Create Code'}
                      </button>
                      <button onClick={() => setShowNewCode(false)} className="px-5 py-2.5 border border-[#374045] text-[#8696a0] hover:text-white hover:border-[#374045] rounded-xl text-sm transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Codes list */}
                {discountsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111b21] border border-[#374045] rounded-2xl animate-pulse" />)}
                  </div>
                ) : discounts.length === 0 ? (
                  <div className="bg-[#111b21] border border-[#374045] rounded-2xl py-16 text-center">
                    <div className="w-12 h-12 bg-[#1f2c34] rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-[#374045]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" /></svg>
                    </div>
                    <p className="text-[#8696a0] text-sm">No discount codes yet — create your first one above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discounts.map(d => {
                      const isExpired = d.expires_at ? new Date(d.expires_at) < new Date() : false
                      const isMaxed = d.max_uses ? d.uses_count >= d.max_uses : false
                      const exhausted = isExpired || isMaxed
                      return (
                        <div key={d.id} className={`bg-[#111b21] border rounded-2xl p-4 flex items-center gap-4 transition-all ${d.is_active && !exhausted ? 'border-[#374045]' : 'border-[#374045]/50 opacity-60'}`}>
                          {/* Code */}
                          <div className="flex-shrink-0">
                            <div className="font-mono text-white font-bold text-base tracking-widest">{d.code}</div>
                            {d.description && <div className="text-[#8696a0] text-xs mt-0.5">{d.description}</div>}
                          </div>

                          {/* Value */}
                          <div className="flex-shrink-0 px-4 py-1.5 rounded-full bg-[#00a884]/10 border border-[#00a884]/20">
                            <span className="text-[#00a884] font-semibold text-sm">
                              {d.discount_type === 'percent' ? `${d.discount_value}%` : `GHS ${d.discount_value}`} off
                            </span>
                          </div>

                          {/* Meta */}
                          <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                            {d.applies_to_plan && <PlanBadge plan={d.applies_to_plan} />}
                            <span className="text-[#8696a0] text-xs bg-[#1f2c34] px-2 py-0.5 rounded-full">
                              {d.uses_count} / {d.max_uses ?? '∞'} uses
                            </span>
                            {d.expires_at && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-500/15 text-red-400' : 'bg-[#1f2c34] text-[#8696a0]'}`}>
                                {isExpired ? 'Expired' : `Expires ${new Date(d.expires_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}`}
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                            d.is_active && !exhausted ? 'bg-[#00a884]/15 text-[#00a884]' : 'bg-[#374045] text-[#8696a0]'
                          }`}>
                            {exhausted ? (isExpired ? 'Expired' : 'Maxed') : (d.is_active ? 'Active' : 'Inactive')}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyCode(d.code)}
                              className="text-[#8696a0] hover:text-[#00a884] transition-colors p-1.5"
                              title="Copy code"
                            >
                              {codeCopied === d.code ? (
                                <svg className="w-4 h-4 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              )}
                            </button>
                            <button
                              onClick={() => toggleDiscount(d.id, d.is_active)}
                              className={`text-[#8696a0] transition-colors p-1.5 ${d.is_active ? 'hover:text-yellow-400' : 'hover:text-[#00a884]'}`}
                              title={d.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                            <button
                              onClick={() => deleteDiscount(d.id)}
                              className="text-[#8696a0] hover:text-red-400 transition-colors p-1.5"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVITY ── */}
            {tab === 'messages' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Platform Activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Messages" value={fmt(stats?.totalMessages || 0)} sub="All time across all businesses" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>} color="#3b82f6" />
                  <StatCard label="Conversations" value={fmt(stats?.totalConversations || 0)} sub="Total customer threads" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>} />
                  <StatCard label="Est. MRR" value={`GHS ${(stats?.mrr || 0).toLocaleString()}`} sub="Monthly recurring revenue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="#f59e0b" />
                </div>

                <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Business Activity Summary</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(stats?.businesses || []).map(b => (
                      <div key={b.id} className="flex items-center gap-4 py-2.5 border-b border-[#374045]/50 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-[#2a3942] flex items-center justify-center text-xs font-semibold text-[#e9edef] flex-shrink-0">
                          {b.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#e9edef] text-sm">{b.name}</div>
                          <div className="text-[#8696a0] text-xs">{b.industry || 'Unknown'}</div>
                        </div>
                        <PlanBadge plan={b.plan} />
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.auto_reply ? 'bg-[#00a884]' : 'bg-[#374045]'}`} title={b.auto_reply ? 'AI active' : 'AI off'} />
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.phone_number_id ? 'bg-blue-400' : 'bg-[#374045]'}`} title={b.phone_number_id ? 'WA connected' : 'WA not connected'} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[#8696a0]">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00a884]" /> AI Active</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" /> WA Connected</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#374045]" /> Off / Not set</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FEATURE VOTES ── */}
            {tab === 'votes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Feature Requests</h2>
                    <p className="text-[#8696a0] text-sm mt-0.5">What businesses are asking for — sorted by demand</p>
                  </div>
                  <button onClick={() => { setVotesLoading(true); fetch('/api/admin/votes').then(r=>r.json()).then(d=>{setVotes(d.votes||[]);setVotesLoading(false)}) }} className="text-xs text-[#8696a0] hover:text-white px-3 py-1.5 border border-[#374045] rounded-lg transition-colors">Refresh</button>
                </div>

                {votesLoading ? (
                  <div className="space-y-3">
                    {Array.from({length:6}).map((_,i) => <div key={i} className="h-16 bg-[#111b21] border border-[#374045] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { id: 'team_handoff', title: 'Smart Team Handoff', emoji: '👤' },
                      { id: 'audio_replies', title: 'Voice Message Replies', emoji: '🎙️' },
                      { id: 'ai_call_handling', title: 'AI Call Accepting', emoji: '📞' },
                      { id: 'payment_link', title: 'Send Payment Links in Chat', emoji: '💳' },
                      { id: 'multi_language', title: 'Multi-language Replies', emoji: '🌍' },
                      { id: 'broadcast', title: 'AI-Powered Broadcasts', emoji: '📣' },
                      { id: 'instagram_dm', title: 'Instagram DM Automation', emoji: '📸' },
                      { id: 'ai_catalog', title: 'Product Catalogue Browser', emoji: '🛍️' },
                    ]
                      .map(f => ({ ...f, count: votes.find(v => v.feature_id === f.id)?.count || 0 }))
                      .sort((a, b) => b.count - a.count)
                      .map((feature, idx) => {
                        const max = Math.max(...[...votes.map(v => v.count), 1])
                        const pct = Math.round((feature.count / max) * 100)
                        return (
                          <div key={feature.id} className="bg-[#111b21] border border-[#374045] rounded-xl p-4 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#1f2c34] flex items-center justify-center text-lg flex-shrink-0">{feature.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[#e9edef] text-sm font-medium">{feature.title}</span>
                                {idx === 0 && feature.count > 0 && <span className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-semibold">🔥 Top</span>}
                              </div>
                              <div className="h-1.5 bg-[#1f2c34] rounded-full overflow-hidden">
                                <div className="h-full bg-[#00a884] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-white font-mono font-bold text-lg w-10 text-right flex-shrink-0">{feature.count}</div>
                          </div>
                        )
                      })}
                    <p className="text-[#374045] text-xs text-center pt-2">Total votes cast: {votes.reduce((s, v) => s + Number(v.count), 0)}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PLATFORM SETTINGS ── */}
            {tab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Platform Settings</h2>
                    <p className="text-[#8696a0] text-sm mt-0.5">Live config — changes take effect immediately, no redeployment needed</p>
                  </div>
                  {configSaved && <span className="text-[#00a884] text-sm">Saved ✓</span>}
                </div>

                {/* WhatsApp Support Number */}
                <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-[#e9edef] font-medium mb-0.5">LYTRIX CONSULT WhatsApp Number</h3>
                    <p className="text-[#8696a0] text-xs">Used in the floating support button, onboarding help link, referral claim button, and upgrade page. International format without + (e.g. 233244123456)</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={platformConfig['lytrix_wa_number'] ?? ''}
                      onChange={e => setPlatformConfig(prev => ({ ...prev, lytrix_wa_number: e.target.value }))}
                      placeholder="233244123456"
                      className="flex-1 bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-2.5 text-[#e9edef] placeholder-[#8696a0] text-sm font-mono outline-none focus:border-[#00a884]/50"
                    />
                    <button
                      onClick={() => saveConfig('lytrix_wa_number', platformConfig['lytrix_wa_number'] || '')}
                      disabled={configSaving}
                      className="px-5 py-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                    >
                      {configSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  {platformConfig['lytrix_wa_number'] && platformConfig['lytrix_wa_number'] !== '233XXXXXXXXX' && (
                    <a
                      href={`https://wa.me/${platformConfig['lytrix_wa_number']}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-[#00a884] hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      Test link → wa.me/{platformConfig['lytrix_wa_number']}
                    </a>
                  )}
                </div>

                <p className="text-[#374045] text-xs">More configurable settings will appear here as the platform grows.</p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
