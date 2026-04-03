'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    title: 'Auto-Reply in Seconds',
    description: 'Replies to every customer message within 1.4 seconds, 24 hours a day. Never lose a lead to silence.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Voice Message Replies',
    description: 'Converts text replies to natural voice messages via ElevenLabs. Stand out from every competitor still typing manually.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25v7.5M6 6.75v10.5M9 5.25v13.5M12 3.75v16.5M15 5.25v13.5M18 6.75v10.5M21 8.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Train on Your Business',
    description: 'Upload product catalogues, price lists, and FAQs. The AI becomes an expert on your business in under 10 minutes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M12 3a9 9 0 100 18A9 9 0 0012 3z" />
      </svg>
    ),
  },
  {
    title: 'Live Conversation Dashboard',
    description: 'Watch every conversation in real-time. Step in manually when needed. Full history, search, and filters.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ),
  },
  {
    title: 'Smart Human Handoff',
    description: 'When a customer needs a real person, the AI flags it instantly and transfers the conversation to your staff.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Analytics & Insights',
    description: 'See your most-asked questions, peak hours, response rates, and revenue traced back to WhatsApp conversations.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 60,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="features" ref={sectionRef} className="py-24 bg-[#08090a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif italic text-white mb-4">
            Everything your business needs
          </h2>
          <p className="text-[#8696a0] text-lg max-w-2xl mx-auto">
            WAgenT handles your WhatsApp so you can focus on running your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card card-hover bg-[#0f1012] border border-white/6 rounded-2xl p-8 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/10 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{feature.title}</h3>
              <p className="text-[#8696a0] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
