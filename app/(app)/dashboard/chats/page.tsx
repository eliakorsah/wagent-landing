'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string; customer_phone: string; customer_name?: string
  status: string; last_message?: string; last_message_at?: string; unread_count: number
}
interface Message {
  id: string; from_role: string; message_type: string
  content?: string; audio_url?: string; created_at: string; status: string
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  ai_active: { label: 'AI Active', dot: 'bg-[#00a884]', badge: 'bg-[#00a884]/15 text-[#00a884]' },
  manual: { label: 'Manual', dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-400' },
  resolved: { label: 'Resolved', dot: 'bg-[#374045]', badge: 'bg-[#374045] text-[#8696a0]' },
  needs_human: { label: 'Needs Human', dot: 'bg-red-400', badge: 'bg-red-500/15 text-red-400' },
}

const filters = ['All', 'AI Active', 'Manual', 'Resolved', 'Needs Human']

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatListTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diff < 604800000) return d.toLocaleDateString('en-GH', { weekday: 'short' })
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = []
  let currentLabel = ''
  for (const msg of messages) {
    const d = new Date(msg.created_at)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    let label = ''
    if (diff < 86400000) label = 'Today'
    else if (diff < 172800000) label = 'Yesterday'
    else label = d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })

    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] })
      currentLabel = label
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  }
  return groups
}

