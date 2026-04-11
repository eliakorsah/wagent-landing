import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your WAgenT WhatsApp agent, business profile, and notification preferences.',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
