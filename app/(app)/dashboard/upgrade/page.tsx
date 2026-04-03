'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 199,
    annual: 1990,
    color: 'blue',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    features: ['Up to 500 AI replies/month', '1 WhatsApp number', 'FAQ training', 'Basic analytics', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 449,
    annual: 4490,
    color: 'green',
    badge: 'bg-[#00a884]/15 text-[#00a884] border-[#00a884]/25',
    popular: true,
    features: ['Unlimited AI replies', '3 WhatsApp numbers', 'Document & FAQ training', 'Full analytics', 'Voice message replies', 'Referral rewards', 'Priority support'],
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 899,
    annual: 8990,
    color: 'purple',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    features: ['Everything in Growth', 'Unlimited numbers', 'Team member access', 'Custom AI instructions', 'API access', 'Dedicated account manager'],
  },
]

export default function UpgradePage() {
  const supabase = createClient()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [failedNotice, setFailedNotice] = useState(false)

  useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('status') === 'failed') {
        setFailedNotice(true)
        window.history.replaceState({}, '', '/dashboard/upgrade')
      }
    }
  })

  const handleUpgrade = async (planId: string) => {
    setLoading(planId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(null); return }

    const res = await fetch('/api/paystack/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, billing }),
    })
    const data = await res.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#374045] bg-[#111b21] px-6 py-4 flex items-center justify-between">
        <Image src="/logo&name.png" alt="WAgenT" width={160} height={40} className="h-9 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <span className="text-[#8696a0] text-xs">Need help?</span>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX'}?text=Hi%2C%20I%20need%20help%20upgrading%20my%20WAgenT%20plan.`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a884] text-xs hover:underline"
          >
            Chat with us
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Payment failed notice */}
        {failedNotice && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-5 py-3 max-w-md mx-auto">
            <span className="text-red-400 text-lg">⚠️</span>
            <div>
              <div className="text-red-400 font-medium text-sm">Payment was not completed</div>
              <div className="text-[#8696a0] text-xs">Your plan was not changed. Please try again.</div>
            </div>
          </div>
        )}

        {/* Expired notice */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏰</span>
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">Your free trial has ended</h1>
          <p className="text-[#8696a0] text-sm max-w-sm mx-auto">
            Your 14-day trial is over. Choose a plan to keep your AI agent running and never miss a customer message.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 mb-8 bg-[#111b21] border border-[#374045] rounded-xl p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
          >
            Annual
            <span className="text-[10px] bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/25 px-1.5 py-0.5 rounded-full font-semibold">Save 17%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-[#111b21] border rounded-2xl p-6 flex flex-col ${
                plan.popular ? 'border-[#00a884]/40 shadow-[0_0_30px_rgba(0,168,132,0.08)]' : 'border-[#374045]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#00a884] text-white text-[11px] font-semibold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}

              <div className="mb-4">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${plan.badge}`}>{plan.name}</span>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-3xl font-bold">
                    GHS {billing === 'monthly' ? plan.monthly : plan.annual}
                  </span>
                  <span className="text-[#8696a0] text-sm">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billing === 'annual' && (
                  <div className="text-[#8696a0] text-xs mt-0.5 line-through">GHS {plan.monthly * 12}/yr</div>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#8696a0]">
                    <svg className="w-4 h-4 text-[#00a884] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                  plan.popular
                    ? 'bg-[#00a884] hover:bg-[#00c49a] text-white shadow-[0_4px_20px_rgba(0,168,132,0.25)]'
                    : 'bg-[#1f2c34] border border-[#374045] text-[#e9edef] hover:border-[#00a884]/40'
                }`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting…
                  </span>
                ) : (
                  `Get ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-[#374045] text-xs text-center mt-8">
          Payments are processed securely by Paystack. Cancel anytime.
          <br />
          Questions? <Link href={`https://wa.me/${process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX'}`} className="text-[#8696a0] hover:text-[#00a884]" target="_blank">Contact LYTRIX CONSULT</Link>
        </p>
      </div>
    </div>
  )
}
