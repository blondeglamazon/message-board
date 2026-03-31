import { createClient } from '@/app/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  try {
    let user = null;

    // Try cookie-based auth first (works on web)
    const supabase = await createClient()
    const { data: { user: cookieUser } } = await supabase.auth.getUser()

    if (cookieUser) {
      user = cookieUser;
    } else {
      // Fallback: read Bearer token from Authorization header (works on mobile)
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseService = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user: tokenUser } } = await supabaseService.auth.getUser(token);
        user = tokenUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. Fetch the user's referral code from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Build the link
    const activeCode = profile?.referral_code || user.id;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vimciety.com';
    const referralLink = `${baseUrl}/referral?ref=${activeCode}`;

    // 3. Query the referrals table directly
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    if (error) {
      console.error('Referral fetch error:', error);
      return NextResponse.json({ 
        link: referralLink,
        total_referrals: 0, 
        pending_referrals: 0, 
        paid_referrals: 0, 
        total_earned: 0 
      }, { status: 200 });
    }

    // 4. Calculate stats
    let total = 0;
    let pending = 0;
    let paid = 0;
    let earned = 0;

    if (referrals) {
      total = referrals.length;
      pending = referrals.filter(r => r.status === 'pending').length;
      paid = referrals.filter(r => r.status === 'paid').length;
      earned = paid * 0.05; 
    }

    // 5. Return stats
    return NextResponse.json({
      link: referralLink,
      total_referrals: total,
      pending_referrals: pending,
      paid_referrals: paid,
      total_earned: earned
    });

  } catch (err) {
    console.error('Referral stats API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}