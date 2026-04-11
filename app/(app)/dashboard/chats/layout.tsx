import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Chats',
  description: 'View and reply to your WhatsApp conversations in real time.',
}

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return children
}
