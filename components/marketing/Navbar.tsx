'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.nav-item', {
        y: -20,
        opacity: 0,
        stagger: 0.05,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.2,
      })
    })

    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => { ctx.revert(); window.removeEventListener('scroll', handleScroll) }
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      gsap.fromTo('.mobile-nav-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.4)' }
      )
    }
  }, [mobileOpen])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ]

  return (
    <header
      ref={navRef}
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(8,9,10,0.92)] backdrop-blur-[24px] border-b border-white/5 shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between" style={{ height: '72px' }}>
        {/* Logo — bigger */}
        <Link href="/" className="nav-item flex items-center group">
          <Image
            src="/logo&name.png"
            alt="WAgenT by LYTRIX CONSULT"
            width={180}
            height={44}
            className="h-11 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-item text-[#8696a0] hover:text-white transition-colors duration-200 text-sm font-medium relative group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#00a884] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="nav-item text-[#8696a0] hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="nav-item relative overflow-hidden bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,168,132,0.4)]"
          >
            Start free trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-item md:hidden text-white p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[72px] bg-[#08090a]/98 backdrop-blur-2xl z-40 flex flex-col items-center justify-center gap-6">
          <div className="mobile-nav-item mb-4">
            <Image src="/logo&name.png" alt="WAgenT" width={200} height={48} className="h-12 w-auto opacity-80" />
          </div>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-nav-item text-3xl text-white font-medium tracking-tight hover:text-[#00a884] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mobile-nav-item flex flex-col gap-3 mt-6 w-72">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-3.5 border border-white/15 rounded-full text-white font-medium hover:border-white/30 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-center py-3.5 bg-[#00a884] rounded-full text-white font-semibold hover:bg-[#00c49a] transition-all hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]">
              Start free trial
            </Link>
          </div>
          <p className="mobile-nav-item text-[#374045] text-xs mt-8">Powered by LYTRIX CONSULT</p>
        </div>
      )}
    </header>
  )
}
