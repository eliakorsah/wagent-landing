import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your WAgenT account password. We will send you a link to create a new password.',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
