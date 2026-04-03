import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="font-mono text-8xl font-bold text-[#374045] mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-[#8696a0] mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="bg-[#00a884] hover:bg-[#00c49a] text-white font-medium px-6 py-3 rounded-full transition-all">
          Go home
        </Link>
      </div>
    </div>
  )
}
