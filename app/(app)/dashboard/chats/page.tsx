'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string; customer_phone: string; customer_name?: string
  status: string; last_message?: string; last_message_at?: string; unread_count: number
}
interface Message {
  id: string; conversation_id: string; from_role: string; message_type: string
  content?: string; audio_url?: string; created_at: string; status: string
}

const filters = ['All', 'Unread', 'AI Active', 'Manual', 'Resolved']

// Deterministic avatar color from name/phone
const avatarColors = [
  '#00a884', '#53bdeb', '#7c8c95', '#e06c75', '#e5c07b',
  '#61afef', '#c678dd', '#56b6c2', '#d19a66', '#98c379',
]
function getAvatarColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatListTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true })
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
  const [menuOpen, setMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConvRef = useRef<string | null>(null)

  useEffect(() => { activeConvRef.current = activeConv?.id || null }, [activeConv])

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

  // Realtime
  useEffect(() => {
    if (!businessId) return
    const channel = supabase.channel('chats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `business_id=eq.${businessId}` }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.conversation_id === activeConvRef.current) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` }, (payload) => {
        const newData = payload.new as Conversation
        setConvs(prev => {
          const exists = prev.some(c => c.id === newData.id)
          const updated = exists
            ? prev.map(c => c.id === newData.id ? { ...c, ...newData } : c)
            : [newData, ...prev]
          return updated.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        })
        if (newData.id === activeConvRef.current) {
          setActiveConv(prev => prev ? { ...prev, ...newData } : null)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId])

  // Polling fallback
  useEffect(() => {
    if (!businessId) return
    const pollConvs = setInterval(async () => {
      const { data } = await supabase.from('conversations').select('*').eq('business_id', businessId).order('last_message_at', { ascending: false }).limit(50)
      if (data) {
        setConvs(data)
        const active = activeConvRef.current
        if (active) {
          const updated = data.find(c => c.id === active)
          if (updated) setActiveConv(prev => prev ? { ...prev, ...updated } : null)
        }
      }
    }, 3000)
    const pollMsgs = setInterval(async () => {
      const convId = activeConvRef.current
      if (!convId) return
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at').limit(100)
      if (data) {
        setMessages(prev => {
          if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) return prev
          if (data.length > prev.length) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
          return data
        })
      }
    }, 2000)
    return () => { clearInterval(pollConvs); clearInterval(pollMsgs) }
  }, [businessId])

  const loadConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setMenuOpen(false)
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at').limit(100)
    setMessages(data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50)
    if (conv.unread_count > 0) {
      await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
    }
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
    setMenuOpen(false)
  }

  const filteredConvs = convs.filter(c => {
    const matchesFilter = filter === 'All'
      || (filter === 'Unread' && c.unread_count > 0)
      || (filter === 'AI Active' && c.status === 'ai_active')
      || (filter === 'Manual' && c.status === 'manual')
      || (filter === 'Resolved' && c.status === 'resolved')
    const matchesSearch = !search || (c.customer_name || c.customer_phone).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const messageGroups = groupMessagesByDate(messages)

  const displayName = (conv: Conversation) =>
    conv.customer_name || `+${conv.customer_phone.replace(/^(\d{3})(\d{2,3})(\d{3})(\d{3,4})$/, '$1 $2 $3 $4')}`

  const initials = (conv: Conversation) => {
    if (conv.customer_name) {
      const parts = conv.customer_name.trim().split(' ')
      return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase()
    }
    return conv.customer_phone.slice(-2)
  }

  // SVG icon components
  const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  )
  const MenuDotsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
  )
  const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
  )
  const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  )
  const MicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
  )
  const EmojiIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
  )
  const AttachIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
  )
  const TickIcon = () => (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.127a.46.46 0 0 0-.36-.153.457.457 0 0 0-.34.178.46.46 0 0 0-.102.356.46.46 0 0 0 .178.305l2.4 2.4a.46.46 0 0 0 .356.102.46.46 0 0 0 .305-.178l6.508-8.051a.46.46 0 0 0 .102-.356.46.46 0 0 0-.16-.188h-.001zm3.45 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.272-.463.554 1.663 1.663a.46.46 0 0 0 .356.102.46.46 0 0 0 .305-.178l6.508-8.051a.46.46 0 0 0 .102-.356.46.46 0 0 0-.16-.188h-.001z"/></svg>
  )

  return (
    <div className="flex h-full" style={{ background: '#0b141a' }}>
      {/* ── LEFT PANEL ── */}
      <div className={`w-full md:w-[420px] flex-shrink-0 flex flex-col border-r border-[#2a3942] ${activeConv ? 'hidden md:flex' : 'flex'}`} style={{ background: '#111b21' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[60px] flex-shrink-0" style={{ background: '#202c33' }}>
          <span className="text-[#e9edef] font-bold text-lg tracking-tight">WhatsApp</span>
          <div className="flex items-center gap-4 text-[#aebac1]">
            <button className="hover:text-[#e9edef] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
            </button>
            <button className="hover:text-[#e9edef] transition-colors">
              <MenuDotsIcon />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-2.5 py-1.5" style={{ background: '#111b21' }}>
          <div className="flex items-center bg-[#202c33] rounded-lg px-3 h-[35px]">
            <span className="text-[#8696a0] mr-6"><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or start a new chat"
              className="bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none flex-1"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-[#00a884] text-[#111b21] font-medium'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map(conv => {
            const isActive = activeConv?.id === conv.id
            const color = getAvatarColor(conv.customer_name || conv.customer_phone)
            return (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}
              >
                {/* Avatar */}
                <div
                  className="w-[49px] h-[49px] rounded-full flex items-center justify-center text-white text-base font-medium flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initials(conv)}
                </div>

                <div className="flex-1 min-w-0 border-b border-[#222d34] pb-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#e9edef] text-[16px] truncate">{displayName(conv)}</span>
                    <span className={`text-[12px] flex-shrink-0 ${conv.unread_count > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
                      {conv.last_message_at ? formatListTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[#8696a0] text-[13.5px] truncate flex items-center gap-1">
                      {conv.status === 'ai_active' && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00a884] flex-shrink-0" />
                      )}
                      {conv.last_message || 'No messages yet'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="min-w-[20px] h-[20px] bg-[#00a884] text-[#111b21] text-[11px] rounded-full flex items-center justify-center flex-shrink-0 font-bold px-1">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {filteredConvs.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[#8696a0] text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — CHAT ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 h-[60px] flex-shrink-0" style={{ background: '#202c33' }}>
            <button
              onClick={() => setActiveConv(null)}
              className="md:hidden text-[#aebac1] hover:text-[#e9edef] mr-1 transition-colors"
            >
              <BackIcon />
            </button>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(activeConv.customer_name || activeConv.customer_phone) }}
            >
              {initials(activeConv)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[#e9edef] text-[16px] leading-tight truncate">{displayName(activeConv)}</div>
              <div className="text-[#8696a0] text-[13px] leading-tight">
                {activeConv.status === 'ai_active' ? 'AI handling' : activeConv.status === 'manual' ? 'Manual mode' : activeConv.status === 'resolved' ? 'Resolved' : 'Active'}
              </div>
            </div>

            {/* Header icons */}
            <div className="flex items-center gap-5 text-[#aebac1] relative">
              <button className="hover:text-[#e9edef] transition-colors"><SearchIcon /></button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="hover:text-[#e9edef] transition-colors"
              >
                <MenuDotsIcon />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 py-2 rounded-md shadow-xl min-w-[200px]" style={{ background: '#233138' }}>
                    {activeConv.status !== 'manual' ? (
                      <button onClick={() => updateStatus('manual')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-sm hover:bg-[#182229] transition-colors">
                        Take over chat
                      </button>
                    ) : (
                      <button onClick={() => updateStatus('ai_active')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-sm hover:bg-[#182229] transition-colors">
                        Hand back to AI
                      </button>
                    )}
                    {activeConv.status !== 'resolved' && (
                      <button onClick={() => updateStatus('resolved')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-sm hover:bg-[#182229] transition-colors">
                        Resolve conversation
                      </button>
                    )}
                    {activeConv.status === 'resolved' && (
                      <button onClick={() => updateStatus('ai_active')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-sm hover:bg-[#182229] transition-colors">
                        Reopen conversation
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-[6%] py-3"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='412' height='412' viewBox='0 0 412 412' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Crect x='30' y='30' width='4' height='4' rx='1'/%3E%3Crect x='100' y='60' width='4' height='4' rx='1'/%3E%3Crect x='200' y='20' width='4' height='4' rx='1'/%3E%3Crect x='300' y='80' width='4' height='4' rx='1'/%3E%3Crect x='50' y='150' width='4' height='4' rx='1'/%3E%3Crect x='150' y='130' width='4' height='4' rx='1'/%3E%3Crect x='250' y='170' width='4' height='4' rx='1'/%3E%3Crect x='350' y='140' width='4' height='4' rx='1'/%3E%3Crect x='80' y='250' width='4' height='4' rx='1'/%3E%3Crect x='180' y='230' width='4' height='4' rx='1'/%3E%3Crect x='280' y='270' width='4' height='4' rx='1'/%3E%3Crect x='380' y='240' width='4' height='4' rx='1'/%3E%3Crect x='40' y='350' width='4' height='4' rx='1'/%3E%3Crect x='140' y='330' width='4' height='4' rx='1'/%3E%3Crect x='240' y='370' width='4' height='4' rx='1'/%3E%3Crect x='340' y='340' width='4' height='4' rx='1'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a',
            }}
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <span className="bg-[#182229] text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
                  Messages are end-to-end encrypted. No one outside of this chat can read them.
                </span>
              </div>
            )}

            {messageGroups.map(group => (
              <div key={group.label}>
                <div className="flex justify-center my-3">
                  <span className="bg-[#182229] text-[#8696a0] text-[12.5px] px-3 py-1 rounded-lg shadow-sm uppercase tracking-wide" style={{ fontSize: '12px' }}>
                    {group.label}
                  </span>
                </div>

                {group.messages.map(msg => {
                  const isOut = msg.from_role === 'ai' || msg.from_role === 'staff'
                  return (
                    <div key={msg.id} className={`flex mb-[2px] ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`relative max-w-[65%] px-2.5 py-1.5 text-[14.2px] leading-[19px] shadow-sm ${
                          isOut
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-[7.5px] rounded-tr-none'
                            : 'bg-[#202c33] text-[#e9edef] rounded-[7.5px] rounded-tl-none'
                        }`}
                      >
                        {/* Sender label */}
                        {isOut && msg.from_role === 'staff' && (
                          <div className="text-[12px] text-[#53bdeb] font-medium mb-0.5">You</div>
                        )}
                        {isOut && msg.from_role === 'ai' && (
                          <div className="text-[12px] text-[#00a884] font-medium mb-0.5">AI Agent</div>
                        )}

                        {msg.message_type === 'audio' ? (
                          <div className="min-w-[240px]">
                            {msg.audio_url && (
                              <audio src={msg.audio_url} controls className="w-full h-[32px]" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.85)' }} />
                            )}
                            {msg.content && msg.content !== '[Voice message received]' && (
                              <p className="text-[12px] text-[#8696a0] mt-1 italic leading-tight">&quot;{msg.content}&quot;</p>
                            )}
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}

                        {/* Time + ticks inline */}
                        <span className="float-right ml-2 mt-1 flex items-center gap-0.5">
                          <span className="text-[11px] text-[#ffffff99] leading-none">{formatTime(msg.created_at)}</span>
                          {isOut && (
                            <span className="text-[#53bdeb] ml-0.5"><TickIcon /></span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom bar */}
          <div className="flex-shrink-0 h-[62px] flex items-center gap-2 px-4" style={{ background: '#202c33' }}>
            {activeConv.status === 'manual' ? (
              <>
                <button type="button" className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0">
                  <EmojiIcon />
                </button>
                <button type="button" className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0">
                  <AttachIcon />
                </button>
                <form onSubmit={sendReply} className="flex-1 flex items-center gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-lg px-3 py-2.5 text-[15px] outline-none"
                  />
                  <button
                    type={reply.trim() ? 'submit' : 'button'}
                    disabled={sending}
                    className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    {reply.trim() ? <SendIcon /> : <MicIcon />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2">
                {activeConv.status === 'ai_active' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                )}
                <span className="text-[#8696a0] text-sm">
                  {activeConv.status === 'resolved'
                    ? 'Conversation resolved'
                    : 'AI is handling replies'}
                  {' \u2014 '}
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
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-6" style={{ background: '#222e35' }}>
          <div className="w-[320px] text-center">
            <div className="w-[250px] h-[250px] mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: '#364147' }}>
              <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="0.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <h2 className="text-[#e9edef] text-[28px] font-light mb-3">WAgenT for Business</h2>
            <p className="text-[#8696a0] text-sm leading-5">
              Send and receive messages from your customers. AI handles replies automatically, or take over any conversation manually.
            </p>
          </div>
          <div className="w-[320px] border-t border-[#374045] pt-4 text-center">
            <p className="text-[#8696a0] text-[13px]">Your personal messages are end-to-end encrypted</p>
          </div>
        </div>
      )}
    </div>
  )
}
