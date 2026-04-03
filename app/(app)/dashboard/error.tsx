'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-[#e9edef] font-medium mb-2">Something went wrong</h2>
        <p className="text-[#8696a0] text-sm mb-4">{error.message}</p>
        <button onClick={reset} className="bg-[#00a884] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#00c49a] transition-all">Try again</button>
      </div>
    </div>
  )
}
