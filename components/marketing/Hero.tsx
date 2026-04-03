'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'

/* ─── Chat demo data ─────────────────────────────────────────────────────── */
const chatMessages = [
  { from: 'customer', text: 'Hi, how much is a Hikvision 4-channel CCTV kit?' },
  { from: 'ai', text: 'Hello! Our 4-channel kit starts at GHS 850 (analogue) or GHS 1,200 for IP cameras. Both include installation. Want the full specs? 📋' },
  { from: 'customer', text: 'Yes please, and do you deliver to Kumasi?' },
  { from: 'ai', text: 'Absolutely — we deliver nationwide. Kumasi orders arrive within 48 hrs. Shall I send a quote? 🚀' },
]

/* ─── Animated canvas background ─────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; color: string }
    const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 8000))
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.25 + 0.05,
      color: Math.random() > 0.7 ? '#00a884' : '#ffffff',
    }))

    type Glow = { x: number; y: number; r: number; phase: number; speed: number }
    const glows: Glow[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 200 + Math.random() * 200,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.004,
    }))

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      glows.forEach(g => {
        const pulse = 0.04 + Math.sin(t * g.speed + g.phase) * 0.02
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r)
        grad.addColorStop(0, `rgba(0,168,132,${pulse})`)
        grad.addColorStop(1, 'rgba(0,168,132,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
        ctx.fill()
      })

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 0.5
      const gs = 80
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      t++
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
}

/* ─── iPhone chat mockup using iphone.png ─────────────────────────────────── */
function IPhoneMockup() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const run = () => {
      setVisibleMessages([])
      setShowTyping(false)
      timeout = setTimeout(() => {
        setVisibleMessages([0])
        timeout = setTimeout(() => {
          setShowTyping(true)
          timeout = setTimeout(() => {
            setShowTyping(false)
            setVisibleMessages(p => [...p, 1])
            timeout = setTimeout(() => {
              setVisibleMessages(p => [...p, 2])
              timeout = setTimeout(() => {
                setShowTyping(true)
                timeout = setTimeout(() => {
                  setShowTyping(false)
                  setVisibleMessages(p => [...p, 3])
                  timeout = setTimeout(run, 4000)
                }, 1400)
              }, 1400)
            }, 2000)
          }, 1800)
        }, 800)
      }, 400)
    }
    run()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 571 }}>
      {/* Glow rings */}
      <div className="absolute inset-0 rounded-[44px] bg-[#00a884]/8 blur-3xl scale-110" />
      <div className="absolute inset-0 rounded-[44px] border border-[#00a884]/20 scale-105" />

      {/* iPhone image — clip-path removes white side margins, shows gold frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/iphone.png"
        alt="WAgenT on iPhone"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 10,
          clipPath: 'inset(1% 6.5% 1% 6.5% round 42px)',
          filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.8))',
        }}
      />

      {/* Chat overlay — positioned over the phone screen */}
      <div
        className="absolute z-20 flex flex-col overflow-hidden"
        style={{ top: '4%', left: '10%', right: '10%', bottom: '4%', borderRadius: '36px' }}
      >
          {/* Status bar spacer — phone image already shows 9:41 status bar at top */}
          <div className="h-10 bg-[#0b141a] flex-shrink-0" />

          {/* WA Header */}
          <div className="flex items-center gap-2 px-2 py-2 bg-[#1f2c34] flex-shrink-0">
            <svg className="w-3 h-3 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f70] flex items-center justify-center text-white text-[8px] font-bold">AE</div>
            <div className="flex-1 min-w-0">
              <div className="text-[#e9edef] text-[8px] font-semibold leading-none">Accra Electronics</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-[#00a884] animate-pulse" />
                <span className="text-[#00a884] text-[7px]">AI Active</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 px-2 py-1.5 space-y-1.5 overflow-hidden"
            style={{ background: '#0b141a' }}
          >
            {chatMessages.map((msg, i) => {
              if (!visibleMessages.includes(i)) return null
              const isAI = msg.from === 'ai'
              return (
                <div key={i} className={`flex ${isAI ? 'justify-end' : 'justify-start'}`} style={{ animation: 'msgIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  <div
                    className={`max-w-[85%] px-2 py-1 text-[7.5px] text-[#e9edef] leading-relaxed shadow-sm ${
                      isAI ? 'bg-[#005c4b] rounded-[6px_1px_6px_6px]' : 'bg-[#1f2c34] rounded-[1px_6px_6px_6px]'
                    }`}
                  >
                    {msg.text}
                    <div className={`flex items-center gap-0.5 mt-0.5 ${isAI ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[6px] text-[#8696a0]">9:4{i}</span>
                      {isAI && (
                        <svg className="w-2 h-2 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {showTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1f2c34] rounded-[1px_6px_6px_6px] px-2.5 py-2">
                  <div className="flex gap-0.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1f2c34] flex-shrink-0">
            <div className="flex-1 bg-[#2a3942] rounded-full px-2.5 py-1">
              <span className="text-[#8696a0] text-[7px]">Type a message</span>
            </div>
            <div className="w-5 h-5 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </div>
          </div>
        </div>

      <style jsx>{`
        @keyframes msgIn {
          from { transform: scale(0.85) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ─── Animated stat counter ─────────────────────────────────────────────── */
function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className={`transition-all duration-700 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="font-mono text-xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-[#8696a0] text-xs">{label}</div>
    </div>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 })

      tl.from('.hero-badge', { scale: 0.7, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
      tl.from('.hero-line > span', {
        y: 80, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)',
        stagger: 0.12, duration: 0.9, ease: 'power4.out',
      }, '-=0.2')
      tl.from('.hero-sub', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      tl.from('.hero-btn', {
        y: 20, opacity: 0, scale: 0.95,
        stagger: 0.1, duration: 0.6, ease: 'back.out(1.8)',
      }, '-=0.3')
      tl.from('.stat-divider', { scaleX: 0, duration: 0.6, ease: 'power3.inOut' }, '-=0.1')
      tl.from('.hero-phone', {
        x: 80, opacity: 0, rotation: 4,
        duration: 1.1, ease: 'power4.out',
      }, 0.3)

      gsap.to('.hero-badge', {
        boxShadow: '0 0 20px rgba(0,168,132,0.4)',
        repeat: -1, yoyo: true, duration: 2, ease: 'sine.inOut', delay: 2,
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const stats = [
    { value: '1.4s', label: 'Avg reply' },
    { value: '24/7', label: 'Always on' },
    { value: '96%', label: 'Resolution' },
    { value: '10 min', label: 'Setup' },
  ]

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#08090a]"
    >
      <ParticleField />

      <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-[#00a884]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#00a884]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* ── Left ── */}
        <div>
          <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#00a884]/35 bg-[#00a884]/10 mb-8 cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00a884]" />
            </span>
            <span className="text-[#00a884] text-xs font-semibold tracking-wide">Now live across Ghana & West Africa</span>
          </div>

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-serif italic text-white leading-[1.02] mb-6">
            {[
              { text: 'Your business never', className: '' },
              { text: 'misses a WhatsApp', className: '' },
              { text: 'message again.', className: 'text-[#00a884]' },
            ].map((line, i) => (
              <span key={i} className="hero-line block overflow-hidden pb-1">
                <span className={`block ${line.className}`}>{line.text}</span>
              </span>
            ))}
          </h1>

          <p className="hero-sub text-[#8696a0] text-base sm:text-lg leading-relaxed mb-8 max-w-md">
            WAgenT is an AI agent that reads every WhatsApp message, understands your business, and replies in seconds — even at 3am. Built for African businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link
              href="/signup"
              className="hero-btn group inline-flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#00c49a] text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:shadow-[0_0_36px_rgba(0,168,132,0.45)] hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base"
            >
              Start free — 14 days
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#demo"
              className="hero-btn inline-flex items-center justify-center gap-2 text-white/70 hover:text-white border border-white/10 hover:border-[#00a884]/40 font-medium px-7 py-3.5 rounded-full transition-all duration-200 hover:bg-[#00a884]/5 text-sm sm:text-base"
            >
              See live demo ↓
            </a>
          </div>

          <div className="stat-divider h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 origin-left" />
          <div className="grid grid-cols-4 gap-3 sm:gap-6">
            {stats.map((s, i) => (
              <StatCounter key={s.value} value={s.value} label={s.label} delay={1400 + i * 100} />
            ))}
          </div>
        </div>

        {/* ── Right — iPhone with chat overlay ── */}
        <div className="hero-phone flex justify-center lg:justify-end">
          <div style={{ animation: 'heroFloat 6s ease-in-out infinite' }}>
            <IPhoneMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 opacity-40">
        <span className="text-[#8696a0] text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#8696a0] to-transparent" style={{ animation: 'scrollPulse 2s ease-in-out infinite' }} />
      </div>

      <style jsx>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.3); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(0.5deg); }
          66% { transform: translateY(-5px) rotate(-0.5deg); }
        }
      `}</style>
    </section>
  )
}
