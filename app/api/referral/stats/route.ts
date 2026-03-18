import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. Fetch the user's newly generated referral code from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // 2. Build the link (with a safe fallback just in case)
    const activeCode = profile?.referral_code || user.id;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vimciety.com';
    const referralLink = `${baseUrl}/referral?ref=${activeCode}`;

    // 3. Bypass the RPC function and query the referrals table directly
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    if (error) {
      console.error('Referral fetch error:', error);
      // Failsafe: return the link even if the stats fail so the UI doesn't hang
      return NextResponse.json({ 
        link: referralLink,
        total_referrals: 0, 
        pending_referrals: 0, 
        paid_referrals: 0, 
        total_earned: 0 
      }, { status: 200 });
    }

    // 4. Set up safe default stats
    let total = 0;
    let pending = 0;
    let paid = 0;
    let earned = 0;

    // 5. If we found referrals, count them up safely by status
    if (referrals) {
      total = referrals.length;
      
      // Count exactly how many are in each stage
      pending = referrals.filter(r => r.status === 'pending').length;
      paid = referrals.filter(r => r.status === 'paid').length;
      
      // Calculate the total money earned! (Assuming $5 per successful referral)
      earned = paid * 5; 
    }

    // 6. Return the calculated stats PLUS the generated link
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