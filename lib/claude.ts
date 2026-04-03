import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface BusinessContext {
  businessName: string
  customInstructions?: string
  faqs?: Array<{ question: string; answer: string }>
  trainingDocs?: string[]
  handoffEnabled?: boolean
  handoffNumber?: string
}

export async function generateReply(
  customerMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: BusinessContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context)

  const messages = [
    ...conversationHistory.slice(-6),
    { role: 'user' as const, content: customerMessage },
  ]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    system: systemPrompt,
    messages,
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : 'How may I further assist you?'
}

function buildSystemPrompt(context: BusinessContext): string {
  const { businessName, customInstructions, faqs, trainingDocs, handoffEnabled, handoffNumber } = context

  let prompt = customInstructions || `You are the WhatsApp AI assistant for ${businessName}.

REPLY STYLE — follow these strictly:
- Keep replies SHORT: 1–3 sentences max, under 50 words.
- Sound human and natural — like a helpful team member texting, not a bot.
- Never use bullet points, numbered lists, or formal headers in replies.
- Skip greetings on every message — get straight to the point.
- For pricing, confirm the product first, then give the price simply.
- Never say "How may I further assist you?" — it sounds robotic.
- Use casual punctuation. Short sentences. Friendly tone.`

  if (handoffEnabled && handoffNumber) {
    prompt += `\n\nHUMAN HANDOFF:
- If the customer has a complaint, is angry, needs something outside your knowledge, or explicitly asks for a human, send them this message exactly: "Let me get someone from the team to help you. Chat them directly here: https://wa.me/${handoffNumber}"
- Only use this handoff message once — do not repeat it if they keep chatting.`
  }

  if (faqs && faqs.length > 0) {
    prompt += '\n\nFREQUENTLY ASKED QUESTIONS:\n'
    faqs.forEach(({ question, answer }) => {
      prompt += `Q: ${question}\nA: ${answer}\n\n`
    })
  }

  if (trainingDocs && trainingDocs.length > 0) {
    prompt += '\n\nBUSINESS INFORMATION:\n'
    trainingDocs.forEach(doc => { prompt += doc.slice(0, 2000) + '\n\n' })
  }

  return prompt
}

export async function generateDemoReply(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `You are a demo AI assistant for WAgenT — an AI WhatsApp automation platform. You are acting as the AI agent for "Accra Electronics Hub", a fictional business, to demonstrate WAgenT's capabilities.

ABOUT ACCRA ELECTRONICS HUB:
- Sells CCTV systems, solar panels, inverters, and electronic accessories
- Hikvision 4-channel kit: GHS 850 (analogue), GHS 1,200 (IP cameras) — both include installation
- Nationwide delivery; Kumasi orders arrive within 48 hours
- Operating hours: Mon–Sat 8am–6pm, AI responds 24/7
- Location: Ring Road Central, Accra

Be concise (under 80 words), helpful, and professional. Show off what an AI agent can do.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: systemPrompt,
    messages: [
      ...history.slice(-4),
      { role: 'user', content: message },
    ],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : 'Thank you for your message! How can I help you today?'
}
