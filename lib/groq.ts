import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface BusinessContext {
  businessName: string
  customInstructions?: string
  faqs?: Array<{ question: string; answer: string }>
  trainingDocs?: string[]
}

export async function generateReply(
  customerMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: BusinessContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context)

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: customerMessage },
  ]

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    max_tokens: 300,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || 'Thank you for your message. How may I assist you?'
}

function buildSystemPrompt(context: BusinessContext): string {
  const { businessName, customInstructions, faqs, trainingDocs } = context

  let prompt = customInstructions || `You are the official AI assistant for ${businessName} on WhatsApp.

COMMUNICATION RULES:
- Be professional, helpful, and concise.
- Keep all replies under 150 words.
- Address queries directly and professionally.
- For pricing enquiries, confirm the specific product before quoting.
- For complaints, offer to escalate to a human team member.
- End every reply with: "How may I further assist you?"
- Never discuss competitor products or pricing.`

  if (faqs && faqs.length > 0) {
    prompt += '\n\nFREQUENTLY ASKED QUESTIONS:\n'
    faqs.forEach(({ question, answer }) => {
      prompt += `Q: ${question}\nA: ${answer}\n\n`
    })
  }

  if (trainingDocs && trainingDocs.length > 0) {
    prompt += '\n\nBUSINESS INFORMATION:\n'
    trainingDocs.forEach(doc => {
      prompt += doc.slice(0, 2000) + '\n\n'
    })
  }

  return prompt
}

export async function generateDemoReply(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `You are a demo AI assistant for WAgenT - an AI WhatsApp agent platform for Ghanaian businesses. You are demonstrating how WAgenT works for a fictional electronics business called "Accra Electronics Hub".

ABOUT ACCRA ELECTRONICS HUB:
- We sell CCTV systems, solar panels, inverters, and electronic accessories
- Hikvision 4-channel kit: GHS 850 (analogue), GHS 1,200 (IP cameras) - both include installation
- We deliver nationwide, Kumasi orders arrive within 48 hours
- Operating hours: Mon-Sat 8am-6pm, but AI responds 24/7
- Location: Ring Road Central, Accra

COMMUNICATION RULES:
- Be professional and helpful
- Keep replies under 100 words
- Respond naturally as a business WhatsApp agent would
- Show off WAgenT capabilities naturally`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4),
      { role: 'user', content: message },
    ],
    max_tokens: 200,
    temperature: 0.8,
  })

  return completion.choices[0]?.message?.content || 'Thank you for your message! How can I help you today?'
}
