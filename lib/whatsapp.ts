import axios from 'axios'

const WA_VERSION = 'v22.0'
const WA_BASE = `https://graph.facebook.com/${WA_VERSION}`

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
) {
  const response = await axios.post(
    `${WA_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return response.data
}

export async function sendAudioMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  audioUrl: string
) {
  const response = await axios.post(
    `${WA_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'audio',
      audio: { link: audioUrl },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return response.data
}

export async function markMessageRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
) {
  await axios.post(
    `${WA_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')
  return `sha256=${expectedSignature}` === signature
}

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  audio?: { id: string; mime_type: string }
  image?: { id: string; mime_type: string; caption?: string }
}

export function extractMessageFromWebhook(body: any): {
  message: WhatsAppMessage | null
  phoneNumberId: string | null
  businessAccountId: string | null
  contactName: string | null
} {
  try {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]
    const phoneNumberId = value?.metadata?.phone_number_id
    const businessAccountId = entry?.id
    const contactName = value?.contacts?.[0]?.profile?.name || null

    return { message: message || null, phoneNumberId, businessAccountId, contactName }
  } catch {
    return { message: null, phoneNumberId: null, businessAccountId: null, contactName: null }
  }
}
