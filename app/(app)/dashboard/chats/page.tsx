'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
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

const avatarColors = ['#00a884','#53bdeb','#7c8c95','#e06c75','#e5c07b','#61afef','#c678dd','#56b6c2','#d19a66','#98c379']
function getAvatarColor(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return avatarColors[Math.abs(h) % avatarColors.length]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function formatListTime(iso: string) {
  const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime()
  if (diff < 86400000) return formatTime(iso)
  if (diff < 604800000) return d.toLocaleDateString('en-GH', { weekday: 'short' })
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })
}
function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = []
  let cur = ''
  for (const msg of messages) {
    const d = new Date(msg.created_at), diff = Date.now() - d.getTime()
    const label = diff < 86400000 ? 'TODAY' : diff < 172800000 ? 'YESTERDAY' : d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
    if (label !== cur) { groups.push({ label, messages: [msg] }); cur = label }
    else groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

// WhatsApp doodle background SVG pattern
const WA_DOODLE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' transform='scale(0.5)'%3E%3Cpath d='M30 20h4v2h-4z'/%3E%3Ccircle cx='80' cy='25' r='3'/%3E%3Cpath d='M140 15l3 5h-6z'/%3E%3Crect x='200' y='18' width='5' height='5' rx='1'/%3E%3Cpath d='M270 20a3 3 0 1 1 0 6 3 3 0 0 1 0-6'/%3E%3Crect x='340' y='22' width='6' height='3' rx='1'/%3E%3Cpath d='M420 18l2 4-4 1z'/%3E%3Crect x='490' y='20' width='4' height='4' rx='2'/%3E%3Ccircle cx='560' cy='24' r='2.5'/%3E%3Cpath d='M25 80h6v1h-6z'/%3E%3Crect x='85' y='75' width='3' height='6' rx='1'/%3E%3Ccircle cx='155' cy='82' r='2'/%3E%3Cpath d='M210 78l4 3-2 4-4-1z'/%3E%3Crect x='280' y='80' width='5' height='2' rx='1'/%3E%3Ccircle cx='350' cy='78' r='3'/%3E%3Cpath d='M415 82h5v2h-5z'/%3E%3Crect x='485' y='76' width='4' height='5' rx='1'/%3E%3Ccircle cx='555' cy='80' r='2'/%3E%3Cpath d='M30 140l3 5h-6z'/%3E%3Crect x='95' y='138' width='6' height='3' rx='1'/%3E%3Ccircle cx='165' cy='142' r='2.5'/%3E%3Cpath d='M225 136h4v4h-4z'/%3E%3Ccircle cx='295' cy='140' r='2'/%3E%3Crect x='360' y='138' width='5' height='4' rx='1'/%3E%3Cpath d='M430 140a2 2 0 1 1 0 4 2 2 0 0 1 0-4'/%3E%3Crect x='500' y='136' width='3' height='6' rx='1'/%3E%3Ccircle cx='565' cy='142' r='3'/%3E%3Crect x='28' y='198' width='5' height='3' rx='1'/%3E%3Ccircle cx='100' cy='202' r='2'/%3E%3Cpath d='M168 196l2 5-4 1z'/%3E%3Crect x='235' y='200' width='4' height='4' rx='2'/%3E%3Ccircle cx='305' cy='198' r='2.5'/%3E%3Cpath d='M370 200h5v2h-5z'/%3E%3Crect x='440' y='196' width='3' height='5' rx='1'/%3E%3Ccircle cx='510' cy='200' r='2'/%3E%3Cpath d='M575 198l3 4h-6z'/%3E%3Crect x='25' y='258' width='6' height='2' rx='1'/%3E%3Ccircle cx='95' cy='262' r='3'/%3E%3Cpath d='M160 256h4v5h-4z'/%3E%3Ccircle cx='230' cy='260' r='2'/%3E%3Crect x='295' y='258' width='5' height='3' rx='1'/%3E%3Cpath d='M365 260a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5'/%3E%3Crect x='435' y='256' width='4' height='4' rx='1'/%3E%3Ccircle cx='505' cy='262' r='2'/%3E%3Cpath d='M570 258l2 4-4 1z'/%3E%3Cpath d='M30 320h3v5h-3z'/%3E%3Ccircle cx='100' cy='322' r='2'/%3E%3Crect x='170' y='318' width='5' height='4' rx='1'/%3E%3Ccircle cx='240' cy='324' r='2.5'/%3E%3Cpath d='M310 320l3 4h-6z'/%3E%3Crect x='375' y='318' width='4' height='5' rx='1'/%3E%3Ccircle cx='445' cy='322' r='2'/%3E%3Crect x='510' y='320' width='5' height='3' rx='1'/%3E%3Ccircle cx='575' cy='324' r='3'/%3E%3Cpath d='M28 380l4 3-2 3-4-1z'/%3E%3Crect x='95' y='378' width='3' height='5' rx='1'/%3E%3Ccircle cx='165' cy='382' r='2'/%3E%3Crect x='235' y='380' width='5' height='3' rx='1'/%3E%3Ccircle cx='305' cy='378' r='2.5'/%3E%3Cpath d='M370 382h4v2h-4z'/%3E%3Crect x='440' y='378' width='4' height='4' rx='2'/%3E%3Ccircle cx='510' cy='382' r='2'/%3E%3Crect x='570' y='380' width='5' height='3' rx='1'/%3E%3Cpath d='M25 440h5v2h-5z'/%3E%3Ccircle cx='95' cy='442' r='2'/%3E%3Crect x='160' y='438' width='4' height='5' rx='1'/%3E%3Ccircle cx='230' cy='444' r='3'/%3E%3Cpath d='M300 440l3 4h-6z'/%3E%3Crect x='368' y='438' width='5' height='4' rx='1'/%3E%3Ccircle cx='435' cy='442' r='2'/%3E%3Crect x='505' y='440' width='4' height='3' rx='1'/%3E%3Ccircle cx='570' cy='444' r='2.5'/%3E%3Cpath d='M30 500h4v3h-4z'/%3E%3Ccircle cx='100' cy='502' r='2.5'/%3E%3Crect x='170' y='498' width='3' height='5' rx='1'/%3E%3Ccircle cx='240' cy='504' r='2'/%3E%3Crect x='305' y='500' width='5' height='3' rx='1'/%3E%3Ccircle cx='375' cy='502' r='3'/%3E%3Cpath d='M440 498l2 5-4 1z'/%3E%3Crect x='510' y='500' width='4' height='4' rx='2'/%3E%3Ccircle cx='575' cy='504' r='2'/%3E%3Cpath d='M28 560l3 4-4 1z'/%3E%3Crect x='95' y='558' width='5' height='3' rx='1'/%3E%3Ccircle cx='165' cy='562' r='2'/%3E%3Crect x='230' y='558' width='4' height='5' rx='1'/%3E%3Ccircle cx='300' cy='564' r='2.5'/%3E%3Cpath d='M368 560h5v2h-5z'/%3E%3Crect x='435' y='558' width='3' height='4' rx='1'/%3E%3Ccircle cx='505' cy='562' r='2'/%3E%3Crect x='570' y='560' width='5' height='3' rx='1'/%3E%3C/g%3E%3C/svg%3E")`

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
  const [attachOpen, setAttachOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConvRef = useRef<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const realtimeOk = useRef(false)

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
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` }, (payload) => {
        const nd = payload.new as Conversation
        setConvs(prev => {
          const exists = prev.some(c => c.id === nd.id)
          const updated = exists ? prev.map(c => c.id === nd.id ? { ...c, ...nd } : c) : [nd, ...prev]
          return updated.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        })
        if (nd.id === activeConvRef.current) setActiveConv(prev => prev ? { ...prev, ...nd } : null)
      })
      .subscribe((status) => {
        realtimeOk.current = status === 'SUBSCRIBED'
      })
    return () => { realtimeOk.current = false; supabase.removeChannel(channel) }
  }, [businessId])

  // Polling fallback
  useEffect(() => {
    if (!businessId) return
    const p1 = setInterval(async () => {
      if (realtimeOk.current) return
      const { data } = await supabase.from('conversations').select('*').eq('business_id', businessId).order('last_message_at', { ascending: false }).limit(50)
      if (data) {
        setConvs(data)
        const a = activeConvRef.current
        if (a) { const u = data.find(c => c.id === a); if (u) setActiveConv(prev => prev ? { ...prev, ...u } : null) }
      }
    }, 5000)
    const p2 = setInterval(async () => {
      if (realtimeOk.current) return
      const cid = activeConvRef.current
      if (!cid) return
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', cid).order('created_at').limit(100)
      if (data) {
        setMessages(prev => {
          if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) return prev
          if (data.length > prev.length) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          return data
        })
      }
    }, 4000)
    return () => { clearInterval(p1); clearInterval(p2) }
  }, [businessId])

  const loadConversation = async (conv: Conversation) => {
    setActiveConv(conv); setMenuOpen(false); setAttachOpen(false)
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const deleteConversation = async () => {
    if (!activeConv || !businessId) return
    if (!confirm('Delete this conversation? Messages will be permanently removed.')) return
    await supabase.from('messages').delete().eq('conversation_id', activeConv.id)
    await supabase.from('conversations').delete().eq('id', activeConv.id)
    setConvs(prev => prev.filter(c => c.id !== activeConv.id))
    setActiveConv(null)
    setMessages([])
    setMenuOpen(false)
  }

  const blockContact = async () => {
    if (!activeConv || !businessId) return
    if (!confirm(`Block ${displayName(activeConv)}? They won't receive AI replies anymore.`)) return
    await supabase.from('conversations').update({ status: 'blocked' }).eq('id', activeConv.id)
    setActiveConv(prev => prev ? { ...prev, status: 'blocked' } : null)
    setConvs(prev => prev.map(c => c.id === activeConv.id ? { ...c, status: 'blocked' } : c))
    setMenuOpen(false)
  }

  // File upload helper
  const uploadAndSend = async (file: File, type: 'image' | 'document') => {
    if (!activeConv) return
    setSending(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const { url, filename } = await uploadRes.json()
      if (!url) throw new Error('Upload failed')

      await fetch(`/api/conversations/${activeConv.id}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_type: type, media_url: url, filename, content: type === 'image' ? '' : filename }),
      })
    } catch (e) { console.error('Upload error:', e) }
    setSending(false)
    setAttachOpen(false)
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        if (!activeConv) return
        setSending(true)
        try {
          const form = new FormData()
          form.append('file', file)
          form.append('type', 'audio')
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
          const { url } = await uploadRes.json()
          if (url) {
            await fetch(`/api/conversations/${activeConv.id}/reply`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message_type: 'audio', media_url: url, content: 'Voice message' }),
            })
          }
        } catch (e) { console.error('Voice send error:', e) }
        setSending(false)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch (e) { console.error('Mic access denied:', e) }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const filteredConvs = convs.filter(c => {
    if (c.status === 'blocked' && filter !== 'All') return false
    const mf = filter === 'All' || (filter === 'Unread' && c.unread_count > 0) || (filter === 'AI Active' && c.status === 'ai_active') || (filter === 'Manual' && c.status === 'manual') || (filter === 'Resolved' && c.status === 'resolved')
    const ms = !search || (c.customer_name || c.customer_phone).toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })

  const messageGroups = groupMessagesByDate(messages)

  const displayName = (c: Conversation) => c.customer_name || `+${c.customer_phone.replace(/^(\d{3})(\d{2,3})(\d{3})(\d{3,4})$/, '$1 $2 $3 $4')}`

  const initials = (c: Conversation) => {
    if (c.customer_name) { const p = c.customer_name.trim().split(' '); return p.length > 1 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase() }
    return c.customer_phone.slice(-2)
  }

  return (
    <div className="flex h-full" style={{ background: '#0b141a' }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndSend(f, 'image'); e.target.value = '' }} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndSend(f, 'document'); e.target.value = '' }} />

      {/* ── LEFT PANEL ── */}
      <div className={`w-full md:w-[420px] flex-shrink-0 flex flex-col border-r border-[#2a3942] ${activeConv ? 'hidden md:flex' : 'flex'}`} style={{ background: '#111b21' }}>
        <div className="flex items-center justify-between px-4 h-[60px] flex-shrink-0" style={{ background: '#202c33' }}>
          <span className="text-[#e9edef] font-bold text-lg tracking-tight">Chats</span>
        </div>

        {/* Search */}
        <div className="px-2.5 py-1.5">
          <div className="flex items-center bg-[#202c33] rounded-lg px-3 h-[35px]">
            <svg className="text-[#8696a0] mr-4 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or start a new chat" className="bg-transparent text-[#e9edef] placeholder-[#8696a0] text-[14px] outline-none flex-1" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-3 py-1.5 overflow-x-auto scrollbar-none">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all ${filter === f ? 'bg-[#00a884] text-[#111b21] font-medium' : 'bg-[#202c33] text-[#d1d7db] hover:bg-[#2a3942]'}`}>{f}</button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map(conv => {
            const isActive = activeConv?.id === conv.id
            const color = getAvatarColor(conv.customer_name || conv.customer_phone)
            const hasUnread = conv.unread_count > 0
            return (
              <button key={conv.id} onClick={() => loadConversation(conv)} className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
                <div className="w-[49px] h-[49px] rounded-full flex items-center justify-center text-white text-[15px] font-medium flex-shrink-0" style={{ backgroundColor: color }}>{initials(conv)}</div>
                <div className="flex-1 min-w-0 border-b border-[#222d34] py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#e9edef] text-[16.5px] truncate">{displayName(conv)}</span>
                    <span className={`text-[12px] flex-shrink-0 ${hasUnread ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>{conv.last_message_at ? formatListTime(conv.last_message_at) : ''}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[#8696a0] text-[13px] truncate flex items-center gap-1.5">
                      {(conv.status === 'ai_active') && <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="#00a884"><circle cx="12" cy="12" r="4"/></svg>}
                      {conv.status === 'blocked' && <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="#e06c75"><circle cx="12" cy="12" r="10" fill="none" stroke="#e06c75" strokeWidth="2"/><line x1="4" y1="4" x2="20" y2="20" stroke="#e06c75" strokeWidth="2"/></svg>}
                      {conv.last_message || 'No messages yet'}
                    </span>
                    {hasUnread && (
                      <span className="min-w-[20px] h-[20px] bg-[#00a884] text-[#111b21] text-[11px] rounded-full flex items-center justify-center flex-shrink-0 font-bold px-1">{conv.unread_count > 99 ? '99+' : conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {filteredConvs.length === 0 && <div className="py-20 text-center"><p className="text-[#8696a0] text-sm">No conversations found</p></div>}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 h-[60px] flex-shrink-0 relative" style={{ background: '#202c33' }}>
            <button onClick={() => { setActiveConv(null); setMenuOpen(false) }} className="md:hidden text-[#aebac1] hover:text-[#e9edef] mr-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ backgroundColor: getAvatarColor(activeConv.customer_name || activeConv.customer_phone) }}>{initials(activeConv)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[#e9edef] text-[16px] truncate">{displayName(activeConv)}</div>
              <div className="text-[#8696a0] text-[13px]">
                +{activeConv.customer_phone} · {activeConv.status === 'blocked' ? 'Blocked' : activeConv.status === 'ai_active' ? 'AI handling' : activeConv.status === 'manual' ? 'Manual mode' : activeConv.status === 'resolved' ? 'Resolved' : 'Active'}
              </div>
            </div>
            <div className="flex items-center gap-5 text-[#aebac1]">
              <button className="hover:text-[#e9edef]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="hover:text-[#e9edef]"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>
            </div>

            {/* Dropdown */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-4 top-14 z-20 py-2 rounded-md shadow-xl min-w-[220px]" style={{ background: '#233138' }}>
                  {activeConv.status !== 'manual' && activeConv.status !== 'blocked' && (
                    <button onClick={() => updateStatus('manual')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-[14.5px] hover:bg-[#182229]">Take over chat</button>
                  )}
                  {activeConv.status === 'manual' && (
                    <button onClick={() => updateStatus('ai_active')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-[14.5px] hover:bg-[#182229]">Hand back to AI</button>
                  )}
                  {activeConv.status !== 'resolved' && activeConv.status !== 'blocked' && (
                    <button onClick={() => updateStatus('resolved')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-[14.5px] hover:bg-[#182229]">Resolve</button>
                  )}
                  {activeConv.status === 'resolved' && (
                    <button onClick={() => updateStatus('ai_active')} className="w-full text-left px-6 py-2.5 text-[#e9edef] text-[14.5px] hover:bg-[#182229]">Reopen</button>
                  )}
                  <div className="h-px bg-[#374045] my-1" />
                  {activeConv.status !== 'blocked' ? (
                    <button onClick={blockContact} className="w-full text-left px-6 py-2.5 text-[#e06c75] text-[14.5px] hover:bg-[#182229]">Block contact</button>
                  ) : (
                    <button onClick={() => updateStatus('ai_active')} className="w-full text-left px-6 py-2.5 text-[#00a884] text-[14.5px] hover:bg-[#182229]">Unblock contact</button>
                  )}
                  <button onClick={deleteConversation} className="w-full text-left px-6 py-2.5 text-[#e06c75] text-[14.5px] hover:bg-[#182229]">Delete chat</button>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-[6%] py-2" style={{ backgroundImage: WA_DOODLE_BG, backgroundColor: '#0b141a' }}>
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <span className="bg-[#182229] text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">No messages yet</span>
              </div>
            )}

            {messageGroups.map(group => (
              <div key={group.label}>
                <div className="flex justify-center my-3">
                  <span className="bg-[#182229] text-[#8696a0] text-[12px] px-3 py-1 rounded-lg shadow-sm tracking-wider">{group.label}</span>
                </div>
                {group.messages.map(msg => {
                  const isOut = msg.from_role === 'ai' || msg.from_role === 'staff'
                  return (
                    <div key={msg.id} className={`flex mb-[2px] ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[65%] px-2 py-1.5 text-[14.2px] leading-[19px] shadow-sm ${isOut ? 'bg-[#005c4b] text-[#e9edef] rounded-[7.5px] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-[7.5px] rounded-tl-none'}`}>
                        {isOut && msg.from_role === 'staff' && <div className="text-[12px] text-[#53bdeb] font-medium mb-0.5">You</div>}
                        {isOut && msg.from_role === 'ai' && <div className="text-[12px] text-[#00a884] font-medium mb-0.5">AI Agent</div>}

                        {msg.message_type === 'audio' && msg.audio_url ? (
                          <div className="min-w-[250px]">
                            <audio src={msg.audio_url} controls preload="metadata" className="w-full max-h-[36px]" />
                            {msg.content && msg.content !== '[Voice message received]' && msg.content !== 'Voice message' && (
                              <p className="text-[11px] text-[#8696a0] mt-1 italic">&quot;{msg.content}&quot;</p>
                            )}
                          </div>
                        ) : msg.message_type === 'image' && msg.audio_url ? (
                          <div className="min-w-[200px]">
                            <div className="relative max-w-full max-h-[300px] min-h-[150px] rounded-md overflow-hidden">
                              <Image src={msg.audio_url} alt="" fill className="object-cover" sizes="300px" unoptimized />
                            </div>
                            {msg.content && msg.content !== 'Photo' && <p className="text-[13px] mt-1">{msg.content}</p>}
                          </div>
                        ) : msg.message_type === 'document' && msg.audio_url ? (
                          <a href={msg.audio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1a2a32] rounded-lg px-3 py-2 min-w-[200px] hover:brightness-110 transition">
                            <svg width="30" height="36" viewBox="0 0 30 36" fill="none"><rect width="30" height="36" rx="3" fill="#374045"/><path d="M8 10h9l5 5v13H8V10z" fill="#8696a0"/><path d="M17 10v5h5" fill="none" stroke="#374045" strokeWidth="1"/></svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-[#e9edef] truncate">{msg.content || 'Document'}</p>
                              <p className="text-[11px] text-[#8696a0]">Document</p>
                            </div>
                          </a>
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}

                        <span className="float-right ml-2 mt-0.5 flex items-center gap-0.5 select-none">
                          <span className="text-[11px] text-[#ffffff99] leading-none">{formatTime(msg.created_at)}</span>
                          {isOut && <svg className="text-[#53bdeb] ml-0.5" width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.127a.46.46 0 0 0-.36-.153.457.457 0 0 0-.34.178.46.46 0 0 0-.102.356.46.46 0 0 0 .178.305l2.4 2.4a.46.46 0 0 0 .356.102.46.46 0 0 0 .305-.178l6.508-8.051a.46.46 0 0 0 .102-.356.46.46 0 0 0-.16-.188zm3.45 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.272-.463.554 1.663 1.663a.46.46 0 0 0 .356.102.46.46 0 0 0 .305-.178l6.508-8.051a.46.46 0 0 0 .102-.356.46.46 0 0 0-.16-.188z"/></svg>}
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
          <div className="flex-shrink-0 flex items-center gap-2 px-3 h-[62px] relative" style={{ background: '#202c33' }}>
            {activeConv.status === 'manual' ? (
              <>
                {/* Attach button */}
                <button onClick={() => setAttachOpen(!attachOpen)} className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0 p-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                </button>

                {/* Attach popup */}
                {attachOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAttachOpen(false)} />
                    <div className="absolute left-3 bottom-16 z-20 flex gap-4 p-4 rounded-xl shadow-xl" style={{ background: '#233138' }}>
                      <button onClick={() => { fileInputRef.current?.click(); setAttachOpen(false) }} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 rounded-full bg-[#7f66ff] flex items-center justify-center group-hover:brightness-110 transition">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                        </div>
                        <span className="text-[#8696a0] text-[12px]">Photos</span>
                      </button>
                      <button onClick={() => { docInputRef.current?.click(); setAttachOpen(false) }} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 rounded-full bg-[#5157ae] flex items-center justify-center group-hover:brightness-110 transition">
                          <svg width="20" height="22" viewBox="0 0 20 22" fill="white"><path d="M4 0C2.9 0 2 .9 2 2v18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6l-6-6H4zm8 7V1.5L17.5 7H12z"/></svg>
                        </div>
                        <span className="text-[#8696a0] text-[12px]">Document</span>
                      </button>
                    </div>
                  </>
                )}

                <form onSubmit={sendReply} className="flex-1 flex items-center gap-2">
                  <input
                    value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a message"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && reply.trim()) { e.preventDefault(); sendReply(e as any) } }}
                    className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-lg px-3 py-2.5 text-[15px] outline-none"
                  />
                  {reply.trim() ? (
                    <button type="submit" disabled={sending} className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0 p-1 disabled:opacity-50">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                  ) : recording ? (
                    <button type="button" onClick={stopRecording} className="text-[#e06c75] hover:text-[#ff8a8a] transition-colors flex-shrink-0 p-1 animate-pulse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} disabled={sending} className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0 p-1 disabled:opacity-50">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                    </button>
                  )}
                </form>
              </>
            ) : activeConv.status === 'blocked' ? (
              <div className="flex-1 text-center py-2">
                <span className="text-[#8696a0] text-sm">Contact is blocked. </span>
                <button onClick={() => updateStatus('ai_active')} className="text-[#00a884] text-sm hover:underline">Unblock</button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2">
                {activeConv.status === 'ai_active' && <span className="inline-block w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />}
                <span className="text-[#8696a0] text-sm">
                  {activeConv.status === 'resolved' ? 'Resolved' : 'AI is handling replies'}
                  {' \u2014 '}
                  <button onClick={() => updateStatus('manual')} className="text-[#00a884] hover:underline">{activeConv.status === 'resolved' ? 'reopen' : 'take over'}</button>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-6" style={{ background: '#222e35' }}>
          <div className="w-[320px] text-center">
            <div className="w-[250px] h-[250px] mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: '#364147' }}>
              <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="0.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <h2 className="text-[#e9edef] text-[28px] font-light mb-3">WAgenT for Business</h2>
            <p className="text-[#8696a0] text-sm leading-5">Send and receive messages from your customers. AI handles replies automatically.</p>
          </div>
        </div>
      )}
    </div>
  )
}
