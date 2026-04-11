import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referrals',
  description: 'Refer businesses to WAgenT and earn rewards.',
}

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children
}
