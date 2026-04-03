import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/platform-config'

// Public endpoint — only exposes safe, non-sensitive config values
export async function GET() {
  const lytrixWaNumber = await getConfig(
    'lytrix_wa_number',
    process.env.NEXT_PUBLIC_LYTRIX_WA_NUMBER || '233XXXXXXXXX'
  )
  return NextResponse.json({ lytrix_wa_number: lytrixWaNumber })
}
