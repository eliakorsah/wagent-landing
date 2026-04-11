import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business } = await supabase.from('businesses').select('id, plan').eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Upload to storage
    const filename = `${business.id}/${Date.now()}_${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const { data: upload, error: uploadError } = await serviceClient.storage
      .from('training-docs')
      .upload(filename, arrayBuffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = serviceClient.storage.from('training-docs').getPublicUrl(filename)

    // Create DB record
    const { data: doc } = await serviceClient.from('training_docs').insert({
      business_id: business.id,
      filename: file.name,
      file_url: publicUrl,
      file_size: file.size,
      processing_status: 'queued',
    }).select().single()

    // Process text extraction async (in background)
    extractAndProcess(doc!.id, file, business.id, serviceClient)

    return NextResponse.json({ doc, success: true })
  } catch (e: any) {
    console.error('Training documents POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

async function extractAndProcess(docId: string, file: File, businessId: string, supabase: any) {
  try {
    await supabase.from('training_docs').update({ processing_status: 'processing' }).eq('id', docId)

    let text = ''
    const buffer = await file.arrayBuffer()

    if (file.type === 'application/pdf') {
      const pdfParse = require('pdf-parse')
      const result = await pdfParse(Buffer.from(buffer))
      text = result.text
    } else if (file.name.endsWith('.docx')) {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      text = result.value
    } else {
      text = new TextDecoder().decode(buffer)
    }

    await supabase.from('training_docs').update({
      content_text: text.slice(0, 50000),
      processing_status: 'trained',
    }).eq('id', docId)
  } catch (e) {
    await supabase.from('training_docs').update({ processing_status: 'failed' }).eq('id', docId)
  }
}
