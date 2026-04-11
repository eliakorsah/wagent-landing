import 'server-only'
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

export async function sendImageMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  imageUrl: string,
  caption?: string
) {
  const response = await axios.post(
    `${WA_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
  return response.data
}

export async function sendDocumentMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  documentUrl: string,
  filename: string
) {
  const response = await axios.post(
    `${WA_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: { link: documentUrl, filename },
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
  return response.data
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

// Download media (voice notes, images) from WhatsApp
export async function downloadMedia(
  mediaId: string,
  accessToken: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Step 1: Get the media URL
  const metaRes = await axios.get(`${WA_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const mediaUrl = metaRes.data.url
  const mimeType = metaRes.data.mime_type || 'audio/ogg'

  // Step 2: Download the actual file
  const fileRes = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'arraybuffer',
  })

  return { buffer: Buffer.from(fileRes.data), mimeType }
}

// Transcribe audio using OpenAI Whisper API (or fall back to a placeholder)
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return '[Voice message received]'

  const FormData = (await import('form-data')).default
  const form = new FormData()
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
  form.append('file', audioBuffer, { filename: `audio.${ext}`, contentType: mimeType })
  form.append('model', 'whisper-1')

  const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
  })
  return res.data.text || '[Voice message received]'
}

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  audio?: { id: string; mime_type: string }
  image?: { id: string; mime_type: string; caption?: string }
  document?: { id: string; mime_type: string; filename?: string; caption?: string }
  video?: { id: string; mime_type: string; caption?: string }
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
