'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReferralStats {
  referralCode: string
  referredCount: number
  rewardClaimed: boolean
  rewardUnlocked: boolean
}

const REWARDS = [
  { threshold: 1, label: '1 referral', reward: '7 extra trial days', icon: '🎁' },
  { threshold: 3, label: '3 referrals', reward: '1 month free on any plan', icon: '🏆' },
  { threshold: 5, label: '5 referrals', reward: 'Permanent 20% discount', icon: '💎' },
  { threshold: 10, label: '10 referrals', reward: 'Lifetime Growth plan free', icon: '👑' },
]

export default function ReferralsPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [applyCode, setApplyCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [appUrl, setAppUrl] = useState('')
  const [lytrixWa, setLytrixWa] = useState(process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetch('/api/referrals')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { if (d.lytrix_wa_number) setLytrixWa(d.lytrix_wa_number) })
      .catch(() => {})
  }, [])

  const referralLink = `${appUrl}/signup?ref=${stats?.referralCode || ''}`

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyReferral = async () => {
    if (!applyCode.trim()) return
    setApplying(true)
    setApplyResult(null)
    const r = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply', code: applyCode.trim().toUpperCase() }),
    })
    const d = await r.json()
    setApplyResult(r.ok ? { ok: true, msg: 'Referral code applied! Your referrer has been credited.' } : { ok: false, msg: d.error || 'Invalid or already used code.' })
    setApplying(false)
  }

  if (loading) return (
    <div className="p-6 space-y-4 max-w-3xl">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-[#111b21] border border-[#374045] rounded-2xl animate-pulse" />)}
    </div>
  )

  const nextMilestone = REWARDS.find(r => r.threshold > (stats?.referredCount || 0))
  const progress = nextMilestone ? Math.min(((stats?.referredCount || 0) / nextMilestone.threshold) * 100, 100) : 100

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#e9edef]">Referral Program</h1>
        <p className="text-[#8696a0] text-sm mt-1">Invite other businesses to WAgenT and earn rewards</p>
      </div>

      {/* Hero stat */}
      <div className="bg-gradient-to-br from-[#00a884]/15 to-[#00a884]/5 border border-[#00a884]/25 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[#8696a0] text-sm mb-1">Businesses you've referred</div>
            <div className="text-5xl font-bold font-mono text-white">{stats?.referredCount ?? 0}</div>
            <div className="text-[#8696a0] text-xs mt-2">
              {nextMilestone
                ? `${nextMilestone.threshold - (stats?.referredCount || 0)} more to unlock: ${nextMilestone.reward}`
                : '🎉 You\'ve unlocked all rewards!'}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-4 border-[#00a884]/40 flex items-center justify-center text-3xl">
              {stats?.rewardUnlocked ? '🏆' : '🎯'}
            </div>
            {stats?.rewardUnlocked && !stats.rewardClaimed && (
              <span className="text-[10px] bg-[#00a884] text-white px-2 py-0.5 rounded-full font-semibold animate-pulse">Reward ready!</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {nextMilestone && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-[#8696a0] mb-1.5">
              <span>{stats?.referredCount || 0} referred</span>
              <span>Next: {nextMilestone.threshold} ({nextMilestone.icon} {nextMilestone.reward})</span>
            </div>
            <div className="h-2 bg-[#111b21] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00a884] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Your referral link */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-semibold mb-1">Your Referral Link</h2>
        <p className="text-[#8696a0] text-xs mb-4">Share this link — when someone signs up using it, you both benefit.</p>

        <div className="flex gap-2">
          <div className="flex-1 bg-[#0b141a] border border-[#374045] rounded-xl px-4 py-3 font-mono text-sm text-[#e9edef] truncate">
            {referralLink}
          </div>
          <button
            onClick={copy}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
              copied
                ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                : 'bg-[#00a884] hover:bg-[#00c49a] text-white'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[#8696a0] text-xs">Or share your code directly:</span>
          <span className="font-mono font-bold text-[#00a884] bg-[#00a884]/10 px-3 py-1 rounded-lg text-sm tracking-widest">
            {stats?.referralCode || '—'}
          </span>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Hey! I'm using WAgenT — an AI that handles all my WhatsApp messages automatically. Sign up with my link and get a free 14-day trial: ${referralLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] rounded-xl text-xs font-medium hover:bg-[#25D366]/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just found this AI that handles all my WhatsApp messages 🤖 Sign up free: ${referralLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e]/50 border border-white/10 text-[#e9edef] rounded-xl text-xs font-medium hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Share on X
          </a>
        </div>
      </section>

      {/* Rewards ladder */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-semibold mb-4">Rewards Ladder</h2>
        <div className="space-y-3">
          {REWARDS.map((r, i) => {
            const achieved = (stats?.referredCount || 0) >= r.threshold
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  achieved
                    ? 'border-[#00a884]/40 bg-[#00a884]/8'
                    : 'border-[#374045] bg-[#0b141a]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 border ${achieved ? 'border-[#00a884]/40 bg-[#00a884]/15' : 'border-[#374045] bg-[#1f2c34]'}`}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${achieved ? 'text-[#e9edef]' : 'text-[#8696a0]'}`}>{r.reward}</div>
                  <div className="text-[#8696a0] text-xs">{r.label} required</div>
                </div>
                {achieved ? (
                  <div className="flex items-center gap-1.5 text-[#00a884] text-xs font-semibold flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Unlocked
                  </div>
                ) : (
                  <div className="text-[#374045] text-xs flex-shrink-0">{r.threshold - (stats?.referredCount || 0)} more</div>
                )}
              </div>
            )
          })}
        </div>

        {stats?.rewardUnlocked && !stats.rewardClaimed && (
          <div className="mt-4 p-4 bg-[#00a884]/10 border border-[#00a884]/30 rounded-xl flex items-center gap-4">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <div className="text-[#e9edef] font-medium text-sm">You have an unclaimed reward!</div>
              <div className="text-[#8696a0] text-xs">Contact LYTRIX CONSULT on WhatsApp to claim it.</div>
            </div>
            <a
              href={`https://wa.me/${lytrixWa}?text=Hi%20LYTRIX%20CONSULT%2C%20I%27d%20like%20to%20claim%20my%20WAgenT%20referral%20reward.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#00a884] text-white text-xs font-semibold rounded-xl hover:bg-[#00c49a] transition-all flex-shrink-0"
            >
              Claim now
            </a>
          </div>
        )}
      </section>

      {/* Apply a referral code */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-semibold mb-1">Have a referral code?</h2>
        <p className="text-[#8696a0] text-xs mb-4">Enter a code from someone who referred you to WAgenT.</p>
        <div className="flex gap-2">
          <input
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            placeholder="WAG-XXXXXX"
            className="flex-1 bg-[#0b141a] border border-[#374045] text-[#e9edef] placeholder-[#8696a0] font-mono rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#00a884]/50 tracking-widest"
          />
          <button
            onClick={applyReferral}
            disabled={applying || !applyCode.trim()}
            className="px-5 py-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all"
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {applyResult && (
          <p className={`mt-2 text-xs ${applyResult.ok ? 'text-[#00a884]' : 'text-red-400'}`}>
            {applyResult.msg}
          </p>
        )}
      </section>
    </div>
  )
}
