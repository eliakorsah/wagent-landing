import dynamic from 'next/dynamic'
import Navbar from '@/components/marketing/Navbar'
import Hero from '@/components/marketing/Hero'

const SocialProof = dynamic(() => import('@/components/marketing/SocialProof'))
const Features = dynamic(() => import('@/components/marketing/Features'))
const HowItWorks = dynamic(() => import('@/components/marketing/HowItWorks'))
const Demo = dynamic(() => import('@/components/marketing/Demo'))
const Pricing = dynamic(() => import('@/components/marketing/Pricing'))
const Testimonials = dynamic(() => import('@/components/marketing/Testimonials'))
const Footer = dynamic(() => import('@/components/marketing/Footer'))
const WhatsAppSupportButton = dynamic(() => import('@/components/WhatsAppSupportButton'), { ssr: false })

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Demo />
      <Pricing />
      <Testimonials />
      <Footer />
      <WhatsAppSupportButton />
    </main>
  )
}
