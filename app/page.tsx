import Navbar from '@/components/marketing/Navbar'
import Hero from '@/components/marketing/Hero'
import SocialProof from '@/components/marketing/SocialProof'
import Features from '@/components/marketing/Features'
import HowItWorks from '@/components/marketing/HowItWorks'
import Demo from '@/components/marketing/Demo'
import Pricing from '@/components/marketing/Pricing'
import Testimonials from '@/components/marketing/Testimonials'
import Footer from '@/components/marketing/Footer'
import WhatsAppSupportButton from '@/components/WhatsAppSupportButton'

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
