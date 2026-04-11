import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your WAgenT dashboard. Manage your AI WhatsApp agent, view chats, and grow your business.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
