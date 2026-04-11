'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function SupportBanner() {
  const [href, setHref] = useState(`https://wa.me/${process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX'}?text=Hi%20LYTRIX%20CONSULT%2C%20I%20need%20help%20setting%20up%20WAgenT.`)
  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => {
      const num = d.lytrix_wa_number || process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX'
      setHref(`https://wa.me/${num}?text=Hi%20LYTRIX%20CONSULT%2C%20I%20need%20help%20setting%20up%20WAgenT.`)
    }).catch(() => {})
  }, [])
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-[#00a884]/10 border border-[#00a884]/25 rounded-xl px-4 py-3 hover:bg-[#00a884]/15 transition-colors group"
    >
      <svg className="w-5 h-5 text-[#00a884] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <div className="min-w-0">
        <div className="text-[#e9edef] text-xs font-medium">Need help at any point?</div>
        <div className="text-[#8696a0] text-xs">WhatsApp LYTRIX CONSULT — we reply in minutes</div>
      </div>
      <svg className="w-4 h-4 text-[#00a884] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </a>
  )
}

type Step = 1 | 2 | 3 | 4

const industries = [
  'Electronics & Technology', 'Retail & E-commerce', 'Healthcare & Pharmacy',
  'Food & Beverage', 'Real Estate', 'Logistics & Delivery', 'Education',
  'Financial Services', 'Beauty & Wellness', 'Other',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({
    businessName: '', industry: '', country: 'Ghana',
    phoneNumberId: '', businessAccountId: '', accessToken: '',
    verifyToken: `wagent_${Math.random().toString(36).slice(2, 10)}`,
    description: '',
    faq1q: '', faq1a: '', faq2q: '', faq2a: '',
  })

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const testConnection = async () => {
    setTestStatus('testing')
    try {
      const res = await fetch('/api/webhook?hub.mode=subscribe&hub.verify_token=' + form.verifyToken + '&hub.challenge=test123')
      setTestStatus(res.ok ? 'success' : 'error')
    } catch { setTestStatus('error') }
  }

  const handleComplete = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('businesses').update({
      name: form.businessName,
      industry: form.industry,
      phone_number_id: form.phoneNumberId || null,
      whatsapp_business_account_id: form.businessAccountId || null,
      whatsapp_access_token: form.accessToken || null,
      whatsapp_verify_token: form.verifyToken,
      custom_instructions: form.description ? `You are the AI assistant for ${form.businessName}.\n\n${form.description}` : null,
      plan: 'trial',
      plan_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('user_id', user.id)

    const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
    if (business) {
      const faqs = [{ q: form.faq1q, a: form.faq1a }, { q: form.faq2q, a: form.faq2a }].filter(f => f.q && f.a)
      if (faqs.length) {
        await supabase.from('faqs').insert(faqs.map((f, i) => ({ business_id: business.id, question: f.q, answer: f.a, display_order: i })))
      }
    }
    router.push('/dashboard')
  }

  const steps = ['Welcome', 'Connect WhatsApp', 'Train AI', 'Choose Plan']

  return (
    <div className="min-h-screen bg-[#08090a] flex flex-col">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo&name.png" alt="WAgenT" width={120} height={36} className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all ${i + 1 === step ? 'bg-[#00a884]/20 text-[#00a884] font-medium' : i + 1 < step ? 'text-[#00a884]/60' : 'text-[#374045]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${i + 1 <= step ? 'bg-[#00a884]' : 'bg-[#374045]'}`} />
                <span className="hidden sm:inline">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-serif italic text-white mb-2">Welcome to WAgenT</h1>
              <p className="text-[#8696a0] mb-8">Let&apos;s set up your AI agent in 10 minutes.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#e9edef] text-sm font-medium mb-2">Business name</label>
                  <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Accra Electronics Hub" className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50" />
                </div>
                <div>
                  <label className="block text-[#e9edef] text-sm font-medium mb-2">Industry</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] text-sm outline-none focus:border-[#00a884]/50">
                    <option value="">Select your industry</option>
                    {industries.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#e9edef] text-sm font-medium mb-2">Country</label>
                  <input value={form.country} onChange={e => set('country', e.target.value)} className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] text-sm outline-none focus:border-[#00a884]/50" />
                </div>
                <button onClick={() => setStep(2)} disabled={!form.businessName} className="w-full bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all">Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-serif italic text-white mb-2">Connect WhatsApp</h2>
              <p className="text-[#8696a0] mb-4">Get credentials from Meta Business Suite → WhatsApp → API Setup.</p>
              <div className="mb-5"><SupportBanner /></div>
              <div className="space-y-4">
                {[
                  { label: 'Phone Number ID', key: 'phoneNumberId', ph: '1234567890' },
                  { label: 'Business Account ID', key: 'businessAccountId', ph: '0987654321' },
                  { label: 'Access Token', key: 'accessToken', ph: 'EAABwzLixnjY...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[#e9edef] text-sm font-medium mb-2">{f.label}</label>
                    <input value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm font-mono outline-none focus:border-[#00a884]/50" />
                  </div>
                ))}
                <div className="bg-[#1f2c34] border border-[#374045] rounded-xl p-4">
                  <p className="text-[#8696a0] text-xs mb-1">Webhook Verify Token</p>
                  <code className="text-[#00a884] font-mono text-sm">{form.verifyToken}</code>
                  <p className="text-[#374045] text-xs mt-2">Webhook URL: {process.env.NEXT_PUBLIC_APP_URL || 'https://wagent.tritech.com.gh'}/api/webhook</p>
                </div>
                <button onClick={testConnection} disabled={testStatus === 'testing'} className="w-full border border-[#374045] hover:border-[#00a884]/40 text-[#e9edef] font-medium py-3 rounded-xl text-sm transition-all">
                  {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? '✓ Connected' : testStatus === 'error' ? '✗ Failed — check credentials' : 'Test Connection'}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border border-[#374045] text-[#8696a0] py-3 rounded-xl text-sm">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-[#00a884] hover:bg-[#00c49a] text-white py-3 rounded-xl text-sm transition-all">Continue →</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-serif italic text-white mb-2">Train your AI</h2>
              <p className="text-[#8696a0] mb-6">Tell your AI about your business and add common FAQs.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#e9edef] text-sm font-medium mb-2">Business description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe your products/services, location, pricing, and policies..." className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 resize-none" />
                </div>
                {[1, 2].map(n => (
                  <div key={n}>
                    <label className="block text-[#e9edef] text-sm font-medium mb-2">FAQ {n}</label>
                    <input value={form[`faq${n}q` as keyof typeof form]} onChange={e => set(`faq${n}q`, e.target.value)} placeholder="Question..." className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 mb-2" />
                    <textarea value={form[`faq${n}a` as keyof typeof form]} onChange={e => set(`faq${n}a`, e.target.value)} rows={2} placeholder="Answer..." className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 resize-none" />
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 border border-[#374045] text-[#8696a0] py-3 rounded-xl text-sm">Back</button>
                  <button onClick={() => setStep(4)} className="flex-1 bg-[#00a884] hover:bg-[#00c49a] text-white py-3 rounded-xl text-sm transition-all">Continue →</button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-serif italic text-white mb-2">Choose your plan</h2>
              <p className="text-[#8696a0] mb-6">All plans start with a 14-day free trial.</p>
              <div className="space-y-3 mb-6">
                {[
                  { name: 'Starter', price: 199, features: ['500 replies/month', '1 WhatsApp number', 'Basic analytics'] },
                  { name: 'Growth', price: 449, features: ['2,000 replies/month', '3 numbers', 'Voice messages'], popular: true },
                  { name: 'Business', price: 899, features: ['Unlimited replies', '10 numbers', 'API access'] },
                ].map(plan => (
                  <div key={plan.name} className={`p-4 rounded-xl border ${plan.popular ? 'border-[#00a884] bg-[#00a884]/5' : 'border-[#374045] bg-[#1f2c34]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{plan.name}</span>
                      <span className="font-mono text-[#00a884] text-sm">GHS {plan.price}/mo</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {plan.features.map(f => <span key={f} className="text-[#8696a0] text-xs">{f}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 border border-[#374045] text-[#8696a0] py-3 rounded-xl text-sm">Back</button>
                <button onClick={handleComplete} disabled={loading} className="flex-1 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-60 text-white py-3 rounded-xl text-sm transition-all">
                  {loading ? 'Setting up...' : 'Start free trial →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
