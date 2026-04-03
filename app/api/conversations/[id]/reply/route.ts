import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp'
import { sanitizeInput } from '@/lib/utils'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await request.json()
    if (!content || typeof content !== 'string') return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const sanitized = sanitizeInput(content.trim())

    const { data: business } = await supabase.from('businesses').select('id, phone_number_id, whatsapp_access_token').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: conversation } = await supabase.from('conversations').select('id, customer_phone, status').eq('id', params.id).eq('business_id', business.id).single()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    // Send via WhatsApp if credentials available
    if (business.phone_number_id && business.whatsapp_access_token) {
      await sendTextMessage(business.phone_number_id, business.whatsapp_access_token, conversation.customer_phone, sanitized)
    }

    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await serviceClient.from('messages').insert({
      conversation_id: params.id,
      business_id: business.id,
      from_role: 'staff',
      message_type: 'text',
      content: sanitized,
      status: 'sent',
    })

    await serviceClient.from('conversations').update({
      last_message: sanitized,
      last_message_at: new Date().toISOString(),
    }).eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
