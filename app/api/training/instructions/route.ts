import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { instructions } = await request.json()
    if (!instructions || typeof instructions !== 'string') {
      return NextResponse.json({ error: 'instructions required' }, { status: 400 })
    }

    const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await supabase.from('businesses').update({ custom_instructions: instructions }).eq('id', business.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
