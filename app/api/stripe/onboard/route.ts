import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });

  try {
    let user = null;

    // Try cookie-based auth first (works on web)
    const supabase = await createClient();
    const { data: { user: cookieUser } } = await supabase.auth.getUser();
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check if they already have a Stripe account ID in your database
    const supabaseForQuery = await createClient();
    const { data: profile } = await supabaseForQuery
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .maybeSingle();

    let accountId = profile?.stripe_account_id;

    // 2. If they don't have one, create a new Stripe Standard account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
      });
      accountId = account.id;

      // Save this new ID to their Supabase profile
      await supabaseForQuery
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    // 3. Generate the onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe=refresh`,
      return_url: `${baseUrl}/settings?stripe=success`,
      type: 'account_onboarding',
    });

    // 4. Send the URL back to the frontend so we can redirect them
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Stripe Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}