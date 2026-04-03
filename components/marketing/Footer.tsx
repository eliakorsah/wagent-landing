'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-word', {
        y: 40,
        opacity: 0,
        clipPath: 'inset(100% 0% 0% 0%)',
        stagger: 0.06,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 80%',
          once: true,
        },
      })
    }, ctaRef)

    return () => ctx.revert()
  }, [])

  const footerLinks: Record<string, string[]> = {
    Product: ['Features', 'Pricing', 'How it works', 'Changelog'],
    Resources: ['Documentation', 'Blog', 'Support', 'Status'],
    Company: ['About', 'Privacy Policy', 'Terms of Service', 'Contact'],
  }

  return (
    <footer className="bg-[#08090a]">
      {/* CTA Banner */}
      <div ref={ctaRef} className="relative py-24 overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00a884]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-serif italic text-white mb-6 leading-tight">
            {['Your', 'competitors', 'are', 'already', 'automating.'].map((word, i) => (
              <span key={i} className="cta-word inline-block mr-3">
                {word}
              </span>
            ))}
            <br />
            {['Are', 'you?'].map((word, i) => (
              <span key={i} className={`cta-word inline-block mr-3 ${i === 1 ? 'text-[#00a884]' : ''}`}>
                {word}
              </span>
            ))}
          </h2>
          <p className="text-[#8696a0] text-lg mb-10">
            Start your free 14-day trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#00c49a] text-white font-medium px-8 py-4 rounded-full text-lg transition-all duration-200 hover:shadow-[0_0_40px_rgba(0,168,132,0.3)]"
            >
              Start your free 14-day trial
            </Link>
            <a
              href="https://wa.me/233XXXXXXXXX?text=Hi%20LYTRIX%20CONSULT%2C%20I%27d%20like%20to%20book%20a%20WAgenT%20demo."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-[#00a884]/40 text-white font-medium px-8 py-4 rounded-full text-lg transition-all hover:bg-[#00a884]/5"
            >
              <svg className="w-5 h-5 text-[#00a884]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp us for a demo
            </a>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Image
                  src="/logo&name.png"
                  alt="WAgenT by LYTRIX CONSULT"
                  width={150}
                  height={34}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <p className="text-[#8696a0] text-sm leading-relaxed mb-1 max-w-xs">
                AI-powered WhatsApp automation for African businesses. Never miss another message.
              </p>
              <p className="text-[#374045] text-xs mb-4">A product by LYTRIX CONSULT</p>
              <div className="flex gap-3">
                {[
                  { name: 'Twitter / X', href: '#', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                  { name: 'LinkedIn', href: '#', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                  { name: 'TikTok', href: '#', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg> },
                ].map((social) => (
                  <a key={social.name} href={social.href} aria-label={social.name} className="text-[#8696a0] hover:text-white transition-colors">
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-white font-medium text-sm mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[#8696a0] hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#8696a0] text-sm">
              © 2026 LYTRIX CONSULT · Accra, Ghana. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[#8696a0] hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-[#8696a0] hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
