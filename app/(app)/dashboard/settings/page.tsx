'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Business {
  id: string; name: string; plan: string; phone_number_id?: string
  whatsapp_business_account_id?: string; auto_reply: boolean; voice_enabled: boolean
  reply_tone: string; reply_delay_seconds: number; logo_url?: string
  handoff_enabled: boolean; handoff_whatsapp_number?: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
      if (data) {
        setBusiness(data)
        if (data.logo_url) setLogoPreview(data.logo_url)
      }
    }
    load()
  }, [])

  const uploadLogo = async (file: File) => {
    if (!business) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${business.id}/logo.${ext}`
    const { error: upErr } = await supabase.storage.from('business-logos').upload(path, file, { upsert: true })
    if (upErr) { setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('business-logos').getPublicUrl(path)
    await supabase.from('businesses').update({ logo_url: publicUrl }).eq('id', business.id)
    setBusiness(prev => prev ? { ...prev, logo_url: publicUrl } : null)
    setLogoPreview(publicUrl)
    setLogoUploading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const save = async (updates: Partial<Business>) => {
    if (!business) return
    setSaving(true)
    const updated = { ...business, ...updates }
    setBusiness(updated)
    await supabase.from('businesses').update(updates).eq('id', business.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!business) return <div className="p-6"><div className="skeleton h-8 w-48 rounded-lg" /></div>

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#e9edef]">Settings</h1>
        {saved && <span className="text-[#00a884] text-sm">Saved ✓</span>}
      </div>

      {/* Business Profile */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-medium mb-4">Business Profile</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#2a3942] border-2 border-[#374045] overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#00a884]">{business.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {logoUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-[#e9edef] font-medium text-sm mb-0.5">{business.name}</div>
            <div className="text-[#8696a0] text-xs mb-3">This photo appears in your dashboard and chat views</div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="px-4 py-2 text-xs font-medium bg-[#1f2c34] border border-[#374045] text-[#e9edef] rounded-xl hover:border-[#00a884]/40 transition-colors disabled:opacity-50"
            >
              {logoUploading ? 'Uploading…' : logoPreview ? 'Change photo' : 'Upload photo'}
            </button>
            {logoPreview && (
              <button
                onClick={async () => {
                  await supabase.from('businesses').update({ logo_url: null }).eq('id', business.id)
                  setLogoPreview(null)
                  setBusiness(prev => prev ? { ...prev, logo_url: undefined } : null)
                }}
                className="ml-2 px-4 py-2 text-xs font-medium text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </section>

      {/* WhatsApp Connection */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-medium mb-4">WhatsApp Connection</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#374045]">
            <span className="text-[#8696a0] text-sm">Phone Number ID</span>
            <span className="font-mono text-[#e9edef] text-sm">{business.phone_number_id || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#374045]">
            <span className="text-[#8696a0] text-sm">Business Account ID</span>
            <span className="font-mono text-[#e9edef] text-sm">{business.whatsapp_business_account_id || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#8696a0] text-sm">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${business.phone_number_id ? 'bg-[#00a884]' : 'bg-red-400'}`} />
              <span className={`text-sm ${business.phone_number_id ? 'text-[#00a884]' : 'text-red-400'}`}>{business.phone_number_id ? 'Connected' : 'Not connected'}</span>
            </div>
          </div>
          <button onClick={() => router.push('/onboarding')} className="text-[#00a884] text-sm hover:underline mt-2">Re-configure WhatsApp →</button>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-medium mb-4">AI Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[#e9edef] text-sm font-medium mb-2">Reply tone</label>
            <select
              value={business.reply_tone}
              onChange={e => save({ reply_tone: e.target.value })}
              className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] text-sm outline-none focus:border-[#00a884]/50"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[#e9edef] text-sm font-medium">Reply delay</label>
              <span className="text-[#00a884] font-mono text-sm">{business.reply_delay_seconds}s</span>
            </div>
            <input
              type="range" min={0} max={10} step={1}
              value={business.reply_delay_seconds}
              onChange={e => setBusiness(prev => prev ? { ...prev, reply_delay_seconds: parseInt(e.target.value) } : null)}
              onMouseUp={e => save({ reply_delay_seconds: parseInt((e.target as HTMLInputElement).value) })}
              className="w-full accent-[#00a884]"
            />
            <div className="flex justify-between text-[#8696a0] text-xs mt-1"><span>Instant</span><span>10s</span></div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-[#e9edef] text-sm font-medium">Voice messages</div>
              <div className="text-[#8696a0] text-xs">Send ElevenLabs audio replies</div>
            </div>
            <button onClick={() => save({ voice_enabled: !business.voice_enabled })} className={`w-10 h-5 rounded-full relative transition-all ${business.voice_enabled ? 'bg-[#00a884]' : 'bg-[#374045]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${business.voice_enabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Smart Team Handoff */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[#e9edef] font-medium">Smart Team Handoff</h2>
            <p className="text-[#8696a0] text-xs mt-0.5">AI detects when a human is needed and shares your contact number with the customer</p>
          </div>
          <button
            onClick={() => save({ handoff_enabled: !business.handoff_enabled })}
            className={`w-10 h-5 rounded-full relative transition-all flex-shrink-0 mt-1 ${business.handoff_enabled ? 'bg-[#00a884]' : 'bg-[#374045]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${business.handoff_enabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        {business.handoff_enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">
                Staff WhatsApp number
                <span className="text-[#8696a0] font-normal ml-1.5">— customers are directed here when they need a human</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={business.handoff_whatsapp_number || ''}
                  onChange={e => setBusiness(prev => prev ? { ...prev, handoff_whatsapp_number: e.target.value } : null)}
                  placeholder="e.g. 233244123456"
                  className="flex-1 bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-2.5 text-[#e9edef] placeholder-[#8696a0] text-sm font-mono outline-none focus:border-[#00a884]/50"
                />
                <button
                  onClick={() => save({ handoff_whatsapp_number: business.handoff_whatsapp_number })}
                  className="px-4 py-2.5 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-xl transition-all"
                >
                  Save
                </button>
              </div>
              <p className="text-[#8696a0] text-xs mt-1.5">International format without + (Ghana example: 233244123456)</p>
            </div>
            {business.handoff_whatsapp_number && (
              <div className="flex items-center gap-2 bg-[#00a884]/8 border border-[#00a884]/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-[#00a884] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-[#00a884] text-xs">AI will share <span className="font-mono font-semibold">wa.me/{business.handoff_whatsapp_number}</span> when handing off to your team</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Subscription */}
      <section className="bg-[#111b21] border border-[#374045] rounded-2xl p-6">
        <h2 className="text-[#e9edef] font-medium mb-4">Subscription & Billing</h2>
        <div className="flex items-center justify-between py-3 border-b border-[#374045]">
          <div>
            <div className="text-[#e9edef] font-medium capitalize">{business.plan} plan</div>
            <div className="text-[#8696a0] text-sm">Current active plan</div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${business.plan === 'trial' ? 'bg-[#374045] text-[#8696a0]' : business.plan === 'growth' ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-blue-500/20 text-blue-400'}`}>
            {business.plan}
          </span>
        </div>
        <div className="pt-4 flex gap-3">
          <button onClick={() => router.push('/dashboard/settings#upgrade')} className="flex-1 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm py-2.5 rounded-xl transition-all">Upgrade plan</button>
          <a href="https://dashboard.paystack.com" target="_blank" rel="noopener noreferrer" className="text-[#8696a0] text-sm hover:text-white py-2.5 px-4 border border-[#374045] rounded-xl transition-colors flex items-center">View invoices</a>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-[#111b21] border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-red-400 font-medium mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button
            onClick={async () => {
              if (!business || !confirm('Delete ALL conversation history? This cannot be undone.')) return
              await supabase.from('messages').delete().eq('business_id', business.id)
              await supabase.from('conversations').delete().eq('business_id', business.id)
              setSaved(true); setTimeout(() => setSaved(false), 2000)
            }}
            className="w-full text-left px-4 py-3 border border-[#374045] hover:border-red-500/30 rounded-xl text-sm text-[#8696a0] hover:text-red-400 transition-colors"
          >
            Delete all conversation history
          </button>
          <button
            onClick={async () => {
              if (!business || !confirm('Reset ALL AI training data (docs & FAQs)? This cannot be undone.')) return
              await supabase.from('training_docs').delete().eq('business_id', business.id)
              await supabase.from('faqs').delete().eq('business_id', business.id)
              setSaved(true); setTimeout(() => setSaved(false), 2000)
            }}
            className="w-full text-left px-4 py-3 border border-[#374045] hover:border-red-500/30 rounded-xl text-sm text-[#8696a0] hover:text-red-400 transition-colors"
          >
            Reset AI training data
          </button>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="w-full text-left px-4 py-3 border border-red-500/20 hover:border-red-500/50 rounded-xl text-sm text-red-400 transition-colors">
              Delete account
            </button>
          ) : (
            <div className="border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-red-400 text-sm font-medium">Are you absolutely sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 border border-[#374045] text-[#8696a0] text-sm rounded-lg">Cancel</button>
                <button className="flex-1 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/30">Confirm delete</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
