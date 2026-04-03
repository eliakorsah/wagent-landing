import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeTransaction, PLANS } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, billing } = await request.json()
    if (!plan || !billing) return NextResponse.json({ error: 'plan and billing required' }, { status: 400 })

    const { data: business } = await supabase.from('businesses').select('id, name').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const planConfig = PLANS[plan as keyof typeof PLANS]?.[billing as 'monthly' | 'annual']
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wagent-africa.com'
    const callbackUrl = `${appUrl}/api/paystack/verify`

    const result = await initializeTransaction(
      user.email!,
      planConfig.amount,
      { businessId: business.id, businessName: business.name, plan, billing },
      callbackUrl
    )

    return NextResponse.json({ authorization_url: result.data?.authorization_url, success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
