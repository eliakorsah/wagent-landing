'use client'
import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    monthly: 199,
    annual: 166,
    popular: false,
    features: [
      '500 AI replies/month',
      '1 WhatsApp number',
      'FAQ training (up to 20 entries)',
      'Document upload (up to 3 files)',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    monthly: 449,
    annual: 374,
    popular: true,
    features: [
      '2,000 AI replies/month',
      '3 WhatsApp numbers',
      'Unlimited FAQ entries',
      'Document upload (up to 20 files)',
      'Voice message replies',
      'Advanced analytics + export',
      'Priority support',
      'Custom AI instructions',
    ],
  },
  {
    name: 'Business',
    monthly: 899,
    annual: 749,
    popular: false,
    features: [
      'Unlimited AI replies',
      '10 WhatsApp numbers',
      'Everything in Growth',
      'Dedicated onboarding call',
      'Custom AI persona + voice',
      'API access',
      'SLA guarantee',
      'Account manager',
    ],
  },
]

const faqs = [
  {
    q: 'Do I need a Meta developer account?',
    a: "No — we guide you through the WhatsApp Business API setup step by step. If you already have a Meta Business account, it takes about 5 minutes.",
  },
  {
    q: 'What happens when I hit my reply limit?',
    a: 'Your AI agent pauses and we notify you immediately. You can upgrade your plan instantly, or your staff can handle messages manually until the next billing cycle.',
  },
  {
    q: 'Can I train it on my product catalogue?',
    a: 'Yes. Upload PDFs, Word documents, CSV price lists, or plain text files. The AI extracts and learns all product information automatically.',
  },
  {
    q: 'Is my customer data secure?',
    a: "All data is encrypted in transit and at rest. Each business's data is completely isolated using Row Level Security. We are GDPR-compliant and do not use your customer data to train AI models.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — no contracts, no cancellation fees. Cancel from your dashboard settings at any time. You keep access until the end of your billing period.',
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section id="pricing" className="py-24 bg-[#0a0b0c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-serif italic text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-[#8696a0] text-lg mb-8">All plans include a 14-day free trial. No credit card required.</p>

          <div className="inline-flex items-center gap-1 bg-[#0f1012] border border-white/8 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-[#00a884] text-white' : 'text-[#8696a0] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-[#00a884] text-white' : 'text-[#8696a0] hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">2 months free</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-[#0f1012] border-2 border-[#00a884] shadow-[0_0_60px_rgba(0,168,132,0.12)]'
                  : 'bg-[#0f1012] border border-white/6 hover:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#00a884] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="text-white font-semibold text-lg mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-mono font-bold text-white">
                  GHS {annual ? plan.annual : plan.monthly}
                </span>
                <span className="text-[#8696a0] text-sm">/mo</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#8696a0]">
                    <svg className="w-4 h-4 text-[#00a884] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block text-center py-3 rounded-full font-medium text-sm transition-all ${
                  plan.popular
                    ? 'bg-[#00a884] hover:bg-[#00c49a] text-white hover:shadow-[0_0_20px_rgba(0,168,132,0.3)]'
                    : 'border border-white/10 hover:border-white/20 text-white'
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-semibold text-white text-center mb-8">Frequently asked questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/6 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-white font-medium text-sm hover:bg-white/[0.02] transition-colors"
                >
                  {faq.q}
                  <svg
                    className={`w-4 h-4 text-[#8696a0] transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-[#8696a0] text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
