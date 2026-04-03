'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z" fill="#00a884" opacity="0.15" />
              <path d="M16 4L10 24H13.5L16 17L18.5 24H22L16 4Z" fill="#00a884" />
            </svg>
            <span className="text-white font-semibold text-xl">WAgenT</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-[#8696a0] text-sm mt-1">Sign in to your dashboard</p>
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-8">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 border border-[#374045] rounded-xl text-white text-sm font-medium hover:bg-[#1f2c34] transition-colors mb-6"
          >
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#e9edef] text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@business.com"
                className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50 focus:ring-1 focus:ring-[#00a884]/20 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#e9edef] text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-[#00a884] text-xs hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
              className="w-full bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#8696a0] text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#00a884] hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
