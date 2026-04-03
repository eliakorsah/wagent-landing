'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  {
    id: 'audio_replies',
    emoji: '🎙️',
    title: 'Voice Message Replies',
    description: 'AI automatically sends voice notes back to customers using a natural-sounding voice — no typing, just talking.',
    status: 'in_progress' as const,
  },
  {
    id: 'ai_call_handling',
    emoji: '📞',
    title: 'AI Call Accepting',
    description: 'WAgenT picks up incoming WhatsApp calls, speaks to the customer, and logs the conversation.',
    status: 'planned' as const,
  },
  {
    id: 'multi_language',
    emoji: '🌍',
    title: 'Multi-language Replies',
    description: 'AI detects and replies in the customer\'s language — Twi, Hausa, French, Pidgin, and more.',
    status: 'planned' as const,
  },
  {
    id: 'instagram_dm',
    emoji: '📸',
    title: 'Instagram DM Automation',
    description: 'Same AI agent handles your Instagram Direct Messages — one dashboard for all channels.',
    status: 'planned' as const,
  },
  {
    id: 'payment_link',
    emoji: '💳',
    title: 'Send Payment Links in Chat',
    description: 'AI detects purchase intent and automatically sends a Paystack/MoMo payment link in the chat.',
    status: 'planned' as const,
  },
  {
    id: 'ai_catalog',
    emoji: '🛍️',
    title: 'Product Catalogue Browser',
    description: 'AI sends your WhatsApp product catalogue when customers ask about items — no manual intervention.',
    status: 'planned' as const,
  },
  {
    id: 'team_handoff',
    emoji: '👤',
    title: 'Smart Team Handoff',
    description: 'AI detects when a human is needed and routes to the right staff member automatically.',
    status: 'planned' as const,
  },
  {
    id: 'broadcast',
    emoji: '📣',
    title: 'AI-Powered Broadcasts',
    description: 'Send personalised bulk messages to your customer list — AI customises each one.',
    status: 'planned' as const,
  },
]

const statusLabels = {
  in_progress: { label: 'In Progress', color: 'bg-[#00a884]/15 text-[#00a884] border-[#00a884]/25' },
  planned: { label: 'Planned', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  released: { label: 'Released', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

export default function VotePage() {
  const supabase = createClient()
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)

      // Load all vote counts
      const { data: allVotes } = await supabase.from('feature_votes').select('feature_id')
      const counts: Record<string, number> = {}
      allVotes?.forEach(v => { counts[v.feature_id] = (counts[v.feature_id] || 0) + 1 })
      setVotes(counts)

      // Load my votes
      const { data: mine } = await supabase.from('feature_votes').select('feature_id').eq('business_id', biz.id)
      setMyVotes(new Set(mine?.map(v => v.feature_id) || []))
      setLoading(false)
    }
    init()
  }, [])

  const toggleVote = async (featureId: string) => {
    if (!businessId || voting) return
    setVoting(featureId)
    const hasVoted = myVotes.has(featureId)

    if (hasVoted) {
      await supabase.from('feature_votes').delete().eq('business_id', businessId).eq('feature_id', featureId)
      setMyVotes(prev => { const n = new Set(prev); n.delete(featureId); return n })
      setVotes(prev => ({ ...prev, [featureId]: Math.max((prev[featureId] || 1) - 1, 0) }))
    } else {
      await supabase.from('feature_votes').insert({ business_id: businessId, feature_id: featureId })
      setMyVotes(prev => new Set([...prev, featureId]))
      setVotes(prev => ({ ...prev, [featureId]: (prev[featureId] || 0) + 1 }))
    }
    setVoting(null)
  }

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)
  const sortedFeatures = [...FEATURES].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#e9edef]">Feature Requests</h1>
        <p className="text-[#8696a0] text-sm mt-1">Vote for the features you need most. We build what businesses want.</p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-[#111b21] border border-[#374045] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold font-mono text-white">{totalVotes}</span>
          <span className="text-[#8696a0] text-xs">total votes cast</span>
        </div>
        <div className="bg-[#111b21] border border-[#374045] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold font-mono text-[#00a884]">{myVotes.size}</span>
          <span className="text-[#8696a0] text-xs">your votes</span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="space-y-3">
        {(loading ? FEATURES : sortedFeatures).map((feature, idx) => {
          const count = votes[feature.id] || 0
          const voted = myVotes.has(feature.id)
          const maxVotes = Math.max(...Object.values(votes), 1)
          const pct = Math.round((count / maxVotes) * 100)
          const st = statusLabels[feature.status]

          return (
            <div
              key={feature.id}
              className={`bg-[#111b21] border rounded-2xl p-5 transition-all ${voted ? 'border-[#00a884]/40' : 'border-[#374045] hover:border-[#374045]'}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0 mt-0.5">{feature.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-[#e9edef] font-semibold text-sm">{feature.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    {idx === 0 && !loading && count > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">🔥 Most wanted</span>
                    )}
                  </div>
                  <p className="text-[#8696a0] text-xs leading-relaxed mb-3">{feature.description}</p>

                  {/* Vote bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#1f2c34] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00a884] rounded-full transition-all duration-500"
                        style={{ width: loading ? '0%' : `${pct}%` }}
                      />
                    </div>
                    <span className="text-[#8696a0] text-xs font-mono w-12 text-right">{loading ? '…' : `${count} vote${count !== 1 ? 's' : ''}`}</span>
                  </div>
                </div>

                {/* Vote button */}
                <button
                  onClick={() => toggleVote(feature.id)}
                  disabled={loading || voting === feature.id}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 w-14 h-14 rounded-xl border transition-all ${
                    voted
                      ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884]'
                      : 'bg-[#1f2c34] border-[#374045] text-[#8696a0] hover:border-[#00a884]/40 hover:text-[#00a884]'
                  } disabled:opacity-50`}
                >
                  <svg className="w-5 h-5 mt-2" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs font-mono font-bold">{count}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[#374045] text-xs text-center">Your votes are anonymous to other businesses. LYTRIX CONSULT reviews these monthly.</p>
    </div>
  )
}
