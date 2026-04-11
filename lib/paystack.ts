import 'server-only'
import axios from 'axios'

const PAYSTACK_BASE = 'https://api.paystack.co'

export const PLANS = {
  starter: {
    monthly: { amount: 19900, code: 'PLN_starter_monthly' },
    annual: { amount: 199000, code: 'PLN_starter_annual' },
  },
  growth: {
    monthly: { amount: 44900, code: 'PLN_growth_monthly' },
    annual: { amount: 449000, code: 'PLN_growth_annual' },
  },
  business: {
    monthly: { amount: 89900, code: 'PLN_business_monthly' },
    annual: { amount: 899000, code: 'PLN_business_annual' },
  },
}

export async function initializeTransaction(
  email: string,
  amount: number,
  metadata: Record<string, any>,
  callbackUrl?: string
) {
  const response = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount,
      metadata,
      currency: 'GHS',
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return response.data
}

export async function verifyTransaction(reference: string) {
  const response = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    }
  )
  return response.data
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex')
  return hash === signature
}
