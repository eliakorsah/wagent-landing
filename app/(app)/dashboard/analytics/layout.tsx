import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Track your WhatsApp agent performance, message volume, and customer engagement.',
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
