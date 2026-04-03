'use client'

const testimonials = [
  {
    quote: "We used to miss 40+ messages after closing. Now our AI handles everything. Revenue from WhatsApp went up 30% in the first month.",
    author: 'Kofi Agyemang',
    role: 'Owner · Accra Electronics Hub',
  },
  {
    quote: "Setup took 8 minutes. The AI knew our entire price list by the time I finished my tea. Customers think they're talking to a person.",
    author: 'Abena Mensah',
    role: 'Manager · Kumasi Pharmacy',
  },
  {
    quote: "The voice message feature is what sold me. Our customers actually respond faster to voice than text. Brilliant product.",
    author: 'Emmanuel Darko',
    role: 'CEO · Tema Logistics',
  },
  {
    quote: "We handle 200+ WhatsApp enquiries a day. WAgenT manages all of them without a single miss. The ROI is incredible.",
    author: 'Ama Asante',
    role: 'Director · HealthPlus Clinics',
  },
  {
    quote: "Our competitors are still typing manually at 2am. We're asleep while our AI closes deals. This is the future.",
    author: 'Kwabena Frimpong',
    role: 'MD · Regimanuel Properties',
  },
  {
    quote: "The training section is genius. I uploaded our product catalogue PDF and the AI instantly knew every price and spec. Unreal.",
    author: 'Grace Boateng',
    role: 'Owner · Accra Bakehouse',
  },
]

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="flex-shrink-0 w-80 bg-[#0f1012] border border-white/6 rounded-2xl p-6 mx-3">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p className="text-[#e9edef] text-sm leading-relaxed mb-4">"{quote}"</p>
      <div>
        <div className="text-white font-medium text-sm">{author}</div>
        <div className="text-[#8696a0] text-xs">{role}</div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const row1 = [...testimonials, ...testimonials]
  const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)]

  return (
    <section id="testimonials" className="py-24 bg-[#08090a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-4xl lg:text-5xl font-serif italic text-white mb-4">
          Businesses love WAgenT
        </h2>
        <p className="text-[#8696a0] text-lg">Join hundreds of businesses across Ghana already automating their WhatsApp.</p>
      </div>

      <div className="space-y-4">
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee">
            {row1.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee-reverse">
            {row2.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
