import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', params.id)
      .eq('business_id', business.id)
      .single()

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const { data } = await supabase
      .from('messages')
      .select('id, from_role, message_type, content, audio_url, created_at, status')
      .eq('conversation_id', params.id)
      .order('created_at')
      .limit(200)

    return NextResponse.json({ data, success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
