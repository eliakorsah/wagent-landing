'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Demo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanges, setExchanges] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || exchanges >= 3) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setExchanges(prev => prev + 1)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the demo is temporarily unavailable. Try again shortly.' }])
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <section id="demo" className="py-24 bg-[#08090a]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-serif italic text-white mb-4">
            Try it — type a message below
          </h2>
          <p className="text-[#8696a0] text-lg">
            Live AI demo connected to a fictional electronics business.
            {exchanges >= 3 && <span className="text-yellow-400 ml-2">(Demo limit — sign up for full access)</span>}
          </p>
        </div>

        {/* Laptop frame wrapper */}
        <div className="relative">
          <Image
            src="/laptop.png"
            alt="WAgenT dashboard on laptop"
            width={1100}
            height={700}
            className="w-full h-auto"
            priority
          />

          {/* Chat UI inside laptop screen — calibrated to laptop.png screen area */}
          <div
            className="absolute flex flex-col overflow-hidden"
            style={{
              top: '10%',
              left: '10.5%',
              right: '10.5%',
              bottom: '30%',
              background: '#111b21',
              borderRadius: '20px',
            }}
          >
            {/* WA-style header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1f2c34] border-b border-[#374045] flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f70] flex items-center justify-center text-white font-bold text-xs shadow flex-shrink-0">AE</div>
              <div className="flex-1 min-w-0">
                <div className="text-[#e9edef] font-semibold text-xs leading-none">Accra Electronics Hub</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                  <span className="text-[#8696a0] text-[10px]">AI Agent Active</span>
                </div>
              </div>
              <div className="flex gap-3 text-[#8696a0]">
                <svg className="w-4 h-4 hover:text-white cursor-pointer transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                <svg className="w-4 h-4 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-1.5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#0b141a',
              }}
            >
              {/* Date separator */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#1f2c34] flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#00a884]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <p className="text-[#8696a0] text-sm">Ask anything about electronics, pricing, or delivery</p>
                  <p className="text-[#374045] text-xs">Try: "How much is a CCTV kit?" or "Do you deliver to Tamale?"</p>
                </div>
              )}

              {messages.length > 0 && (
                <div className="flex justify-center mb-2">
                  <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-full">Today</span>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'demoMsgIn 0.2s ease-out both' }}>
                  <div
                    className={`relative max-w-xs lg:max-w-sm px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-[8px_0px_8px_8px]'
                        : 'bg-[#1f2c34] text-[#e9edef] rounded-[0px_8px_8px_8px]'
                    }`}
                  >
                    {msg.content}
                    <div className={`flex items-center gap-1 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-[#8696a0]">{timeStr}</span>
                      {msg.role === 'user' && (
                        <svg className="w-3.5 h-3.5 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1f2c34] rounded-[0px_8px_8px_8px] px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMessage} className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1f2c34] border-t border-[#374045] flex-shrink-0">
              <button type="button" className="text-[#8696a0] hover:text-white transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={exchanges >= 3 ? 'Demo limit reached' : 'Type a message'}
                disabled={exchanges >= 3 || loading}
                className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-full px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#00a884]/30 disabled:opacity-50"
              />
              {input.trim() ? (
                <button
                  type="submit"
                  disabled={loading || exchanges >= 3}
                  className="w-7 h-7 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-40 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </button>
              ) : (
                <button type="button" className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes demoMsgIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  )
}
