import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CookieBanner } from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'WAgenT — AI WhatsApp Agent for Ghanaian Businesses',
  description: 'WAgenT auto-replies to WhatsApp messages, sends voice notes, and never misses a customer enquiry. Built for businesses in Ghana and West Africa. Start free in 10 minutes.',
  keywords: ['WhatsApp AI Ghana', 'AI WhatsApp agent', 'WhatsApp automation Ghana', 'WhatsApp business bot Ghana', 'auto reply WhatsApp'],
  authors: [{ name: 'LYTRIX CONSULT' }],
  creator: 'LYTRIX CONSULT',
  publisher: 'LYTRIX CONSULT',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'WAgenT — AI WhatsApp Agent for Ghanaian Businesses',
    description: 'Never miss a WhatsApp message. AI replies in 1.4 seconds. Built for Ghana.',
    url: 'https://wagent-africa.com',
    siteName: 'WAgenT by LYTRIX CONSULT',
    locale: 'en_GH',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WAgenT — AI WhatsApp Agent for Ghana',
    description: 'Never miss a WhatsApp message again.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://wagent-africa.com' },
  icons: {
    icon: '/logo only.png',
    shortcut: '/logo only.png',
    apple: '/logo only.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'LYTRIX CONSULT',
              url: 'https://wagent-africa.com',
              logo: 'https://wagent-africa.com/logo%26name.png',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Accra',
                addressCountry: 'GH',
              },
              sameAs: [],
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
