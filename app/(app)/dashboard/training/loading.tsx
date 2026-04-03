export default function Loading() {
  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="skeleton h-8 w-36 rounded-lg" />
      <div className="skeleton h-10 w-80 rounded-xl" />
      <div className="skeleton h-48 rounded-2xl" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  )
}
