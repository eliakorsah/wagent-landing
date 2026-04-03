export default function Loading() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-[#374045] p-3 space-y-2">
        <div className="skeleton h-9 rounded-lg w-full" />
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#8696a0] text-sm">Loading conversations...</div>
      </div>
    </div>
  )
}
