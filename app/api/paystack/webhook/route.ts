import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paystack'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.success') {
      const { metadata, customer } = event.data
      const { businessId, plan, billing } = metadata || {}

      if (!businessId || !plan) return NextResponse.json({ success: true })

      const planExpiry = new Date()
      if (billing === 'annual') {
        planExpiry.setFullYear(planExpiry.getFullYear() + 1)
      } else {
        planExpiry.setMonth(planExpiry.getMonth() + 1)
      }

      await supabase.from('businesses').update({
        plan,
        plan_expires_at: planExpiry.toISOString(),
        paystack_customer_code: customer?.customer_code,
      }).eq('id', businessId)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
