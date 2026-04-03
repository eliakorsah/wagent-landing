import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Business {
  id: string;
  referral_code: string | null;
  referred_by: string | null;
  referred_count: number;
  referral_reward_claimed: boolean;
}

interface ReferralStatsResponse {
  referralCode: string | null;
  referredCount: number;
  rewardClaimed: boolean;
  rewardUnlocked: boolean;
}

interface ApplyCodeBody {
  action: 'apply';
  code: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Supabase client that bypasses RLS using the service role key.
 * Only used for trusted server-side writes.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createServiceClient(url, key, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// GET /api/referrals
// Returns the authenticated user's referral stats.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();

    // 1. Authenticate the caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch this user's business record
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, referral_code, referred_by, referred_count, referral_reward_claimed')
      .eq('user_id', user.id)
      .single<Business>();

    if (bizError || !business) {
      return NextResponse.json(
        { error: bizError?.message ?? 'Business record not found.' },
        { status: 404 }
      );
    }

    // 3. Build and return stats
    const payload: ReferralStatsResponse = {
      referralCode: business.referral_code,
      referredCount: business.referred_count ?? 0,
      rewardClaimed: business.referral_reward_claimed ?? false,
      rewardUnlocked: (business.referred_count ?? 0) >= 3,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/referrals]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/referrals
// Body: { action: 'apply', code: string }
// Applies a referral code to the authenticated user's business during onboarding.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();

    // 1. Authenticate the caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate the request body
    let body: ApplyCodeBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (body.action !== 'apply') {
      return NextResponse.json(
        { error: `Unknown action "${body.action}". Expected "apply".` },
        { status: 400 }
      );
    }

    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 });
    }

    // 3. Fetch the new business (the caller)
    const { data: newBusiness, error: newBizError } = await supabase
      .from('businesses')
      .select('id, referral_code, referred_by')
      .eq('user_id', user.id)
      .single<Pick<Business, 'id' | 'referral_code' | 'referred_by'>>();

    if (newBizError || !newBusiness) {
      return NextResponse.json(
        { error: newBizError?.message ?? 'Your business record was not found.' },
        { status: 404 }
      );
    }

    // 4. Prevent using their own referral code
    if (newBusiness.referral_code?.toUpperCase() === code) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code.' },
        { status: 400 }
      );
    }

    // 5. Prevent applying a referral code more than once
    if (newBusiness.referred_by) {
      return NextResponse.json(
        { error: 'A referral code has already been applied to your account.' },
        { status: 409 }
      );
    }

    // Switch to a service-role client for the writes below so RLS does not
    // block cross-business updates.
    const serviceClient = getServiceClient();

    // 6. Validate that the referral code belongs to an existing business
    const { data: referrer, error: referrerError } = await serviceClient
      .from('businesses')
      .select('id, referred_count')
      .eq('referral_code', code)
      .single<Pick<Business, 'id' | 'referred_count'>>();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Referral code not found. Please check and try again.' },
        { status: 404 }
      );
    }

    // 7. Mark the new business as referred
    const { error: applyError } = await serviceClient
      .from('businesses')
      .update({ referred_by: code })
      .eq('id', newBusiness.id);

    if (applyError) {
      console.error('[POST /api/referrals] applyError:', applyError);
      return NextResponse.json(
        { error: 'Failed to apply referral code. Please try again.' },
        { status: 500 }
      );
    }

    // 8. Increment the referrer's referred_count
    const { error: incrementError } = await serviceClient
      .from('businesses')
      .update({ referred_count: (referrer.referred_count ?? 0) + 1 })
      .eq('id', referrer.id);

    if (incrementError) {
      // Non-fatal: the code was applied; just log the increment failure.
      console.error('[POST /api/referrals] incrementError:', incrementError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/referrals]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
