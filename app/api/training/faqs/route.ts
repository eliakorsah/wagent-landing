import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data } = await supabase.from('faqs').select('*').eq('business_id', business.id).order('display_order')
  return NextResponse.json({ data, success: true })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { question, answer } = await request.json()
  if (!question || !answer) return NextResponse.json({ error: 'question and answer required' }, { status: 400 })
  const { data } = await supabase.from('faqs').insert({ business_id: business.id, question, answer }).select().single()
  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await supabase.from('faqs').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
