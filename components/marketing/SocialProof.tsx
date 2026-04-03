'use client'

const companies = [
  'ELECTRONICS HUB', 'KUMASI PHARMACY', 'REGIMANUEL GRAY', 'ACCRA BAKEHOUSE',
  'TEMA LOGISTICS', 'HEALTHPLUS', 'GOLDFIELDS GH', 'STANBIC BANK',
  'ELECTRONICS HUB', 'KUMASI PHARMACY', 'REGIMANUEL GRAY', 'ACCRA BAKEHOUSE',
  'TEMA LOGISTICS', 'HEALTHPLUS', 'GOLDFIELDS GH', 'STANBIC BANK',
]

const stats = [
  { value: '4.9★', label: 'average rating' },
  { value: '2,400+', label: 'messages handled daily' },
  { value: 'Zero', label: 'missed messages' },
]

export default function SocialProof() {
  return (
    <section className="py-16 border-y border-white/5 bg-[#08090a] overflow-hidden">
      <p className="text-center text-[#8696a0] text-sm font-medium tracking-widest uppercase mb-8">
        Trusted by businesses across Ghana
      </p>

      {/* Marquee */}
      <div className="relative overflow-hidden mb-12">
        <div className="flex animate-marquee whitespace-nowrap">
          {companies.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 mx-8 text-[#374045] hover:text-[#8696a0] transition-colors font-mono text-sm font-semibold tracking-wider cursor-default"
            >
              <span className="w-1 h-1 rounded-full bg-[#374045]" />
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Trust stats */}
      <div className="max-w-2xl mx-auto px-6 grid grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.value} className="text-center">
            <div className="text-2xl font-mono font-semibold text-white mb-1">{stat.value}</div>
            <div className="text-[#8696a0] text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
