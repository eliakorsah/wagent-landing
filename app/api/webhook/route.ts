import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractMessageFromWebhook, sendTextMessage, sendAudioMessage, markMessageRead } from '@/lib/whatsapp'
import { generateReply } from '@/lib/claude'
import { textToSpeech } from '@/lib/elevenlabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe') {
    // Check against stored verify tokens for any business
    const { data: businesses } = await supabase
      .from('businesses')
      .select('whatsapp_verify_token')
      .eq('whatsapp_verify_token', token)
      .limit(1)

    if (businesses && businesses.length > 0) {
      return new NextResponse(challenge, { status: 200 })
    }

    // Also check env var for system-level token
    if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — receive messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Ignore status updates
    if (body?.entry?.[0]?.changes?.[0]?.value?.statuses) {
      return NextResponse.json({ success: true })
    }

    const { message, phoneNumberId, businessAccountId } = extractMessageFromWebhook(body)
    if (!message || !phoneNumberId) {
      return NextResponse.json({ success: true })
    }

    // Find the business by phone number ID
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('phone_number_id', phoneNumberId)
      .single()

    if (!business || !business.auto_reply) {
      return NextResponse.json({ success: true })
    }

    // Block expired trials — don't auto-reply
    if (
      business.plan === 'trial' &&
      business.plan_expires_at &&
      new Date(business.plan_expires_at) < new Date()
    ) {
      return NextResponse.json({ success: true })
    }

    // Only handle text messages for now
    if (message.type !== 'text' || !message.text?.body) {
      return NextResponse.json({ success: true })
    }

    const customerPhone = message.from
    const customerText = message.text.body

    // Mark as read
    await markMessageRead(phoneNumberId, business.whatsapp_access_token, message.id)

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('customer_phone', customerPhone)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_phone: customerPhone,
          status: 'ai_active',
          last_message: customerText,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()
      conversation = newConv
    } else {
      await supabase.from('conversations').update({
        last_message: customerText,
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1,
      }).eq('id', conversation.id)
    }

    if (!conversation) return NextResponse.json({ success: true })

    // Save customer message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      business_id: business.id,
      from_role: 'customer',
      message_type: 'text',
      content: customerText,
      whatsapp_message_id: message.id,
    })

    // If conversation is in manual mode, don't auto-reply
    if (conversation.status === 'manual') {
      return NextResponse.json({ success: true })
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('from_role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    const chatHistory = (history || []).map(m => ({
      role: (m.from_role === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content || '',
    }))

    // Get business context
    const [{ data: faqsData }, { data: docsData }] = await Promise.all([
      supabase.from('faqs').select('question, answer').eq('business_id', business.id).limit(20),
      supabase.from('training_docs').select('content_text').eq('business_id', business.id).eq('processing_status', 'trained').limit(5),
    ])

    // Apply reply delay
    if (business.reply_delay_seconds > 0) {
      await new Promise(resolve => setTimeout(resolve, business.reply_delay_seconds * 1000))
    }

    // Generate AI reply
    const aiText = await generateReply(customerText, chatHistory, {
      businessName: business.name,
      customInstructions: business.custom_instructions,
      faqs: faqsData || [],
      trainingDocs: (docsData || []).map(d => d.content_text).filter(Boolean),
      handoffEnabled: business.handoff_enabled,
      handoffNumber: business.handoff_whatsapp_number || undefined,
    })

    // Decide: voice or text?
    const useVoice = business.voice_enabled && Math.random() < 0.3
    let audioUrl: string | null = null
    let messageType: 'text' | 'audio' = 'text'

    if (useVoice && business.elevenlabs_api_key) {
      try {
        const audioBuffer = await textToSpeech(aiText, undefined, business.elevenlabs_api_key)
        const filename = `voice/${business.id}/${Date.now()}.mp3`
        const { data: upload } = await supabase.storage.from('voice-messages').upload(filename, audioBuffer, { contentType: 'audio/mpeg' })
        if (upload) {
          const { data: { publicUrl } } = supabase.storage.from('voice-messages').getPublicUrl(filename)
          audioUrl = publicUrl
          messageType = 'audio'
        }
      } catch (e) {
        // Fall back to text
      }
    }

    // Send to WhatsApp
    if (messageType === 'audio' && audioUrl) {
      await sendAudioMessage(phoneNumberId, business.whatsapp_access_token, customerPhone, audioUrl)
    } else {
      await sendTextMessage(phoneNumberId, business.whatsapp_access_token, customerPhone, aiText)
    }

    // Save AI message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      business_id: business.id,
      from_role: 'ai',
      message_type: messageType,
      content: aiText,
      audio_url: audioUrl,
      status: 'sent',
    })

    await supabase.from('conversations').update({
      last_message: aiText,
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    }).eq('id', conversation.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
