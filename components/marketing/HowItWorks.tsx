'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'Connect your WhatsApp',
    description: 'Link your WhatsApp Business number through our guided wizard. Takes 5 minutes, no technical knowledge required.',
  },
  {
    number: '02',
    title: 'Train the AI on your business',
    description: 'Upload your price list, product catalogue, and FAQs. Add custom instructions about your tone and policies.',
  },
  {
    number: '03',
    title: 'Go live and watch it work',
    description: 'Your AI agent handles every incoming message automatically. You monitor from the dashboard and step in anytime.',
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      steps.forEach((_, i) => {
        gsap.from(`.step-${i}`, {
          x: -30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: `.step-${i}`,
            start: 'top 80%',
            once: true,
          },
        })
      })

      gsap.from('.dashboard-preview', {
        x: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-[#0a0b0c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif italic text-white mb-4">
            Up and running in 10 minutes
          </h2>
          <p className="text-[#8696a0] text-lg">No developers needed. No complicated setup.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className={`step-${i} flex gap-6 group`}>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0f1012] border border-white/8 flex items-center justify-center group-hover:border-[#00a884]/40 transition-colors">
                    <span className="font-mono text-[#00a884] text-sm font-bold">{step.number}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#00a884] hover:bg-[#00c49a] text-white font-medium px-6 py-3 rounded-full transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,168,132,0.3)]"
              >
                Get started now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="dashboard-preview">
            <div className="bg-[#111b21] rounded-2xl border border-[#374045] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#374045] bg-[#1f2c34]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[#8696a0] text-xs">WAgenT Dashboard</span>
              </div>

              <div className="flex h-64">
                {/* Sidebar */}
                <div className="w-48 border-r border-[#374045] p-3 space-y-1">
                  {['Overview', 'Live Chats', 'Training', 'Analytics'].map((item, i) => (
                    <div
                      key={item}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        i === 0 ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0]'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Conversations', val: '142' },
                      { label: 'AI Replies', val: '890' },
                      { label: 'Avg Time', val: '1.4s' },
                      { label: 'Resolved', val: '96%' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#1f2c34] rounded-lg p-2">
                        <div className="text-[#00a884] font-mono text-sm font-bold">{stat.val}</div>
                        <div className="text-[#8696a0] text-[10px]">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Kofi A.', msg: 'What is the price of...', status: 'AI Replied', color: 'bg-green-500/20 text-green-400' },
                      { name: 'Abena M.', msg: 'Do you deliver to...', status: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
                    ].map((conv, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#1f2c34] rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-[#374045] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[#e9edef] text-[10px] font-medium">{conv.name}</div>
                          <div className="text-[#8696a0] text-[9px] truncate">{conv.msg}</div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${conv.color}`}>{conv.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
