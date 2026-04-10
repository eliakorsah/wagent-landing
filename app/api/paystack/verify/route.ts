import { NextRequest, NextResponse } from 'next/server'
import { verifyTransaction } from '@/lib/paystack'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Paystack redirects here after payment: GET /api/paystack/verify?reference=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(new URL('/dashboard/upgrade?status=failed', request.url))
  }

  try {
    const result = await verifyTransaction(reference)

    if (result.data?.status !== 'success') {
      return NextResponse.redirect(new URL('/dashboard/upgrade?status=failed', request.url))
    }

    const { metadata, customer } = result.data
    const { businessId, plan, billing } = metadata || {}

    if (!businessId || !plan) {
      return NextResponse.redirect(new URL('/dashboard?payment=error', request.url))
    }

    // Set plan expiry
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

    // Redirect to dashboard with success flag
    return NextResponse.redirect(
      new URL(`/dashboard?payment=success&plan=${plan}`, request.url)
    )
  } catch (e) {
    console.error('Paystack verify error:', e)
    return NextResponse.redirect(new URL('/dashboard/upgrade?status=failed', request.url))
  }
}
