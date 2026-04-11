import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vote',
  description: 'Vote on upcoming WAgenT features and help shape the product roadmap.',
}

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
