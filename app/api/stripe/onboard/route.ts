import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/app/lib/supabase/server'; // Adjust if your path is different

export async function POST(req: Request) {
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});



  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check if they already have a Stripe account ID in your database
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .maybeSingle(); // ✅ Safe!

    let accountId = profile?.stripe_account_id;

    // 2. If they don't have one, create a new Stripe Standard account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
      });
      accountId = account.id;

      // Save this new ID to their Supabase profile
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    // 3. Generate the onboarding link
    // Stripe needs to know where to send them if they hit "Back" or finish the process
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe=refresh`, // If the link expires, send them here
      return_url: `${baseUrl}/settings?stripe=success`,  // When they finish, send them here
      type: 'account_onboarding',
    });

    // 4. Send the URL back to the frontend so we can redirect them
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Stripe Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
