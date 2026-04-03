'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({ businessName: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = (pwd: string) => {
    if (!pwd) return 0
    if (pwd.length < 6) return 1
    if (pwd.length < 10) return 2
    return 3
  }
  const s = strength(formData.password)
  const strengthColors = ['', '#ef4444', '#f59e0b', '#00a884']
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { business_name: formData.businessName, phone: formData.phone } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('businesses').insert({ user_id: data.user.id, name: formData.businessName })
      router.push('/onboarding')
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="#00a884" opacity="0.15" />
              <path d="M16 4L10 24H13.5L16 17L18.5 24H22L16 4Z" fill="#00a884" />
            </svg>
            <span className="text-white font-semibold text-xl">WAgenT</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Start your free trial</h1>
          <p className="text-[#8696a0] text-sm mt-1">14 days free. No credit card required.</p>
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-8">
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-3 border border-[#374045] rounded-xl text-white text-sm font-medium hover:bg-[#1f2c34] transition-colors mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#374045]" />
            <span className="text-[#8696a0] text-xs">or</span>
            <div className="flex-1 h-px bg-[#374045]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">Business name</label>
              <input type="text" value={formData.businessName} onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))} required placeholder="Accra Electronics Hub" className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors" />
            </div>
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required placeholder="you@business.com" className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors" />
            </div>
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={6} placeholder="••••••••" className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors" />
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(l => <div key={l} className="h-1 flex-1 rounded-full transition-colors" style={{ background: s >= l ? strengthColors[s] : '#374045' }} />)}
                  </div>
                  <span className="text-xs" style={{ color: strengthColors[s] }}>{strengthLabels[s]}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">Phone <span className="text-[#8696a0]">(optional)</span></label>
              <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+233 XX XXX XXXX" className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors" />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]">
              {loading ? 'Creating account...' : 'Start free trial'}
            </button>
          </form>

          <p className="text-center text-[#8696a0] text-xs mt-6">
            By signing up you agree to our <a href="#" className="text-[#00a884] hover:underline">Terms</a> and <a href="#" className="text-[#00a884] hover:underline">Privacy Policy</a>
          </p>
          <p className="text-center text-[#8696a0] text-sm mt-3">
            Already have an account? <Link href="/login" className="text-[#00a884] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
