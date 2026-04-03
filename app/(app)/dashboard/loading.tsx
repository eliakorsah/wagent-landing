export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton h-4 w-72 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  )
}
