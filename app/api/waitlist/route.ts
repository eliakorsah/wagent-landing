import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const WAITLIST_NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || 'hello@lytrixconsult.com'
const FROM_EMAIL = process.env.WAITLIST_FROM_EMAIL || 'Wagent Africa <waitlist@wagent-africa.com>'

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, country, businessType, platform } = body || {}

    if (!email || typeof email !== 'string' || !isEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    const cleanName = (name || '').toString().trim().slice(0, 100)
    const cleanEmail = email.trim().toLowerCase().slice(0, 200)
    const cleanCountry = (country || '').toString().trim().slice(0, 80)
    const cleanBiz = (businessType || '').toString().trim().slice(0, 120)
    const cleanPlatform = (platform || '').toString().trim().slice(0, 40)

    // Gracefully degrade if Resend isn't configured — still returns success
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.log('[waitlist] submission (no RESEND_API_KEY):', {
        cleanName,
        cleanEmail,
        cleanCountry,
        cleanBiz,
        cleanPlatform,
      })
      return NextResponse.json({ success: true })
    }

    const resend = new Resend(resendKey)

    console.log('[waitlist] Sending emails:', { FROM_EMAIL, WAITLIST_NOTIFY_EMAIL, cleanEmail })

    const internalHtml = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; max-width: 600px;">
        <h2 style="color:#D4AF37; margin:0 0 16px;">New Wagent Africa waitlist signup</h2>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:8px; color:#666;">Name</td><td style="padding:8px;"><strong>${cleanName || '—'}</strong></td></tr>
          <tr><td style="padding:8px; color:#666;">Email</td><td style="padding:8px;"><strong>${cleanEmail}</strong></td></tr>
          <tr><td style="padding:8px; color:#666;">Country</td><td style="padding:8px;">${cleanCountry || '—'}</td></tr>
          <tr><td style="padding:8px; color:#666;">Business</td><td style="padding:8px;">${cleanBiz || '—'}</td></tr>
          <tr><td style="padding:8px; color:#666;">Platform</td><td style="padding:8px;">${cleanPlatform || '—'}</td></tr>
          <tr><td style="padding:8px; color:#666;">Time</td><td style="padding:8px;">${new Date().toISOString()}</td></tr>
        </table>
      </div>
    `

    const customerHtml = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; max-width: 600px; color:#0D0D0D;">
        <h1 style="font-family: 'Playfair Display', serif; margin:0 0 16px; font-size:28px;">You're on the list.</h1>
        <p style="font-size:16px; line-height:1.6; color:#333;">
          Hi${cleanName ? ' ' + cleanName.split(' ')[0] : ''},
        </p>
        <p style="font-size:16px; line-height:1.6; color:#333;">
          Thanks for joining the Wagent Africa waitlist. We're putting the final polish on the app and you'll
          be among the first to get it when we launch — along with an exclusive early-access discount.
        </p>
        <p style="font-size:16px; line-height:1.6; color:#333;">
          In the meantime, follow us for build updates. We're launching soon.
        </p>
        <p style="font-size:14px; color:#666; margin-top:32px;">
          — The Wagent Africa team<br/>
          <em>Powered by Lytrix Consult</em>
        </p>
      </div>
    `

    const [internalResult, customerResult] = await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to: WAITLIST_NOTIFY_EMAIL,
        subject: `New waitlist signup — ${cleanEmail}`,
        html: internalHtml,
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: cleanEmail,
        subject: "You're on the Wagent Africa waitlist",
        html: customerHtml,
      }),
    ])

    console.log('[waitlist] Email results:', { internalResult, customerResult })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[waitlist] error:', e?.message || e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