export default function ChatsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [convs, setConvs] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)
      const { data } = await supabase.from('conversations').select('*').eq('business_id', biz.id).order('last_message_at', { ascending: false }).limit(50)
      setConvs(data || [])

      const idParam = searchParams.get('id')
      if (idParam && data) {
        const c = data.find(x => x.id === idParam)
        if (c) loadConversation(c)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!businessId) return
    const channel = supabase.channel('chats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `business_id=eq.${businessId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` }, (payload) => {
        const newData = payload.new as Conversation
        setConvs(prev => {
          const updated = prev.map(c => c.id === newData.id ? { ...c, ...newData } : c)
          return updated.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId])

  const loadConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at').limit(100)
    setMessages(data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50)
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeConv || !businessId) return
    setSending(true)
    const res = await fetch(`/api/conversations/${activeConv.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply }),
    })
    if (res.ok) setReply('')
    setSending(false)
  }

  const updateStatus = async (status: string) => {
    if (!activeConv || !businessId) return
    await supabase.from('conversations').update({ status }).eq('id', activeConv.id)
    setActiveConv(prev => prev ? { ...prev, status } : null)
    setConvs(prev => prev.map(c => c.id === activeConv.id ? { ...c, status } : c))
  }

  const filteredConvs = convs.filter(c => {
    const matchesFilter = filter === 'All'
      || (filter === 'AI Active' && c.status === 'ai_active')
      || (filter === 'Manual' && c.status === 'manual')
      || (filter === 'Resolved' && c.status === 'resolved')
      || (filter === 'Needs Human' && c.status === 'needs_human')
    const matchesSearch = !search || (c.customer_name || c.customer_phone).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const messageGroups = groupMessagesByDate(messages)

  const initials = (conv: Conversation) =>
    (conv.customer_name || conv.customer_phone).charAt(0).toUpperCase()

  return (
    <div className="flex h-full" style={{ background: '#0b141a' }}>
      {/* ── Conversation list (WhatsApp left panel) ── */}
      <div className={`w-full md:w-[340px] flex-shrink-0 flex flex-col border-r border-[#374045] ${activeConv ? 'hidden md:flex' : 'flex'}`} style={{ background: '#111b21' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#374045]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#374045] flex items-center justify-center text-[#8696a0] text-xs font-bold">
              {businessId ? 'B' : '?'}
            </div>
            <span className="text-[#e9edef] font-semibold text-sm">Live Chats</span>
          </div>
          <div className="flex gap-3 text-[#8696a0]">
            <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#374045]">
          <div className="flex items-center gap-2 bg-[#1f2c34] rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-[#8696a0] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none flex-1"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-[#374045] overflow-x-auto scrollbar-none">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium ${
                filter === f
                  ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                  : 'text-[#8696a0] hover:text-[#e9edef] border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map(conv => {
            const cfg = statusConfig[conv.status] || statusConfig.ai_active
            const isActive = activeConv?.id === conv.id
            return (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#374045]/40 text-left transition-colors ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#1f2c34]'}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#374045] to-[#2a3942] flex items-center justify-center text-base font-semibold text-[#e9edef]">
                    {initials(conv)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${cfg.dot}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-[#e9edef] text-sm font-medium truncate">{conv.customer_name || conv.customer_phone}</span>
                    <span className="text-[#8696a0] text-[10px] flex-shrink-0">{conv.last_message_at ? formatListTime(conv.last_message_at) : ''}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[#8696a0] text-xs truncate">{conv.last_message || 'No messages yet'}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-[#00a884] text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {filteredConvs.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-[#1f2c34] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#374045]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
              <p className="text-[#8696a0] text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Active conversation (WhatsApp right panel) ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1f2c34] border-b border-[#374045] flex-shrink-0">
            <button
              onClick={() => setActiveConv(null)}
              className="md:hidden text-[#8696a0] hover:text-white mr-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#374045] to-[#2a3942] flex items-center justify-center text-sm font-semibold text-[#e9edef]">
                {initials(activeConv)}
              </div>
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1f2c34] ${statusConfig[activeConv.status]?.dot}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[#e9edef] font-semibold text-sm leading-none">
                {activeConv.customer_name || activeConv.customer_phone}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig[activeConv.status]?.badge}`}>
                  {statusConfig[activeConv.status]?.label}
                </span>
                <span className="text-[#8696a0] text-[10px]">{activeConv.customer_phone}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {activeConv.status !== 'manual' ? (
                <button
                  onClick={() => updateStatus('manual')}
                  className="text-xs px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/25 transition-colors"
                >
                  Take over
                </button>
              ) : (
                <button
                  onClick={() => updateStatus('ai_active')}
                  className="text-xs px-3 py-1.5 bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20 rounded-full hover:bg-[#00a884]/25 transition-colors"
                >
                  Hand to AI
                </button>
              )}
              <button
                onClick={() => updateStatus('resolved')}
                className="text-xs px-3 py-1.5 bg-[#1f2c34] text-[#8696a0] border border-[#374045] rounded-full hover:bg-[#2a3942] transition-colors"
              >
                Resolve
              </button>
              <button className="text-[#8696a0] hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <button className="text-[#8696a0] hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          </div>

          {/* AI status banner */}
          {activeConv.status === 'ai_active' && (
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#00a884]/8 border-b border-[#00a884]/15 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
              <span className="text-[#00a884] text-xs">AI agent is handling this conversation</span>
            </div>
          )}
          {activeConv.status === 'manual' && (
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-500/8 border-b border-blue-500/15 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-blue-400 text-xs">You are managing this conversation manually</span>
            </div>
          )}

          {/* Messages — WA wallpaper background */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-1"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.018'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a',
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="bg-[#182229] text-[#8696a0] text-xs px-4 py-2 rounded-full">
                  No messages yet — waiting for customer to write
                </div>
              </div>
            )}

            {messageGroups.map(group => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="flex justify-center my-3">
                  <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-full shadow-sm">
                    {group.label}
                  </span>
                </div>

                {group.messages.map(msg => {
                  const isOut = msg.from_role === 'ai' || msg.from_role === 'staff'
                  return (
                    <div key={msg.id} className={`flex mb-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`relative max-w-[72%] md:max-w-sm lg:max-w-md px-3 py-2 text-sm leading-relaxed shadow-md ${
                          isOut
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-[10px_2px_10px_10px]'
                            : 'bg-[#1f2c34] text-[#e9edef] rounded-[2px_10px_10px_10px]'
                        }`}
                        style={{ animation: 'waMsg 0.15s ease-out both' }}
                      >
                        {/* Sender label for AI/Staff */}
                        {isOut && (
                          <div className="text-[10px] text-[#00a884] mb-0.5 font-medium">
                            {msg.from_role === 'ai' ? '🤖 AI Agent' : '👤 Staff'}
                          </div>
                        )}

                        {msg.message_type === 'audio' ? (
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                            </div>
                            <div className="flex-1">
                              {/* Waveform placeholder */}
                              <div className="flex items-end gap-0.5 h-6">
                                {Array.from({ length: 18 }).map((_, i) => (
                                  <div key={i} className="w-0.5 bg-[#8696a0] rounded-full" style={{ height: `${20 + Math.sin(i * 0.8) * 12}%` }} />
                                ))}
                              </div>
                              {msg.audio_url && <audio src={msg.audio_url} controls className="hidden" />}
                            </div>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}

                        {/* Timestamp + tick */}
                        <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-[#8696a0]">{formatTime(msg.created_at)}</span>
                          {isOut && (
                            <svg className="w-3.5 h-3.5 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input — WA style, only in manual mode */}
          <div className="flex-shrink-0 border-t border-[#374045] bg-[#1f2c34]">
            {activeConv.status === 'manual' ? (
              <form onSubmit={sendReply} className="flex items-center gap-2 px-3 py-2">
                {/* Emoji */}
                <button type="button" className="text-[#8696a0] hover:text-white transition-colors flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                </button>
                {/* Attach */}
                <button type="button" className="text-[#8696a0] hover:text-white transition-colors flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
                </button>

                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-full px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#00a884]/30"
                />

                {reply.trim() ? (
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-11 h-11 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 rounded-full flex items-center justify-center transition-all flex-shrink-0 hover:shadow-[0_0_16px_rgba(0,168,132,0.4)]"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                  </button>
                ) : (
                  <button type="button" className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                  </button>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                <span className="text-[#8696a0] text-sm">
                  {activeConv.status === 'resolved'
                    ? 'Conversation resolved — '
                    : 'AI is handling replies — '}
                  <button onClick={() => updateStatus('manual')} className="text-[#00a884] hover:underline">
                    {activeConv.status === 'resolved' ? 'reopen' : 'take over'}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="hidden md:flex flex-1 items-center justify-center" style={{ background: '#0b141a' }}>
          <div className="text-center">
            <div className="w-20 h-20 bg-[#1f2c34] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#374045]">
              <svg className="w-10 h-10 text-[#374045]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
            </div>
            <p className="text-[#e9edef] font-medium text-base mb-1">WAgenT Live Chats</p>
            <p className="text-[#8696a0] text-sm">Select a conversation to view messages</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes waMsg {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
