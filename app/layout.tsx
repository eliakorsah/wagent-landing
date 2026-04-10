import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CookieBanner } from '@/components/CookieBanner'

const BASE_URL = 'https://wagent-landing.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'WAgenT — AI WhatsApp Agent for Ghanaian Businesses',
    template: '%s | WAgenT',
  },
  description: 'WAgenT auto-replies to WhatsApp messages, sends voice notes, and never misses a customer enquiry. Built for businesses in Ghana and West Africa. Start free in 14 days.',
  keywords: [
    'WhatsApp AI Ghana', 'AI WhatsApp agent', 'WhatsApp automation Ghana',
    'WhatsApp chatbot Ghana', 'auto reply WhatsApp', 'WhatsApp business bot',
    'AI customer service Ghana', 'WAgenT', 'LYTRIX CONSULT',
    'WhatsApp AI West Africa', 'automated WhatsApp replies',
  ],
  authors: [{ name: 'LYTRIX CONSULT', url: BASE_URL }],
  creator: 'LYTRIX CONSULT',
  publisher: 'LYTRIX CONSULT',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: 'WAgenT — AI WhatsApp Agent for Ghanaian Businesses',
    description: 'Never miss a WhatsApp message. AI replies in under 2 seconds, 24/7. Built for Ghana & West Africa.',
    url: BASE_URL,
    siteName: 'WAgenT by LYTRIX CONSULT',
    locale: 'en_GH',
    type: 'website',
    images: [{ url: `${BASE_URL}/logo&name.png`, width: 1200, height: 630, alt: 'WAgenT — AI WhatsApp Agent' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WAgenT — AI WhatsApp Agent for Ghana',
    description: 'Never miss a WhatsApp message. AI handles it 24/7.',
    images: [`${BASE_URL}/logo&name.png`],
  },
  alternates: { canonical: BASE_URL },
  icons: {
    icon: [
      { url: '/logo only.png', type: 'image/png' },
    ],
    shortcut: '/logo only.png',
    apple: '/logo only.png',
  },
  verification: {
    // Add your Google Search Console verification token here when ready:
    // google: 'YOUR_GOOGLE_VERIFICATION_TOKEN',
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
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'LYTRIX CONSULT',
                url: 'https://wagent-landing.vercel.app',
                logo: 'https://wagent-landing.vercel.app/logo%26name.png',
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'customer support',
                  availableLanguage: ['English', 'Twi', 'French'],
                },
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Accra',
                  addressCountry: 'GH',
                },
                sameAs: [],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'WAgenT',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                description: 'AI WhatsApp agent that auto-replies to customer messages for businesses in Ghana and West Africa.',
                url: 'https://wagent-landing.vercel.app',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'GHS',
                  description: '14-day free trial',
                },
                author: {
                  '@type': 'Organization',
                  name: 'LYTRIX CONSULT',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'WAgenT',
                url: 'https://wagent-landing.vercel.app',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://wagent-landing.vercel.app/signup',
                  'query-input': 'required name=signup',
                },
              },
            ]),
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
