import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Training',
  description: 'Train your AI WhatsApp agent with custom responses, FAQs, and business knowledge.',
}

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return children
}
