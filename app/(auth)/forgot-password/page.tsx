'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
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
          <h1 className="text-2xl font-semibold text-white">Reset password</h1>
          <p className="text-[#8696a0] text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#00a884]/15 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[#e9edef] font-medium">Check your inbox</p>
              <p className="text-[#8696a0] text-sm">We've sent a password reset link to <span className="text-[#00a884]">{email}</span></p>
              <Link href="/login" className="block w-full text-center bg-[#00a884] hover:bg-[#00c49a] text-white font-medium py-3 rounded-xl transition-all mt-4">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#e9edef] text-sm font-medium mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@business.com"
                  className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <Link href="/login" className="block text-center text-[#8696a0] text-sm hover:text-[#e9edef] transition-colors mt-2">
                ← Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
